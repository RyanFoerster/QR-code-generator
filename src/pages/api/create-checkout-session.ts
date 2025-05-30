import type { APIRoute } from "astro";
import Stripe from "stripe";
import { STRIPE_PLANS } from "../../lib/stripe-config";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { planType, userEmail, userId } = await request.json();

    // Validation des données
    if (!planType || !userEmail || !userId) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Données manquantes pour créer la session de paiement",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que le plan existe
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

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];

    console.log("Création session Stripe pour:", {
      planType,
      userEmail,
      userId,
    });

    // Créer ou récupérer le customer Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log("Customer Stripe existant trouvé:", customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
          plan_type: planType,
        },
      });
      console.log("Nouveau customer Stripe créé:", customer.id);
    }

    // Configuration de base pour la session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      payment_method_types: ["card"],
      success_url: `${
        import.meta.env.PUBLIC_APP_URL
      }/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        import.meta.env.PUBLIC_APP_URL
      }/auth/register?cancelled=true`,
      metadata: {
        user_id: userId,
        plan_type: planType,
        user_email: userEmail,
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

      // Ajouter une période d'essai si souhaité (optionnel)
      // sessionConfig.subscription_data = {
      //   trial_period_days: 7,
      // };
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("Session Stripe créée:", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
        customerId: customer.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);

    let message = "Erreur lors de la création de la session de paiement";
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
