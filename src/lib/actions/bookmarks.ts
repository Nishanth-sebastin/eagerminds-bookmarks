"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookmarkState = { error?: string; ok?: boolean };

/** Normalize user input into a safe http(s) URL, or null if invalid. */
function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const is_public = formData.get("is_public") === "on";
  return { title, url, is_public };
}

export async function createBookmark(
  _prev: BookmarkState,
  formData: FormData,
): Promise<BookmarkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const { title, url, is_public } = readFields(formData);
  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long (max 200)." };
  if (!url) return { error: "Enter a valid URL." };

  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, title, url, is_public });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateBookmark(
  _prev: BookmarkState,
  formData: FormData,
): Promise<BookmarkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing bookmark id." };

  const { title, url, is_public } = readFields(formData);
  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long (max 200)." };
  if (!url) return { error: "Enter a valid URL." };

  // RLS already restricts this to the owner; the explicit user_id filter is
  // belt-and-suspenders so a bug can never touch another user's row.
  const { error } = await supabase
    .from("bookmarks")
    .update({ title, url, is_public })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteBookmark(id: string): Promise<BookmarkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  if (!id) return { error: "Missing bookmark id." };

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setBookmarkVisibility(
  id: string,
  is_public: boolean,
): Promise<BookmarkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };
  if (!id) return { error: "Missing bookmark id." };

  const { error } = await supabase
    .from("bookmarks")
    .update({ is_public })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
