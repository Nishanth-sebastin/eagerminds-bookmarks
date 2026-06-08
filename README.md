# Bookmarks

A small personal bookmarks app — *Linktree meets Pocket*. Sign up, save links,
keep each one private or public, and share a public profile at your own
`@handle`. Built for the EagerMinds take-home.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 ·
Supabase (Postgres + Auth, `@supabase/ssr`) · Resend · deploys on Vercel.

## Features

- **Email + password auth** (Supabase). New signups get a welcome email (Resend).
- **Bookmarks CRUD** — add / edit / delete your own, each with a `title`, `url`,
  and a public/private flag.
- **Privacy enforced at the database layer** with Supabase **Row Level Security**,
  not just the UI. One user can never read or modify another user's private rows,
  even by calling the API directly.
- **Public profiles** — anyone (no login) can visit `/<handle>` and see *only*
  that user's public bookmarks. Handles are unique via a DB constraint.
- **Protected dashboard** — logged-out users are redirected away by the Next.js
  proxy (formerly "middleware") *and* by a re-check inside the page.

## Security model (the important part)

RLS is the real authorization boundary. See
[`supabase/migrations/`](./supabase/migrations).

- RLS is enabled on `profiles` and `bookmarks`; every policy keys off
  `auth.uid()`.
- `bookmarks` SELECT returns only your own rows **or** any row where
  `is_public = true`. INSERT/UPDATE/DELETE are restricted to the owner.
- Server actions additionally scope writes with `.eq("user_id", user.id)` —
  defense in depth on top of RLS.
- The public `/<handle>` page filters `is_public = true` server-side as well.
- `handle` uniqueness is a DB `UNIQUE` constraint (not an app-level check, which
  would race).
- Only `NEXT_PUBLIC_*` keys reach the browser. The service-role key and DB
  credentials are local-only (migration scripts) and are **not** deployed.

This isn't assumed — it's tested. [`scripts/verify-rls.mjs`](./scripts/verify-rls.mjs)
creates two throwaway users and, hitting the REST API **directly as user B**,
proves B cannot read / update / delete user A's private bookmarks (and that anon
visitors see only public rows). All checks pass.

## Run locally

Prerequisites: Node 20+ and a Supabase project + Resend account.

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in .env.local (see the variables below)

# 3. Apply the database schema + RLS policies to your Supabase project
#    Either paste supabase/migrations/*.sql into the Supabase SQL Editor,
#    or, with DB creds in .env.local, run:
node scripts/apply-migration.mjs supabase/migrations/20260608063513_init_schema_rls.sql

# 4. (optional) Prove RLS works end-to-end
node scripts/verify-rls.mjs

# 5. Run the dev server
npm run dev   # http://localhost:3000
```

### Environment variables

Runtime (also set these on Vercel — see [`DEPLOY.md`](./DEPLOY.md)):

| Variable                        | Notes                                               |
| ------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for the browser; RLS-bound) |
| `RESEND_API_KEY`                | Resend API key                                      |
| `EMAIL_FROM`                    | Sender on a Resend-**verified** domain              |

Local-only (for the migration/verification scripts; never deployed):
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_HOST`,
`SUPABASE_DB_USER`.

> The app degrades gracefully when Supabase env vars are absent — the site still
> renders and the proxy/pages no-op instead of crashing.

### Supabase auth notes

Email confirmation is **on**. Set the "Confirm signup" email template link to
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` so the
confirmation link lands on the app's `/auth/confirm` handler. (Alternatively,
disable email confirmation to land straight on the dashboard.)

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the Vercel walkthrough and post-deploy
Supabase URL configuration.

## Project layout

```
src/
  app/
    [handle]/        public profile page (only public bookmarks)
    auth/confirm/    email confirmation handler
    dashboard/       protected; lists + manages your bookmarks
    login/ signup/   auth pages
  components/        AuthForm, AddBookmarkForm, BookmarkRow
  lib/
    actions/         auth + bookmarks server actions
    supabase/        browser/server/proxy clients, env guard, DB types
    email.ts         Resend welcome email
  proxy.ts           session refresh + /dashboard guard (Next 16 "proxy")
supabase/migrations/ schema + RLS
scripts/             apply-migration / verify-rls
```

## Notes for reviewers

### Where the AI agent went wrong (and how it was caught)

This was built with Claude Code; a few honest stumbles worth calling out:

- **Stale framework knowledge.** Next.js 16 renamed the `middleware` convention
  to `proxy` (Node.js runtime), made `cookies()` and route `params`/`searchParams`
  async, etc. The model's defaults were the *old* APIs. This only went right
  because `create-next-app` shipped an `AGENTS.md` telling the agent to read the
  bundled docs first — which surfaced the rename before any code was written.
  Lesson: pin behavior to the installed version's docs, not training memory.
- **Assumed missing config instead of checking.** The agent built graceful
  "Supabase not configured" fallbacks, then discovered the keys had already been
  added. Harmless here (the fallbacks are nice to have), but it's the classic
  assume-don't-verify trap.
- **A shell footgun left a stray test user.** The first RLS test assigned to a
  variable named `UID` — which is read-only in zsh — so the script erred before
  its cleanup ran, orphaning a test user. Caught immediately and the next run
  deleted all leftovers. Lesson: verify cleanup actually executes.
- **IPv6-only DB host.** Applying the migration over the direct
  `db.<ref>.supabase.co` host timed out (it's IPv6-only). Had to pivot to the
  IPv4 Session Pooler. Not a model error so much as an environment gotcha worth
  documenting.

The throughline: the agent was most reliable when it **verified against the real
system** (live RLS tests, a live email send, real HTTP smoke tests) rather than
trusting that generated code "looks right."

### One thing I'd improve next

**Let users choose and edit their `@handle` from the UI.** Today a unique handle
is auto-provisioned by a Postgres trigger (`user_xxxxxxxx`), and while the RLS
UPDATE policy already permits a user to change their own handle, there's no
form for it yet. I'd add a "claim your handle" step (with live availability
checking and the existing `UNIQUE` constraint as the race-safe backstop) so
public profile URLs are memorable — the whole point of the Linktree angle.
