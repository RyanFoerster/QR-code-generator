import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { createStripeCustomer } from "../../../lib/stripe";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return new Response("Code d'autorisation manquant", { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      authCode
    );

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    const { access_token, refresh_token } = data.session;
    const user = data.user;

    // Vérifier si l'utilisateur existe déjà dans notre table
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Si l'utilisateur n'existe pas, le profil sera créé automatiquement par le trigger
    // Nous devons juste mettre à jour le stripe_customer_id
    if (!existingUser) {
      try {
        // Créer un client Stripe
        const stripeCustomer = await createStripeCustomer(user.email!, user.id);

        // Attendre un peu que le trigger crée le profil
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mettre à jour le stripe_customer_id
        const { error: updateError } = await supabase
          .from("users")
          .update({ stripe_customer_id: stripeCustomer.id })
          .eq("id", user.id);

        if (updateError) {
          console.error(
            "Erreur lors de la mise à jour du customer ID OAuth:",
            updateError
          );
        }
      } catch (stripeError) {
        console.error(
          "Erreur lors de la création du client Stripe:",
          stripeError
        );
      }
    }

    // Définir les cookies
    cookies.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    cookies.set("sb-refresh-token", refresh_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return redirect("/dashboard");
  } catch (error) {
    console.error("Erreur lors du callback OAuth:", error);
    return new Response("Erreur lors de l'authentification", { status: 500 });
  }
};
