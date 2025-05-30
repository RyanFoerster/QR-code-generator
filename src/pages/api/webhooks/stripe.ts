import type { APIRoute } from "astro";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabase";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  console.log("🔔 Webhook reçu:", event.type, "- ID:", event.id);
  console.log(
    "📊 Données de l'événement:",
    JSON.stringify(event.data.object, null, 2)
  );

  try {
    switch (event.type) {
      // Paiements uniques (crédits QR)
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      // Abonnements Premium
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    console.log("✅ Webhook traité avec succès pour:", event.type);
    return new Response("Webhook traité avec succès", { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors du traitement du webhook:", error);
    console.error(
      "📋 Stack trace:",
      error instanceof Error ? error.stack : "Unknown error"
    );
    return new Response("Erreur lors du traitement du webhook", {
      status: 500,
    });
  }
};

// 🎯 GESTIONNAIRES D'ÉVÉNEMENTS

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log("✅ Session de checkout complétée:", session.id);
  console.log("📋 Métadonnées session:", session.metadata);
  console.log("💳 Mode de paiement:", session.mode);

  const userId = session.metadata?.user_id;
  const planType = session.metadata?.plan_type;

  if (!userId || !planType) {
    console.error("❌ Métadonnées manquantes dans la session");
    console.error("🔍 userId:", userId, "planType:", planType);
    return;
  }

  console.log("👤 Traitement pour utilisateur:", userId, "- Plan:", planType);

  if (session.mode === "payment" && planType === "one_time") {
    // Paiement unique pour des crédits QR
    console.log("💰 Ajout de crédit QR pour paiement unique");

    try {
      const { data, error } = await supabase.rpc("add_qr_credits", {
        user_uuid: userId,
        credits_count: 1,
        payment_intent_id: session.payment_intent as string,
      });

      if (error) {
        console.error("❌ Erreur lors de l'ajout de crédit:", error);
        throw error;
      }

      console.log("✅ Crédit QR ajouté avec succès:", data);
      console.log("✅ Crédit QR ajouté pour l'utilisateur:", userId);
    } catch (error) {
      console.error("❌ Échec de l'ajout de crédit:", error);
      throw error;
    }
  } else if (session.mode === "subscription" && planType === "premium") {
    // Abonnement Premium - sera géré par customer.subscription.created
    console.log("🔄 Abonnement Premium en cours de création...");
  } else {
    console.log("⚠️ Mode ou plan non reconnu:", {
      mode: session.mode,
      planType,
    });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log("✅ Paiement réussi:", paymentIntent.id);

  // Pour les paiements uniques, on peut ajouter une logique supplémentaire ici si nécessaire
  // La logique principale est déjà gérée dans checkout.session.completed
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("✅ Nouvel abonnement créé:", subscription.id);
  console.log("👤 Customer ID:", subscription.customer);
  console.log("📊 Statut abonnement:", subscription.status);

  // DEBUG: Afficher toutes les propriétés de l'objet subscription
  console.log(
    "🔍 PROPRIÉTÉS COMPLÈTES DE SUBSCRIPTION:",
    JSON.stringify(subscription, null, 2)
  );

  // Vérifier et corriger l'accès aux timestamps
  let subscriptionData = subscription as any;

  // Si les propriétés sont manquantes, récupérer via l'API Stripe
  if (
    !subscriptionData.current_period_start ||
    !subscriptionData.current_period_end
  ) {
    console.log(
      "🔄 Propriétés de période manquantes, récupération via API Stripe..."
    );
    try {
      const fullSubscription = await stripe.subscriptions.retrieve(
        subscription.id
      );
      subscriptionData = fullSubscription as any;
      console.log("✅ Subscription complète récupérée:", {
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
      });
    } catch (apiError) {
      console.error("❌ Erreur lors de la récupération via API:", apiError);
    }
  }

  // Essayer différentes propriétés possibles
  console.log("🔍 Test des propriétés de période:", {
    current_period_start: subscriptionData.current_period_start,
    current_period_end: subscriptionData.current_period_end,
    period_start: subscriptionData.period_start,
    period_end: subscriptionData.period_end,
    billing_cycle_anchor: subscriptionData.billing_cycle_anchor,
    created: subscriptionData.created,
  });

  // Essayer d'accéder aux propriétés de l'abonnement de différentes manières
  let periodStart =
    subscriptionData.current_period_start ||
    subscriptionData.period_start ||
    subscriptionData.created;

  let periodEnd =
    subscriptionData.current_period_end ||
    subscriptionData.period_end ||
    subscriptionData.billing_cycle_anchor;

  console.log("📅 Timestamps récupérés:", {
    start: periodStart,
    end: periodEnd,
    startType: typeof periodStart,
    endType: typeof periodEnd,
  });

  let periodStartISO, periodEndISO;

  try {
    // Conversion sécurisée des timestamps avec fuseau horaire correct
    if (periodStart && typeof periodStart === "number") {
      // Créer la date en UTC puis la convertir au fuseau horaire local
      const startDate = new Date(periodStart * 1000);
      periodStartISO = startDate.toISOString();
    } else {
      console.error("❌ Timestamp period_start invalide:", periodStart);
      console.log("🔄 Utilisation de la date actuelle comme fallback");
      periodStartISO = new Date().toISOString();
    }

    // Vérifier si les dates de début et de fin sont identiques ou si end est invalide
    if (
      !periodEnd ||
      typeof periodEnd !== "number" ||
      periodStart === periodEnd
    ) {
      console.log(
        "⚠️ Dates identiques ou fin invalide dans handleSubscriptionUpdated, ajout d'un mois"
      );

      // Créer une date de fin en ajoutant 1 mois à la date de début
      const startDate = new Date(periodStartISO);
      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);

      periodEndISO = calculatedEndDate.toISOString();
    } else {
      periodEndISO = new Date(periodEnd * 1000).toISOString();
    }

    console.log("📅 Période subscription update:", {
      start: periodStartISO,
      end: periodEndISO,
      diff_days: Math.round(
        (new Date(periodEndISO).getTime() -
          new Date(periodStartISO).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    });
  } catch (dateError) {
    console.error("❌ Erreur de conversion de date:", dateError);
    // Fallback complet
    periodStartISO = new Date().toISOString();
    const fallbackEnd = new Date();
    fallbackEnd.setMonth(fallbackEnd.getMonth() + 1);
    periodEndISO = fallbackEnd.toISOString();
    console.log("🔄 Utilisation de dates fallback:", {
      start: periodStartISO,
      end: periodEndISO,
    });
  }

  const customerId = subscription.customer as string;

  // Récupérer l'utilisateur par customer_id
  console.log("🔍 Recherche utilisateur pour customer:", customerId);
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("❌ Utilisateur non trouvé pour le customer:", customerId);
    console.error("🔍 Erreur:", userError);
    return;
  }

  console.log("👤 Utilisateur trouvé:", user.email, "- ID:", user.id);

  // Activer l'abonnement Premium
  try {
    console.log("🔄 Appel de activate_premium_subscription avec:", {
      user_uuid: user.id,
      stripe_subscription_id: subscription.id,
      period_start: periodStartISO,
      period_end: periodEndISO,
    });

    const { data, error } = await supabase.rpc(
      "activate_premium_subscription",
      {
        user_uuid: user.id,
        stripe_subscription_id: subscription.id,
        period_start: periodStartISO,
        period_end: periodEndISO,
      }
    );

    if (error) {
      console.error("❌ Erreur lors de l'activation Premium:", error);
      throw error;
    }

    console.log("✅ Abonnement Premium activé avec succès:", data);
    console.log("✅ Abonnement Premium activé pour l'utilisateur:", user.id);
  } catch (error) {
    console.error("❌ Échec de l'activation Premium:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Abonnement mis à jour:", subscription.id);

  const customerId = subscription.customer as string;

  // Récupérer l'utilisateur par customer_id
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("Utilisateur non trouvé pour le customer:", customerId);
    return;
  }

  if (subscription.status === "active") {
    // Conversion sécurisée des timestamps
    const subscriptionData = subscription as any;
    const periodStart = subscriptionData.current_period_start;
    const periodEnd = subscriptionData.current_period_end;

    let periodStartISO, periodEndISO;

    try {
      if (periodStart && typeof periodStart === "number") {
        periodStartISO = new Date(periodStart * 1000).toISOString();
      } else {
        throw new Error("Timestamp period_start invalide");
      }

      // Vérifier si les dates de début et de fin sont identiques ou si end est invalide
      if (
        !periodEnd ||
        typeof periodEnd !== "number" ||
        periodStart === periodEnd
      ) {
        console.log(
          "⚠️ Dates identiques ou fin invalide dans handleSubscriptionUpdated, ajout d'un mois"
        );

        // Créer une date de fin en ajoutant 1 mois à la date de début
        const startDate = new Date(periodStartISO);
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);

        periodEndISO = calculatedEndDate.toISOString();
      } else {
        periodEndISO = new Date(periodEnd * 1000).toISOString();
      }

      console.log("📅 Période subscription update:", {
        start: periodStartISO,
        end: periodEndISO,
        diff_days: Math.round(
          (new Date(periodEndISO).getTime() -
            new Date(periodStartISO).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      });
    } catch (dateError) {
      console.error(
        "❌ Erreur de conversion de date dans handleSubscriptionUpdated:",
        dateError
      );
      return;
    }

    // Réactiver l'abonnement
    await supabase.rpc("activate_premium_subscription", {
      user_uuid: user.id,
      stripe_subscription_id: subscription.id,
      period_start: periodStartISO,
      period_end: periodEndISO,
    });
    console.log("✅ Abonnement Premium réactivé pour l'utilisateur:", user.id);
  } else {
    // Désactiver l'abonnement
    await supabase.rpc("deactivate_premium_subscription", {
      user_uuid: user.id,
    });
    console.log("❌ Abonnement Premium désactivé pour l'utilisateur:", user.id);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Abonnement supprimé:", subscription.id);

  const customerId = subscription.customer as string;

  // Récupérer l'utilisateur par customer_id
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("Utilisateur non trouvé pour le customer:", customerId);
    return;
  }

  // Désactiver l'abonnement Premium
  await supabase.rpc("deactivate_premium_subscription", {
    user_uuid: user.id,
  });

  console.log("❌ Abonnement Premium désactivé pour l'utilisateur:", user.id);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("✅ Paiement de facture réussi:", invoice.id);

  if ((invoice as any).subscription) {
    // Renouvellement d'abonnement - récupérer la subscription pour mettre à jour les dates
    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string
    );

    const customerId = subscription.customer as string;

    // Récupérer l'utilisateur par customer_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (userError || !user) {
      console.error("Utilisateur non trouvé pour le customer:", customerId);
      return;
    }

    // Conversion sécurisée des timestamps
    const subscriptionData = subscription as any;
    const periodStart = subscriptionData.current_period_start;
    const periodEnd = subscriptionData.current_period_end;

    let periodStartISO, periodEndISO;

    try {
      if (periodStart && typeof periodStart === "number") {
        periodStartISO = new Date(periodStart * 1000).toISOString();
      } else {
        throw new Error("Timestamp period_start invalide");
      }

      // Vérifier si les dates de début et de fin sont identiques ou si end est invalide
      if (
        !periodEnd ||
        typeof periodEnd !== "number" ||
        periodStart === periodEnd
      ) {
        console.log(
          "⚠️ Dates identiques ou fin invalide dans handleInvoicePaymentSucceeded, ajout d'un mois"
        );

        // Créer une date de fin en ajoutant 1 mois à la date de début
        const startDate = new Date(periodStartISO);
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);

        periodEndISO = calculatedEndDate.toISOString();
      } else {
        periodEndISO = new Date(periodEnd * 1000).toISOString();
      }

      console.log("📅 Période invoice payment:", {
        start: periodStartISO,
        end: periodEndISO,
        diff_days: Math.round(
          (new Date(periodEndISO).getTime() -
            new Date(periodStartISO).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      });
    } catch (dateError) {
      console.error(
        "❌ Erreur de conversion de date dans handleInvoicePaymentSucceeded:",
        dateError
      );
      return;
    }

    // Mettre à jour les dates d'abonnement et reset les compteurs
    await supabase.rpc("activate_premium_subscription", {
      user_uuid: user.id,
      stripe_subscription_id: subscription.id,
      period_start: periodStartISO,
      period_end: periodEndISO,
    });

    console.log("🔄 Abonnement Premium renouvelé pour l'utilisateur:", user.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("❌ Échec du paiement de facture:", invoice.id);

  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string
    );
    const customerId = subscription.customer as string;

    // Récupérer l'utilisateur par customer_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (userError || !user) {
      console.error("Utilisateur non trouvé pour le customer:", customerId);
      return;
    }

    // Marquer l'abonnement comme en retard de paiement
    await supabase
      .from("users")
      .update({ subscription_status: "past_due" })
      .eq("id", user.id);

    console.log(
      "⚠️ Abonnement marqué comme en retard pour l'utilisateur:",
      user.id
    );
  }
}
