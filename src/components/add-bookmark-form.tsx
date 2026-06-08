"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { createBookmark, type BookmarkState } from "@/lib/actions/bookmarks";

const inputClass =
  "w-full rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/[.18] dark:text-zinc-50 dark:focus:border-white";

export function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState<BookmarkState, FormData>(
    createBookmark,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful add.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <input
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder="Title"
          aria-label="Title"
          className={inputClass}
        />
        <input
          name="url"
          type="text"
          required
          placeholder="example.com"
          aria-label="URL"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input name="is_public" type="checkbox" className="h-4 w-4" />
        Make this bookmark public (visible on your profile)
      </label>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
