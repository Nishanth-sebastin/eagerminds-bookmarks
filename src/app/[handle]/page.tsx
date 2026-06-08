import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Params = { handle: string };

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function getProfile(handleParam: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("handle", handleParam.toLowerCase())
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

  // Public view: explicit is_public filter on top of RLS so visibility never
  // depends on a single layer.
  const supabase = await createClient();
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id, title, url")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const list = bookmarks ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Brand />
        <ModeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-3xl font-semibold text-primary-foreground">
            {profile.handle[0]?.toUpperCase()}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            @{profile.handle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} public {list.length === 1 ? "link" : "links"}
          </p>
        </div>

        {list.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No public links yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {list.map((bookmark) => (
              <li key={bookmark.id}>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                    {hostFromUrl(bookmark.url)[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {bookmark.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {hostFromUrl(bookmark.url)}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-12 text-center">
          <Link
            href="/signup"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Create your own profile →
          </Link>
        </div>
      </main>
    </div>
  );
}
