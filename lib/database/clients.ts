import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

function resolveSupabaseEnv(serverOnly: boolean) {
  const isBrowser = !serverOnly && typeof window !== "undefined";
  const url = isBrowser
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.SUPABASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = isBrowser
    ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.SUPABASE_PUBLISHABLE_OR_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are required. In production set SUPABASE_URL and SUPABASE_ANON_KEY on the host (Vercel Project Settings → Environment Variables). For the browser bundle, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time."
    );
  }

  if (!url.startsWith("https://")) {
    throw new Error("Supabase URL must start with https://");
  }

  return { url, anonKey };
}

export async function getSupabaseClient() {
  if (cachedSupabase) {
    return cachedSupabase;
  }
  const { url, anonKey } = resolveSupabaseEnv(
    typeof window === "undefined"
  );
  cachedSupabase = createClient(url, anonKey);
  return cachedSupabase;
}

export function getSupabaseServerClient() {
  const { url, anonKey } = resolveSupabaseEnv(true);
  return createClient(url, anonKey);
}
