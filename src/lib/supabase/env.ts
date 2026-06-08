/**
 * The public Supabase env vars, plus a guard so the app still runs before a
 * Supabase project exists. When unconfigured, the proxy/clients no-op instead
 * of throwing, and auth actions surface a clear "not configured" message.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
