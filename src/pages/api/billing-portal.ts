import type { APIRoute } from "astro";
import Stripe from "stripe";
import { supabase } from "../../lib/supabase";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
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

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
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

    // Vérifier que l'utilisateur a un customer_id Stripe
    if (!userProfile.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Aucun abonnement Stripe trouvé",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les statistiques utilisateur pour le logging
    const { data: userStats } = await supabase
      .from("user_stats")
      .select("current_plan_type")
      .eq("id", user.id)
      .single();

    console.log("Création du portail de facturation pour:", {
      userId: user.id,
      customerId: userProfile.stripe_customer_id,
      planType: userStats?.current_plan_type || "unknown",
    });

    // Créer la session du portail de facturation
    const session = await stripe.billingPortal.sessions.create({
      customer: userProfile.stripe_customer_id,
      return_url: `${import.meta.env.PUBLIC_APP_URL}/pricing`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la création du portail de facturation:",
      error
    );

    let message = "Erreur lors de l'accès au portail de facturation";
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
