import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    // Validation des données
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Email et mot de passe requis",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Le mot de passe doit contenir au moins 6 caractères",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Créer l'utilisateur avec Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${import.meta.env.PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error("Erreur Supabase signup:", error);

      // Messages d'erreur spécifiques
      let message = "Erreur lors de la création du compte";
      if (error.message.includes("already registered")) {
        message = "Cette adresse email est déjà utilisée";
      } else if (error.message.includes("invalid email")) {
        message = "Adresse email invalide";
      } else if (error.message.includes("weak password")) {
        message = "Mot de passe trop faible";
      }

      return new Response(
        JSON.stringify({
          error: true,
          message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la création du compte",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Utilisateur créé avec succès:", data.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at !== null,
        },
        message: "Compte créé avec succès",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);

    return new Response(
      JSON.stringify({
        error: true,
        message: "Erreur interne du serveur",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
