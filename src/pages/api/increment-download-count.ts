import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

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

    // Récupérer l'ID du QR code
    const { qrCodeId } = await request.json();

    if (!qrCodeId) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "ID du QR code manquant",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Incrémenter le compteur de téléchargements
    const { data, error } = await supabase.rpc("increment_download_count", {
      qr_code_id: qrCodeId,
    });

    if (error) {
      console.error("Erreur lors de l'incrémentation du compteur:", error);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de l'incrémentation du compteur",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Compteur incrémenté avec succès",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'incrémentation du compteur:", error);
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
