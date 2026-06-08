"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import type { AuthState } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

type Props = {
  mode: "login" | "signup";
  action: AuthAction;
  initialState?: AuthState;
};

const COPY = {
  login: {
    title: "Welcome back",
    description: "Log in to your bookmarks dashboard.",
    submit: "Log in",
    altPrompt: "Need an account?",
    altHref: "/signup",
    altLabel: "Sign up",
    autoComplete: "current-password",
  },
  signup: {
    title: "Create your account",
    description: "Start saving and sharing your links in seconds.",
    submit: "Create account",
    altPrompt: "Already have an account?",
    altHref: "/login",
    altLabel: "Log in",
    autoComplete: "new-password",
  },
} as const;

export function AuthForm({ mode, action, initialState = {} }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    initialState,
  );
  const copy = COPY[mode];

  // Signup with email confirmation returns a message instead of a session.
  if (state.message) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={copy.autoComplete}
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Please wait…
              </>
            ) : (
              copy.submit
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {copy.altPrompt}{" "}
            <Link
              href={copy.altHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {copy.altLabel}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
