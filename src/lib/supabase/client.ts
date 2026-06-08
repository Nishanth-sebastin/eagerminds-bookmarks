import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Supabase client for use in Client Components (browser).
 * Only the public URL + anon key are exposed here — both are safe to ship to
 * the browser because every table is guarded by Row Level Security.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
