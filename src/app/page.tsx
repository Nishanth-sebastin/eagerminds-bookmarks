export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Bookmarks
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A small personal bookmarks app — Linktree meets Pocket. Save links,
          keep them private or share a public profile at your own{" "}
          <span className="font-mono">@handle</span>.
        </p>
        <p className="mt-8 text-sm text-zinc-400 dark:text-zinc-600">
          Auth and dashboard coming next.
        </p>
      </main>
    </div>
  );
}
