import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Refreshes the Supabase auth session on every request and guards private
 * routes. Invoked from the root `proxy.ts` (Next 16's renamed middleware).
 *
 * IMPORTANT: this is a convenience gate only. RLS in the database is the real
 * authorization boundary — never rely on the proxy alone to keep data private.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before a Supabase project is wired up, let every request through so the
  // app is still browsable. /dashboard's own auth check handles the rest.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and getUser() — it must be the
  // first call so the session is refreshed before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the dashboard: unauthenticated users are sent to /login.
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
