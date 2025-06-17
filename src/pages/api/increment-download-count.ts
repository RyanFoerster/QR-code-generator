import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Récupérer l'ID du QR code depuis le corps de la requête
    const body = await request.json();
    const { qrCodeId } = body;

    console.log(`API increment-download-count appelée avec ID: ${qrCodeId}`);

    if (!qrCodeId) {
      console.log("Erreur: ID de QR code manquant");
      return new Response(
        JSON.stringify({
          error: true,
          message: "ID de QR code manquant",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Essayer d'utiliser la fonction RPC si elle existe
    try {
      console.log(`Tentative d'incrémentation du compteur via RPC pour l'ID: ${qrCodeId}`);
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('increment_qr_code_download_count', { qr_id: qrCodeId });

      if (!rpcError) {
        console.log('Succès: Fonction RPC d\'incrémentation exécutée');
        return new Response(
          JSON.stringify({
            success: true,
            message: "Compteur de téléchargements incrémenté via RPC",
            data: rpcData
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        console.log('RPC d\'incrémentation non disponible, erreur:', rpcError);
        // La fonction RPC n'existe pas ou a échoué, on utilise la méthode classique
      }
    } catch (rpcError) {
      console.error('Erreur lors de l\'appel RPC pour l\'incrémentation:', rpcError);
      // Continuer avec la méthode classique
    }

    // Méthode classique: d'abord récupérer le QR code
    console.log(`Fallback: Tentative d'incrémentation via SQL classique pour l'ID: ${qrCodeId}`);
    const { data, error } = await supabase
      .from("qr_codes")
      .select("download_count")
      .eq("id", qrCodeId)
      .maybeSingle();

    if (error) {
      console.error(`Erreur lors de la récupération du QR code ${qrCodeId}:`, error);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de la récupération du QR code",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Si le QR code n'existe pas
    if (!data) {
      console.log(`QR code non trouvé avec ID: ${qrCodeId}`);
      return new Response(
        JSON.stringify({
          error: true,
          message: "QR code non trouvé",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Incrémenter le compteur de téléchargements
    const currentCount = data.download_count || 0;
    const newCount = currentCount + 1;

    const { error: updateError } = await supabase
      .from("qr_codes")
      .update({ download_count: newCount })
      .eq("id", qrCodeId);

    if (updateError) {
      console.error(`Erreur lors de l'incrémentation du compteur pour ${qrCodeId}:`, updateError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de l'incrémentation du compteur",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Compteur de téléchargements incrémenté pour le QR code ${qrCodeId}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Compteur de téléchargements incrémenté",
        data: {
          id: qrCodeId,
          download_count: newCount
        }
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
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
