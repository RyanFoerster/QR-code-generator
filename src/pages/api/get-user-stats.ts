import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Récupérer l'ID utilisateur depuis la requête
    const { userId } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID utilisateur manquant",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📊 Récupération des stats pour utilisateur:", userId);

    // Récupérer les statistiques depuis la vue user_stats
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", userId)
      .single();

    if (statsError) {
      console.error("❌ Erreur lors de la récupération des stats:", statsError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Erreur lors de la récupération des statistiques",
          error: statsError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!userStats) {
      console.error(
        "❌ Aucune statistique trouvée pour l'utilisateur:",
        userId
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: "Utilisateur non trouvé",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Stats récupérées:", userStats);

    return new Response(
      JSON.stringify({
        success: true,
        data: userStats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erreur dans l'API get-user-stats:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Erreur interne du serveur",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
