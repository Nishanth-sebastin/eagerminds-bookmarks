import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function DashboardPage() {
  // Without Supabase configured there's no way to be authenticated.
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: the proxy already guards this route, but never trust a
  // single gate. Re-check here so the page is safe even if the matcher changes.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <div>
          <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
            Your bookmarks
          </h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-black/[.12] px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:text-zinc-50 dark:hover:bg-white/[.06]"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-sm text-zinc-500">
          Bookmark management is coming next. You&apos;re signed in and this page
          is protected.
        </p>
      </main>
    </div>
  );
}
