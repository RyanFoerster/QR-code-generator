import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { createStripeCustomer } from "../../../lib/stripe";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();
    const terms = formData.get("terms");

    // Validation des données
    if (!email || !password || !confirmPassword || !terms) {
      return new Response("Tous les champs sont requis", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new Response("Les mots de passe ne correspondent pas", {
        status: 400,
      });
    }

    if (password.length < 6) {
      return new Response(
        "Le mot de passe doit contenir au moins 6 caractères",
        {
          status: 400,
        }
      );
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Erreur lors de l'inscription:", error);
      return new Response(error.message, { status: 500 });
    }

    if (!data.user) {
      return new Response("Erreur lors de la création du compte", {
        status: 500,
      });
    }

    // Créer un client Stripe (optionnel mais utile pour plus tard)
    try {
      const stripeCustomer = await createStripeCustomer(email, data.user.id);

      // Attendre un peu que le trigger crée le profil
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mettre à jour le stripe_customer_id
      const { error: updateError } = await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq("id", data.user.id);

      if (updateError) {
        console.error(
          "Erreur lors de la mise à jour du customer ID:",
          updateError
        );
        // Ne pas faire échouer l'inscription pour autant
      }
    } catch (stripeError) {
      console.error(
        "Erreur lors de la création du client Stripe:",
        stripeError
      );
      // Ne pas faire échouer l'inscription pour autant
    }

    // Si l'utilisateur est confirmé automatiquement, le connecter
    if (data.session) {
      const { access_token, refresh_token } = data.session;

      // Définir les cookies d'authentification
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

      // Rediriger vers le tableau de bord
      return redirect("/dashboard");
    }

    // Si confirmation par email nécessaire
    return redirect("/auth/confirm?email=" + encodeURIComponent(email));
  } catch (error) {
    console.error("Erreur inattendue lors de l'inscription:", error);
    return new Response("Une erreur inattendue s'est produite", {
      status: 500,
    });
  }
};
