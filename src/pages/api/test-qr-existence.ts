import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Récupérer l'ID du QR code depuis les paramètres de la requête
    const qrId = url.searchParams.get("id");
    
    if (!qrId) {
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

    console.log(`Test d'existence du QR code avec ID: ${qrId}`);
    
    // Méthode 1: Utiliser .single() pour récupérer un seul enregistrement
    const { data: singleData, error: singleError } = await supabase
      .from("qr_codes")
      .select("id, iban, amount")
      .eq("id", qrId)
      .single();
    
    console.log("Méthode 1 (single):", { data: singleData, error: singleError });
    
    // Méthode 2: Utiliser .maybeSingle() au lieu de .single()
    const { data: maybeSingleData, error: maybeSingleError } = await supabase
      .from("qr_codes")
      .select("id, iban, amount")
      .eq("id", qrId)
      .maybeSingle();
    
    console.log("Méthode 2 (maybeSingle):", { data: maybeSingleData, error: maybeSingleError });
    
    // Méthode 3: Ne pas utiliser .single() et gérer le tableau de résultats
    const { data: arrayData, error: arrayError } = await supabase
      .from("qr_codes")
      .select("id, iban, amount")
      .eq("id", qrId);
      
    console.log("Méthode 3 (array):", { 
      data: arrayData, 
      count: arrayData?.length || 0,
      error: arrayError 
    });
    
    // Méthode 4: Essayer avec RPC personnalisée
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_qr_code_by_id', { qr_id: qrId });
      
    console.log("Méthode 4 (RPC):", { data: rpcData, error: rpcError });
    
    // Vérifier la structure de la table
    const { data: tableInfo, error: tableError } = await supabase
      .from("qr_codes")
      .select("*")
      .limit(1);
      
    console.log("Structure de la table:", { 
      columns: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [], 
      error: tableError 
    });
    
    // Retourner toutes les informations
    return new Response(
      JSON.stringify({
        success: true,
        methods: {
          single: { data: singleData, error: singleError },
          maybeSingle: { data: maybeSingleData, error: maybeSingleError },
          array: { data: arrayData, count: arrayData?.length || 0, error: arrayError },
          rpc: { data: rpcData, error: rpcError }
        },
        tableStructure: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors du test d'existence:", error);
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