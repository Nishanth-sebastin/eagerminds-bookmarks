import Link from "next/link";
import { ArrowRight, Globe, Lock, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

const FEATURES = [
  {
    icon: Lock,
    title: "Private by default",
    body: "Every bookmark is yours alone until you choose to share it. Enforced in the database, not just the UI.",
  },
  {
    icon: Globe,
    title: "Public profile",
    body: "Flip a link public and it appears on your profile at /@handle — share one URL, like a modern Linktree.",
  },
  {
    icon: Sparkles,
    title: "Fast and simple",
    body: "Add, edit, and organize links in seconds. No clutter, no noise — just your links, one place.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Log in
        </Link>
      </SiteHeader>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-20 pb-16 text-center sm:pt-28">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" /> Linktree meets Pocket
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Your links, beautifully in one place
          </h1>
          <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Save the things worth keeping. Keep them private, or share a clean
            public profile at your own <span className="font-mono">@handle</span>.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Get started free <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-24 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 text-left"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-4.5" />
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
