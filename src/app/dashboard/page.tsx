import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { AddBookmarkForm } from "@/components/add-bookmark-form";
import { BookmarkRow } from "@/components/bookmark-row";
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

  // RLS limits this to the user's own rows; the order is newest-first.
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id, user_id, title, url, is_public, created_at, updated_at")
    .order("created_at", { ascending: false });

  // The user's handle drives their public profile link.
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  const list = bookmarks ?? [];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <div>
          <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
            Your bookmarks
          </h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.handle ? (
            <a
              href={`/${profile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-black underline dark:text-zinc-50"
            >
              View public profile →
            </a>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-black/[.12] px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:text-zinc-50 dark:hover:bg-white/[.06]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
        <AddBookmarkForm />

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No bookmarks yet. Add your first one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((bookmark) => (
              <BookmarkRow key={bookmark.id} bookmark={bookmark} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
