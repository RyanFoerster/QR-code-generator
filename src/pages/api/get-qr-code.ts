import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Récupérer l'ID du QR code depuis les paramètres de la requête
    const qrId = url.searchParams.get("id");
    
    console.log(`API get-qr-code appelée avec ID: ${qrId}`);
    
    if (!qrId) {
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

    // Vérifier si la fonction RPC existe (méthode plus fiable)
    try {
      console.log(`Tentative de récupération du QR code avec ID: ${qrId} via RPC`);
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_qr_code_by_id', { qr_id: qrId });
      
      if (!rpcError) {
        console.log('Succès: Fonction RPC trouvée et exécutée');
        
        if (!rpcData || (Array.isArray(rpcData) && rpcData.length === 0)) {
          console.log(`Aucun QR code trouvé avec ID: ${qrId} via RPC`);
          return new Response(
            JSON.stringify({
              error: true,
              message: "QR code non trouvé",
              details: "Aucun QR code correspondant à cet identifiant",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        
        // Si on a des résultats sous forme de tableau, prendre le premier élément
        const qrCode = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        
        console.log(`QR code trouvé avec succès via RPC, ID: ${qrId}`);
        
        // Essayer d'incrémenter le compteur de vues via RPC
        try {
          await supabase.rpc('increment_qr_code_view_count', { qr_id: qrId });
          console.log(`Compteur de vues incrémenté pour le QR code ${qrId} via RPC`);
        } catch (viewError) {
          console.error('Erreur lors de l\'incrémentation du compteur de vues via RPC:', viewError);
          // Fallback silencieux - continuer même si l'incrémentation échoue
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: qrCode,
          }),
          {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60, s-maxage=60" // Cache pour 1 minute
            },
          }
        );
      } else {
        console.log('RPC non disponible, erreur:', rpcError);
        // La fonction RPC n'existe pas ou a échoué, on utilise la méthode classique
      }
    } catch (rpcCheckError) {
      console.error('Erreur lors de la vérification de la fonction RPC:', rpcCheckError);
      // Continuer avec la méthode classique
    }

    // Récupérer le QR code - Pas d'authentification requise pour cet endpoint
    console.log(`Fallback: Tentative de récupération du QR code avec ID: ${qrId} via requête SQL classique`);
    
    // Utiliser la méthode array au lieu de single pour éviter l'erreur PGRST116
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", qrId);

    if (error) {
      console.error(`Erreur lors de la récupération du QR code ${qrId}:`, error);
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

    // Vérifier si nous avons trouvé des résultats
    if (!data || data.length === 0) {
      console.log(`Aucun QR code trouvé avec ID: ${qrId}`);
      return new Response(
        JSON.stringify({
          error: true,
          message: "QR code non trouvé",
          details: "Aucun QR code correspondant à cet identifiant",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prendre le premier résultat (il devrait n'y en avoir qu'un)
    const qrCode = data[0];
    console.log(`QR code trouvé avec succès, ID: ${qrId}`);

    // Incrémenter le compteur de vues API
    try {
      const { error: updateError } = await supabase
        .from("qr_codes")
        .update({ view_count: (qrCode.view_count || 0) + 1 })
        .eq("id", qrId);
      
      if (updateError) {
        console.error("Erreur lors de l'incrémentation du compteur de vues API:", updateError);
      } else {
        console.log(`Compteur de vues incrémenté pour le QR code ${qrId}`);
      }
    } catch (updateError) {
      console.error("Erreur lors de l'incrémentation du compteur de vues API:", updateError);
    }

    // Retourner les données du QR code
    return new Response(
      JSON.stringify({
        success: true,
        qrCode: qrCode,
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=60" // Cache pour 1 minute
        },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération du QR code:", error);
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