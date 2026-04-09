import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

const RETRYABLE_MESSAGES = ["fetch failed", "network", "eai_again", "etimedout"];

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

async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isRetryable = RETRYABLE_MESSAGES.some((token) => message.includes(token));
      if (!isRetryable || attempt === 2) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Supabase fetch failed");
}

function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    global: {
      fetch: fetchWithRetry,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getSupabaseClient() {
  if (cachedSupabase) {
    return cachedSupabase;
  }
  const { url, anonKey } = resolveSupabaseEnv(
    typeof window === "undefined"
  );
  cachedSupabase = createSupabaseClient(url, anonKey);
  return cachedSupabase;
}

export function getSupabaseServerClient() {
  const { url, anonKey } = resolveSupabaseEnv(true);
  return createSupabaseClient(url, anonKey);
}
