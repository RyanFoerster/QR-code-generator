import Stripe from "stripe";

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

// Plans d'abonnement
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Gratuit",
    price: 0,
    qr_limit: 5,
    features: ["5 QR codes par mois", "Couleurs de base", "Formats PNG/JPEG"],
  },
  pro: {
    name: "Pro",
    price: 9.99,
    qr_limit: 100,
    stripe_price_id: "price_pro_monthly", // À remplacer par votre vrai ID Stripe
    features: [
      "100 QR codes par mois",
      "Couleurs personnalisées",
      "Tous les formats (PNG, SVG, JPEG)",
      "Fond transparent",
      "Historique étendu",
    ],
  },
  business: {
    name: "Business",
    price: 29.99,
    qr_limit: -1, // Illimité
    stripe_price_id: "price_business_monthly", // À remplacer par votre vrai ID Stripe
    features: [
      "QR codes illimités",
      "Toutes les fonctionnalités Pro",
      "API d'accès",
      "Analytics avancées",
      "Support prioritaire",
      "Export en lot",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;

// Créer une session de checkout Stripe
export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "required",
  });

  return session;
}

// Créer un client Stripe
export async function createStripeCustomer(email: string, userId: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer;
}

// Récupérer les informations d'abonnement
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

// Annuler un abonnement
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

// Créer un portail de facturation
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Vérifier si l'utilisateur peut créer un QR code
export function canCreateQRCode(
  tier: SubscriptionTier,
  usedThisMonth: number
): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];

  if (plan.qr_limit === -1) return true; // Illimité

  return usedThisMonth < plan.qr_limit;
}

// Obtenir les limites d'usage
export function getUsageLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_PLANS[tier];
}
