import type { SupabaseClient } from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

export async function getSupabaseClient() {
  if (cachedSupabase) {
    return cachedSupabase;
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
  cachedSupabase = createClient(supabaseUrl, supabaseKey);
  return cachedSupabase;
}