/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly PUBLIC_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      [key: string]: any;
    };
    userProfile?: {
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
      [key: string]: any;
    };
  }
}
