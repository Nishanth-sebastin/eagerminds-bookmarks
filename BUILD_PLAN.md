# Build Plan — EagerMinds Bookmarks Take-Home

> Working notes so any new Claude Code session can continue seamlessly.
> (Safe to delete before final submission, or keep as a dev log.)

## Goal
A small personal bookmarks app ("Linktree meets Pocket").

- **Accounts** — email + password signup/login. New signups get a welcome email (Resend).
- **Bookmarks** — signed-in user can add/edit/delete their own. Fields: `title`, `url`, `is_public` (public/private flag).
- **Privacy** — enforced at the DB layer (Supabase RLS), NOT just the UI. One user can never read/edit/delete another's data, even via direct API calls.
- **Public profile** — each user claims a unique `@handle`. Anyone (no login) visits `/<handle>` and sees ONLY that user's public bookmarks. Handles unique via DB constraint.
- **Dashboard** — logged-in landing page of own bookmarks. Logged-out users can't reach it (middleware).

## Stack (decided)
Next.js (App Router) + TypeScript + Tailwind + Supabase (`@supabase/ssr`). Resend for email. Deploy on Vercel.

## Status
- [x] Phase 0 — Entire CLI installed, logged in, hooks installed, `entire/checkpoints/v1` pushing to GitHub (verified).
- [x] GitHub repo created: https://github.com/Nishanth-sebastin/eagerminds-bookmarks (public, remote `origin`, branch `main`).
- [x] Phase 1 — Scaffold Next.js + TS + Tailwind app. First real commit. (Next.js 16.2.7, React 19, Tailwind 4, App Router, `src/` dir, `@/*` alias. Turbopack root pinned in `next.config.ts`. Build + lint green.)
- [x] Phase 2 — Supabase auth wired + middleware-protected `/dashboard`. DONE & verified against the live project.
      - SSR clients: browser (`src/lib/supabase/client.ts`), server (`src/lib/supabase/server.ts`), session-refresh + `/dashboard` guard (`src/lib/supabase/proxy.ts`), root `src/proxy.ts`. Graceful no-op when unconfigured (`src/lib/supabase/env.ts`).
      - Auth: server actions `login`/`signup`/`signOut` (`src/lib/actions/auth.ts`); pages `/login`, `/signup` (shared `AuthForm` client component), protected `/dashboard` (re-checks auth itself, not just proxy), email-confirm handler `/auth/confirm`.
      - User created the Supabase project; keys are in `.env.local` (gitignored). Verified end-to-end: admin create + password login both 200; test users cleaned up.
      - NOTE Next 16: `middleware` → `proxy` (nodejs runtime); `cookies()` is async; page `searchParams` is a Promise.
      - DECISION NEEDED (email confirm is currently ON in Supabase): either (a) disable "Confirm email" in Supabase Auth so signup lands straight on `/dashboard`, OR (b) point the "Confirm signup" template link at `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`. Until then, signup shows "check your email".
- [ ] Phase 2b — DB schema + **RLS policies** (the security core). `profiles` (handle unique), `bookmarks` (user_id FK, is_public).
- [ ] Phase 3 — Bookmarks CRUD UI + server actions.
- [ ] Phase 4 — Public profile page `/[handle]` showing only public bookmarks.
- [ ] Phase 5 — Resend welcome email on signup.
- [ ] Phase 6 — Deploy to Vercel, set env vars, test live URL.
- [ ] Phase 7 — README (run locally / where agent went wrong / one improvement).

## Security checklist (must verify, not assume)
- RLS enabled on `bookmarks` and `profiles`; policies key off `auth.uid()`.
- Public profile query filters `is_public = true` server-side.
- Handle uniqueness = DB `UNIQUE` constraint (not app-level check — race condition).
- Service-role key server-only; never shipped to browser. `.env*` gitignored.
- Test privacy by hitting the API directly as user B against user A's rows.

## Accounts the user (Nishanth) still needs to create
- Supabase project → grab `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Resend → API key + verified sender (or use Resend test/onboarding domain).
- Vercel → connect the GitHub repo at deploy time.

## Working agreement
Commit as you go (reviewers want to see progression). Each phase = one or more small commits.
Run `git push` regularly — it auto-pushes Entire session checkpoints too.
