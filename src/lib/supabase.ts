import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

console.log("supabaseUrl", supabaseUrl);
console.log("supabaseAnonKey", supabaseAnonKey);

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase Anon Key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données - NOUVELLE STRUCTURE
export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_status: "active" | "canceled" | "past_due" | "inactive";
  subscription_stripe_id?: string;
  subscription_current_period_start?: string;
  subscription_current_period_end?: string;
  stripe_customer_id?: string;
  qr_codes_used_this_month: number;
  last_reset_date: string;
}

// Interface pour les crédits QR
export interface QRCredit {
  id: string;
  user_id: string;
  credits_purchased: number;
  credits_used: number;
  stripe_payment_intent_id?: string;
  purchased_at: string;
}

// Interface pour les statistiques utilisateur (vue)
export interface UserStats {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  subscription_current_period_end?: string;
  qr_codes_used_this_month: number;
  total_credits_purchased: number;
  total_credits_used: number;
  available_credits: number;
  current_plan_type: "premium" | "credits" | "none";
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  tier: "premium";
  status: "active" | "canceled" | "past_due" | "incomplete";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface QRCode {
  id: string;
  user_id: string;
  data: string;
  style: any;
  created_at: string;
  updated_at: string;
}

// Fonctions utilitaires pour la nouvelle structure
export async function getUserWithStats(
  userId: string
): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(
      "Erreur lors de la récupération des stats utilisateur:",
      error
    );
    return null;
  }

  return data;
}

export async function canUserCreateQR(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_create_qr_code", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    return false;
  }

  return data || false;
}

export async function consumeUserQRCredit(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_qr_credit", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Erreur lors de la consommation du crédit:", error);
    return false;
  }

  return data || false;
}

export async function getAvailableCredits(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_available_qr_credits", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Erreur lors de la récupération des crédits:", error);
    return 0;
  }

  return data || 0;
}
