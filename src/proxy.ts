import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16 renamed the `middleware` convention to `proxy`. Same idea: runs on
// the server before a route renders. Here it keeps the Supabase session fresh
// and bounces logged-out users away from /dashboard.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image files, so auth cookies
     * stay fresh on navigations without blocking CSS/JS/images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
