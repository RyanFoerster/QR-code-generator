import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Déconnecter l'utilisateur de Supabase
  await supabase.auth.signOut();

  // Supprimer les cookies
  cookies.delete("sb-access-token", {
    path: "/",
  });
  cookies.delete("sb-refresh-token", {
    path: "/",
  });

  return redirect("/auth/signin");
};
