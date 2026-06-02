"use client";

import { supabase } from "@/integrations/supabase/client";

export type OperatorSession = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

// Supabase Auth session'dan OperatorSession oluştur
export async function getSession(): Promise<OperatorSession | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return {
      id: session.user.id,
      username: session.user.email?.split("@")[0] || "",
      displayName: session.user.user_metadata?.display_name || "",
      role: session.user.user_metadata?.role || "",
    };
  } catch {
    return null;
  }
}

// Artık localStorage'a yazmıyoruz — Supabase Auth kendi session'ını yönetiyor
export function saveSession(_session: OperatorSession) {
  // Supabase Auth otomatik yönetiyor
}

export async function clearSession() {
  await supabase.auth.signOut();
}