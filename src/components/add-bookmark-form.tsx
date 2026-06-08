"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createBookmark } from "@/lib/actions/bookmarks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AddBookmarkForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Handle the submit on the client so we never rely on a native form POST.
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("is_public", isPublic ? "on" : "");

    startTransition(async () => {
      const result = await createBookmark({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Bookmark added");
        formRef.current?.reset();
        setIsPublic(false);
      }
    });
  }

  return (
    <Card>
      <CardContent>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="My favorite article"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" placeholder="example.com/post" required />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="is_public" className="text-muted-foreground">
                Public — show on my profile
              </Label>
            </div>
            <Button type="submit" disabled={pending}>
              <Plus className="size-4" />
              {pending ? "Adding…" : "Add bookmark"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
