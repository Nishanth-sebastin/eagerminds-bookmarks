import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Params = { handle: string };

async function getProfile(handleParam: string) {
  if (!isSupabaseConfigured()) return null;
  const handle = handleParam.toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("handle", handle)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) return { title: "Not found" };
  return {
    title: `@${profile.handle} · Bookmarks`,
    description: `Public bookmarks shared by @${profile.handle}.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) {
    notFound();
  }

  // Public view: anon client + RLS already returns only public rows, but we
  // ALSO filter is_public = true explicitly here so visibility never depends
  // on a single layer. (Security checklist: filter is_public server-side.)
  const supabase = await createClient();
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id, title, url")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const list = bookmarks ?? [];

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            @{profile.handle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {list.length} public {list.length === 1 ? "bookmark" : "bookmarks"}
          </p>
        </header>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No public bookmarks yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((bookmark) => (
              <li
                key={bookmark.id}
                className="rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block"
                >
                  <span className="block font-medium text-black hover:underline dark:text-zinc-50">
                    {bookmark.title}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-zinc-500">
                    {bookmark.url}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
