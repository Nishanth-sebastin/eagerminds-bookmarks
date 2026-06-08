"use client";

import { useState, useTransition } from "react";
import {
  deleteBookmark,
  setBookmarkVisibility,
  updateBookmark,
} from "@/lib/actions/bookmarks";
import type { Bookmark } from "@/lib/supabase/database.types";

const inputClass =
  "w-full rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/[.18] dark:text-zinc-50 dark:focus:border-white";

export function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await updateBookmark({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setEditing(false);
      }
    });
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <form action={handleSave} className="space-y-3">
          <input type="hidden" name="id" value={bookmark.id} />
          <input
            name="title"
            defaultValue={bookmark.title}
            required
            maxLength={200}
            aria-label="Title"
            className={inputClass}
          />
          <input
            name="url"
            defaultValue={bookmark.url}
            required
            aria-label="URL"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              name="is_public"
              type="checkbox"
              defaultChecked={bookmark.is_public}
              className="h-4 w-4"
            />
            Public
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(undefined);
                setEditing(false);
              }}
              className="rounded-md border border-black/[.12] px-3 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-black dark:text-zinc-50">
            {bookmark.title}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              bookmark.is_public
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {bookmark.is_public ? "Public" : "Private"}
          </span>
        </div>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-zinc-500 hover:underline"
        >
          {bookmark.url}
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* Toggle visibility — submits the opposite of the current state. */}
        <form action={setBookmarkVisibility}>
          <input type="hidden" name="id" value={bookmark.id} />
          <input
            type="hidden"
            name="is_public"
            value={(!bookmark.is_public).toString()}
          />
          <button
            type="submit"
            className="rounded-md border border-black/[.12] px-2.5 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
          >
            {bookmark.is_public ? "Make private" : "Make public"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-black/[.12] px-2.5 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
        >
          Edit
        </button>
        <form action={deleteBookmark}>
          <input type="hidden" name="id" value={bookmark.id} />
          <button
            type="submit"
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
