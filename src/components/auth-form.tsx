"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";

type AuthAction = (
  state: AuthState,
  formData: FormData,
) => Promise<AuthState>;

type Props = {
  mode: "login" | "signup";
  action: AuthAction;
  /** Optional notice shown before the user submits (e.g. from a redirect). */
  initialState?: AuthState;
};

const COPY = {
  login: {
    title: "Log in",
    submit: "Log in",
    altPrompt: "Need an account?",
    altHref: "/signup",
    altLabel: "Sign up",
    autoComplete: "current-password",
  },
  signup: {
    title: "Create your account",
    submit: "Sign up",
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

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {copy.title}
        </h1>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/[.18] dark:text-zinc-50 dark:focus:border-white"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={copy.autoComplete}
            className="w-full rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-white/[.18] dark:text-zinc-50 dark:focus:border-white"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        ) : null}
        {state.message ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "…" : copy.submit}
        </button>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {copy.altPrompt}{" "}
          <Link
            href={copy.altHref}
            className="font-medium text-black underline dark:text-zinc-50"
          >
            {copy.altLabel}
          </Link>
        </p>
      </form>
    </div>
  );
}
