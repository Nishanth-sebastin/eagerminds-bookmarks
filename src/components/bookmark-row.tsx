"use client";

import { useRef, useState, useTransition } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteBookmark,
  setBookmarkVisibility,
  updateBookmark,
} from "@/lib/actions/bookmarks";
import type { Bookmark } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const [editing, setEditing] = useState(false);
  const [editPublic, setEditPublic] = useState(bookmark.is_public);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const host = hostFromUrl(bookmark.url);
  const initial = (host[0] ?? "?").toUpperCase();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("id", bookmark.id);
    formData.set("is_public", editPublic ? "on" : "");
    startTransition(async () => {
      const result = await updateBookmark({}, formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Bookmark updated");
        setEditing(false);
      }
    });
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await setBookmarkVisibility(bookmark.id, !bookmark.is_public);
      if (result.error) toast.error(result.error);
      else
        toast.success(
          bookmark.is_public ? "Made private" : "Made public",
        );
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBookmark(bookmark.id);
      if (result.error) toast.error(result.error);
      else toast.success("Bookmark deleted");
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-card p-4">
        <form ref={formRef} onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`title-${bookmark.id}`}>Title</Label>
              <Input
                id={`title-${bookmark.id}`}
                name="title"
                defaultValue={bookmark.title}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`url-${bookmark.id}`}>URL</Label>
              <Input
                id={`url-${bookmark.id}`}
                name="url"
                defaultValue={bookmark.url}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id={`public-${bookmark.id}`}
                checked={editPublic}
                onCheckedChange={setEditPublic}
              />
              <Label
                htmlFor={`public-${bookmark.id}`}
                className="text-muted-foreground"
              >
                Public
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setEditPublic(bookmark.is_public);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium hover:underline"
          >
            {bookmark.title}
          </a>
          <Badge variant={bookmark.is_public ? "default" : "secondary"}>
            {bookmark.is_public ? "Public" : "Private"}
          </Badge>
        </div>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 truncate text-sm text-muted-foreground hover:underline"
        >
          {host}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle}>
            {bookmark.is_public ? (
              <>
                <EyeOff className="size-4" /> Make private
              </>
            ) : (
              <>
                <Eye className="size-4" /> Make public
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
