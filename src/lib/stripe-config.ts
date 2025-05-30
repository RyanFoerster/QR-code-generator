// Configuration centralisée des plans Stripe - NOUVEAUX PLANS
export const STRIPE_PLANS = {
  one_time: {
    name: "Paiement Unique",
    price: 4.99,
    qr_limit: 1,
    features: [
      "1 QR code personnalisé",
      "Couleurs personnalisées",
      "Export PNG/SVG haute qualité",
      "Valide à vie",
    ],
    stripe_price_id: "price_one_time_499", // ⚠️ À remplacer par votre vrai Price ID
    type: "one_time" as const,
  },
  premium: {
    name: "Premium",
    price: 8.99,
    qr_limit: -1, // Illimité
    features: [
      "QR codes illimités",
      "Toutes les personnalisations",
      "Historique complet",
      "Templates prédéfinis",
      "Support prioritaire",
      "API Access",
    ],
    stripe_price_id: "price_premium_monthly", // ⚠️ À remplacer par votre vrai Price ID
    type: "recurring" as const,
  },
} as const;

// Mapping inverse : Price ID -> Tier
export const PRICE_ID_TO_TIER: Record<string, keyof typeof STRIPE_PLANS> = {
  price_one_time_499: "one_time",
  price_premium_monthly: "premium",
  // ⚠️ Ajoutez vos vrais Price IDs ici après création dans Stripe
};

// Fonction utilitaire pour obtenir le tier depuis un Price ID
export function getTierFromPriceId(priceId: string): keyof typeof STRIPE_PLANS {
  return PRICE_ID_TO_TIER[priceId] || "one_time";
}

// Fonction utilitaire pour obtenir les limites d'un tier
export function getTierLimits(tier: keyof typeof STRIPE_PLANS) {
  return {
    qr_limit: STRIPE_PLANS[tier].qr_limit,
    features: STRIPE_PLANS[tier].features,
    price: STRIPE_PLANS[tier].price,
    type: STRIPE_PLANS[tier].type,
  };
}

// Fonction pour vérifier si un utilisateur peut créer un QR code
export function canUserCreateQRCode(
  tier: keyof typeof STRIPE_PLANS,
  currentUsage: number
): boolean {
  const limit = STRIPE_PLANS[tier].qr_limit;

  // -1 = illimité (Premium)
  if (limit === -1) return true;

  // Vérifier si sous la limite
  return currentUsage < limit;
}

// Configuration des webhooks Stripe à écouter
export const STRIPE_WEBHOOK_EVENTS = [
  // 🔴 CRITIQUES pour les paiements uniques
  "checkout.session.completed", // Paiement unique réussi
  "payment_intent.succeeded", // Confirmation de paiement

  // 🔴 CRITIQUES pour les abonnements
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",

  // 🟢 UTILES
  "customer.subscription.trial_will_end",
  "invoice.upcoming",
  "customer.created",
] as const;

// Types TypeScript mis à jour
export type StripeTier = keyof typeof STRIPE_PLANS;
export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];
export type PlanType = "one_time" | "recurring";

// Fonction pour déterminer si un plan est récurrent
export function isRecurringPlan(tier: StripeTier): boolean {
  return STRIPE_PLANS[tier].type === "recurring";
}

// Fonction pour obtenir le message de limite approprié
export function getLimitMessage(
  tier: StripeTier,
  currentUsage: number
): string {
  const plan = STRIPE_PLANS[tier];

  if (tier === "one_time") {
    return currentUsage >= 1
      ? "Vous avez déjà utilisé votre QR code unique. Passez au plan Premium pour un accès illimité."
      : "Plan paiement unique : 1 QR code disponible";
  }

  if (tier === "premium") {
    return "Plan Premium : QR codes illimités";
  }

  return "Aucun plan actif";
}
