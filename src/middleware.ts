import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, locals }, next) => {
  const url = new URL(request.url);

  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = [
    "/dashboard", 
    "/history",
    "/pricing",
    "/profile",
    "/settings",
    "/api/billing-portal",
    "/api/change-subscription",
    "/api/create-checkout-session",
    "/api/increment-qr-usage",
    "/api/get-qr-history",
    "/api/get-user-stats",
    "/api/save-qr-code"
  ];
  
  // Routes publiques explicites (pour garantir qu'elles restent accessibles)
  const publicRoutes = [
    "/share",
    "/api/get-qr-code",
    "/api/increment-download-count"
  ];

  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname === route || url.pathname.startsWith(route + "/")
  );
  
  // Vérifier si la route actuelle est explicitement publique
  const isPublicRoute = publicRoutes.some(route => 
    url.pathname === route || url.pathname.startsWith(route + "/")
  );

  // Si c'est une route publique, laisser passer sans vérification
  if (isPublicRoute) {
    return next();
  }

  // Si c'est une route protégée, vérifier l'authentification
  if (isProtectedRoute) {
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return redirect("/auth/signin");
    }

    // Vérifier la validité du token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken.value);

    if (error || !user) {
      // Token invalide, supprimer les cookies et rediriger
      cookies.delete("sb-access-token");
      cookies.delete("sb-refresh-token");
      return redirect("/auth/signin");
    }

    // Ajouter l'utilisateur au contexte
    locals.user = {
      ...user,
      id: user.id,
      email: user.email || ''
    };
  }

  // Pour toutes les autres routes, continuer sans restriction
  return next();
}); 