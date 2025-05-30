import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
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

    // Récupérer l'historique des QR codes
    const { data: qrCodes, error: qrError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20); // Limiter à 20 résultats récents

    if (qrError) {
      console.error("Erreur lors de la récupération de l'historique:", qrError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la récupération de l'historique",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transformer les données pour l'affichage
    const formattedQrCodes = qrCodes.map((qr) => ({
      id: qr.id,
      iban: qr.iban,
      amount: qr.amount,
      communication: qr.communication || "",
      beneficiary: qr.beneficiary || "",
      created_at: qr.created_at,
      download_count: qr.download_count,
      custom_colors: qr.custom_colors,
      // Ajouter des champs formatés pour l'affichage
      formatted_date: new Date(qr.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      formatted_amount: `${qr.amount.toFixed(2)}€`,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedQrCodes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
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
