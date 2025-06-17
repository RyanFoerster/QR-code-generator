import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log("Tentative de récupération des fonctions de la base de données");
    
    // Requête pour obtenir toutes les fonctions de la base de données (hors système)
    const { data, error } = await supabase.rpc('list_functions');
    
    // Si l'appel RPC échoue (car la fonction list_functions n'existe pas), essayons une requête SQL directe
    if (error) {
      console.log("Échec de l'appel RPC list_functions, tentative avec requête SQL directe");
      
      const { data: sqlData, error: sqlError } = await supabase.from('pg_proc')
        .select(`
          proname,
          pg_namespace(pronamespace).nspname
        `)
        .filter('pronamespace', 'neq', 11) // Exclure pg_catalog
        .filter('pronamespace', 'neq', 12) // Exclure information_schema
        .order('proname');
      
      if (sqlError) {
        console.error("Erreur lors de la requête SQL directe:", sqlError);
        
        // Si la requête SQL directe échoue aussi, essayons une troisième approche avec une requête brute
        const { data: rawData, error: rawError } = await supabase.rpc('_pgrst_meta_function');
        
        if (rawError) {
          console.error("Erreur lors de la requête brute:", rawError);
          
          // Dernière tentative: utiliser une requête SQL personnalisée via .sql()
          const { data: customData, error: customError } = await supabase
            .from('_pgrst_meta_function')
            .select('*');
            
          if (customError) {
            console.error("Erreur lors de la requête personnalisée:", customError);
            return new Response(
              JSON.stringify({
                error: true,
                message: "Impossible de récupérer les fonctions de la base de données",
                details: [error, sqlError, rawError, customError]
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
              message: "Fonctions récupérées via requête personnalisée",
              functions: customData
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Fonctions récupérées via requête brute",
            functions: rawData
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Fonctions récupérées via SQL",
          functions: sqlData
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Fonctions récupérées via RPC",
        functions: data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des fonctions:", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: "Erreur lors de la récupération des fonctions",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 