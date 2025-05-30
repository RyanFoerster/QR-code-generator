import type { APIRoute } from "astro";
import Stripe from "stripe";
import { supabase } from "../../lib/supabase";
import { STRIPE_PLANS } from "../../lib/stripe-config";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { planType } = await request.json();

    // Vérifier l'authentification
    const accessToken = cookies.get("sb-access-token");
    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Non autorisé",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken.value);
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Utilisateur non trouvé",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les statistiques utilisateur avec la nouvelle vue
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", user.id)
      .single();

    if (statsError || !userStats) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Profil utilisateur non trouvé",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer aussi les informations de base pour stripe_customer_id et subscription_stripe_id
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("stripe_customer_id, subscription_stripe_id")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Informations utilisateur non trouvées",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validation du plan
    if (!STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Plan invalide",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier si l'utilisateur a déjà le plan Premium (sauf pour les crédits qui peuvent être rachetés)
    if (userStats.current_plan_type === "premium" && planType === "premium") {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Vous avez déjà ce plan",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];

    console.log("Changement d'abonnement pour:", {
      userId: user.id,
      currentPlanType: userStats.current_plan_type,
      newTier: planType,
      userEmail: user.email,
    });

    // Créer ou récupérer le customer Stripe
    let customer;
    if (userProfile.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(
          userProfile.stripe_customer_id
        );
      } catch (error) {
        console.log("Customer Stripe non trouvé, création d'un nouveau");
        customer = null;
      }
    }

    if (!customer) {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log("Customer Stripe existant trouvé:", customer.id);

        // Mettre à jour le customer_id dans Supabase
        await supabase
          .from("users")
          .update({ stripe_customer_id: customer.id })
          .eq("id", user.id);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
            plan_type: planType,
          },
        });
        console.log("Nouveau customer Stripe créé:", customer.id);

        // Sauvegarder le customer_id dans Supabase
        await supabase
          .from("users")
          .update({ stripe_customer_id: customer.id })
          .eq("id", user.id);
      }
    }

    // Gestion des abonnements existants
    if (userProfile.subscription_stripe_id) {
      // L'utilisateur a déjà un abonnement, on doit l'annuler
      try {
        await stripe.subscriptions.cancel(userProfile.subscription_stripe_id);
        console.log("Abonnement annulé:", userProfile.subscription_stripe_id);
      } catch (error) {
        console.error("Erreur lors de l'annulation de l'abonnement:", error);
      }
    }

    // Configuration de la session de checkout
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id as string,
      payment_method_types: ["card"],
      success_url: `${import.meta.env.PUBLIC_APP_URL}/pricing?success=true`,
      cancel_url: `${import.meta.env.PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        user_email: user.email || "",
        change_subscription: "true",
      },
    };

    // Configuration spécifique selon le type de plan
    if (planType === "one_time") {
      // Paiement unique
      sessionConfig.mode = "payment";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: `${plan.features.join(" • ")}`,
              images: [`${import.meta.env.PUBLIC_APP_URL}/qr-icon.png`],
            },
            unit_amount: Math.round(plan.price * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ];
    } else if (planType === "premium") {
      // Abonnement récurrent
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: `${plan.features.join(" • ")}`,
              images: [`${import.meta.env.PUBLIC_APP_URL}/qr-icon.png`],
            },
            unit_amount: Math.round(plan.price * 100), // Convertir en centimes
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ];
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(
      "Session Stripe créée pour changement d'abonnement:",
      session.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url || "",
        customerId: customer.id as string,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors du changement d'abonnement:", error);

    let message = "Erreur lors du changement d'abonnement";
    if (error instanceof Stripe.errors.StripeError) {
      message = `Erreur Stripe: ${error.message}`;
    }

    return new Response(
      JSON.stringify({
        error: true,
        message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
