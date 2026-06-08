import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark as BookmarkIcon, ExternalLink, Globe, Lock } from "lucide-react";
import { AddBookmarkForm } from "@/components/add-bookmark-form";
import { BookmarkRow } from "@/components/bookmark-row";
import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: the proxy guards this route, but never trust a single gate.
  if (!user) {
    redirect("/login");
  }

  // RLS limits this to the user's own rows; newest-first.
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id, user_id, title, url, is_public, created_at, updated_at")
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  const list = bookmarks ?? [];
  const publicCount = list.filter((b) => b.is_public).length;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Brand href="/dashboard" />
          <div className="flex items-center gap-1">
            {profile?.handle ? (
              <Link
                href={`/${profile.handle}`}
                target="_blank"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Globe className="size-4" />
                <span className="hidden sm:inline">View profile</span>
              </Link>
            ) : null}
            <ModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your bookmarks
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email}
            {profile?.handle ? (
              <>
                {" · "}
                <Link
                  href={`/${profile.handle}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  @{profile.handle}
                  <ExternalLink className="size-3" />
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Total" value={list.length} icon={BookmarkIcon} />
          <Stat label="Public" value={publicCount} icon={Globe} />
          <Stat label="Private" value={list.length - publicCount} icon={Lock} />
        </div>

        <AddBookmarkForm />

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BookmarkIcon className="size-6" />
            </div>
            <p className="font-medium">No bookmarks yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first link using the form above.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((bookmark) => (
              <BookmarkRow key={bookmark.id} bookmark={bookmark} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
