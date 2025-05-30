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

    // Récupérer les données du QR code
    const { iban, amount, communication, beneficiary, qrData, customColors } =
      await request.json();

    // Validation des données
    if (!iban || !amount || !qrData) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Données incomplètes",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Format des couleurs personnalisées
    const colorsData = customColors || {
      bg_color: "#FFFFFF",
      qr_color: "#000000",
      transparent: false,
    };

    // Insérer dans la table qr_codes
    const { data: qrCode, error: insertError } = await supabase
      .from("qr_codes")
      .insert({
        user_id: user.id,
        iban: iban,
        amount: parseFloat(amount),
        communication: communication || null,
        beneficiary: beneficiary || null,
        qr_data: qrData,
        custom_colors: colorsData,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Erreur lors de l'enregistrement du QR code:", insertError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Erreur lors de l'enregistrement du QR code",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("QR code enregistré avec succès:", qrCode.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "QR code enregistré avec succès",
        qrCodeId: qrCode.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du QR code:", error);
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
