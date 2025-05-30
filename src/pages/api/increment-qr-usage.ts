import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Récupérer l'ID utilisateur depuis la requête
    const { userId } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "ID utilisateur manquant",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Incrémentation usage QR pour utilisateur:", userId);

    // Vérifier d'abord si l'utilisateur peut créer un QR code
    const { data: canCreate, error: canCreateError } = await supabase.rpc(
      "can_create_qr_code",
      {
        user_uuid: userId,
      }
    );

    if (canCreateError) {
      console.error(
        "Erreur lors de la vérification des permissions:",
        canCreateError
      );
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la vérification des permissions",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!canCreate) {
      return new Response(
        JSON.stringify({
          error: true,
          message:
            "Limite atteinte. Veuillez upgrader votre plan ou acheter des crédits.",
          hasReachedLimit: true,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Consommer un crédit/incrémenter le compteur
    const { data: consumed, error: consumeError } = await supabase.rpc(
      "consume_qr_credit",
      {
        user_uuid: userId,
      }
    );

    if (consumeError) {
      console.error("Erreur lors de la consommation du crédit:", consumeError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la consommation du crédit",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!consumed) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Impossible de consommer le crédit",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les statistiques mises à jour
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", userId)
      .single();

    if (statsError) {
      console.error("Erreur lors de la récupération des stats:", statsError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la récupération des statistiques",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Crédit consommé avec succès:", userStats);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          qr_codes_used_this_month: userStats.qr_codes_used_this_month,
          available_credits: userStats.available_credits,
          current_plan_type: userStats.current_plan_type,
          hasReachedLimit: false, // Si on arrive ici, c'est que l'utilisateur peut encore créer
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur dans l'API increment-qr-usage:", error);

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
