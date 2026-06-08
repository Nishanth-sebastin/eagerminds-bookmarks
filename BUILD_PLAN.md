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
      - DECISION (made): keep email confirmation ON — option (b). User to set the Supabase "Confirm signup" email template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (handler `/auth/confirm` already built). Signup shows "check your email" until confirmed.
- [x] Phase 2b — DB schema + **RLS policies** (the security core). APPLIED & VERIFIED against the live DB.
      - `supabase/migrations/20260608063513_init_schema_rls.sql`: tables, RLS on both, owner-only write keyed on `auth.uid()`, public-read for `is_public`, profiles readable by all, `updated_at` trigger, auto-profile trigger (unique handle per new user).
      - DB types `src/lib/supabase/database.types.ts` wired into the clients (`<Database>` generic).
      - Applied via `scripts/apply-migration.mjs` over the IPv4 Session Pooler (direct `db.<ref>` host is IPv6-only and times out here). Verified with `scripts/verify-rls.mjs`: ALL CHECKS PASSED — B cannot read/update/delete A's private rows via direct REST; anon sees only public; auto-handles unique.
      - DB connection bits live in gitignored `.env.local` (`SUPABASE_DB_PASSWORD/HOST/USER`). `pg` added as a devDependency for migrations.
- [x] Phase 3 — Bookmarks CRUD UI + server actions.
      - Actions `src/lib/actions/bookmarks.ts`: create/update/delete/setVisibility. Each re-checks `getUser()`, validates title + normalizes URL (forces http(s), requires a dotted host), and filters writes by `.eq("user_id", user.id)` on top of RLS. `revalidatePath("/dashboard")`.
      - UI: `AddBookmarkForm` (useActionState, resets on success), `BookmarkRow` (inline edit via useTransition, public/private badge, make public/private toggle, delete). Dashboard lists own bookmarks newest-first + links to public profile by handle.
      - Verified: typecheck/lint/build green; `/dashboard` compiles and guards. Full browser click-through pending (offered).
- [x] Phase 4 — Public profile page `/[handle]` showing only public bookmarks. DONE & verified end-to-end.
      - `src/app/[handle]/page.tsx`: resolves profile by lowercased handle (anon client), `notFound()` if missing, lists bookmarks filtered `user_id = profile.id AND is_public = true` (explicit server filter + RLS). `generateMetadata` sets `@handle` title. Static routes (/login, /dashboard, /auth) take precedence over the dynamic segment.
      - Verified against live DB: a user's PUBLIC bookmark renders at /<handle>, the PRIVATE one does NOT leak, unknown handle → 404.
- [x] Phase 5 — Resend welcome email on signup. DONE & verified (live send).
      - `src/lib/email.ts`: `sendWelcomeEmail(to)` via Resend SDK, config-guarded (no-op without `RESEND_API_KEY`), errors logged not thrown. Wired into the signup action AFTER a successful `signUp`, wrapped in try/catch so a mail failure never blocks signup.
      - Resend account has a VERIFIED domain `eshppapp.shop` → switched `EMAIL_FROM` to `Bookmarks <bookmarks@eshppapp.shop>` so mail delivers to any recipient (not just the account owner). `.env.example` updated to explain verified-domain vs onboarding@resend.dev.
      - Verified: live send to courses@cartrabbit.in returned 200 + message id.
- [ ] Phase 6 — Deploy to Vercel, set env vars, test live URL.
- [ ] Phase 7 — README (run locally / where agent went wrong / one improvement).

## Security checklist (must verify, not assume)
- [x] RLS enabled on `bookmarks` and `profiles`; policies key off `auth.uid()`. (verified by scripts/verify-rls.mjs)
- [x] Public profile query filters `is_public = true` server-side. (explicit `.eq("is_public", true)` in /[handle] + RLS; verified private rows don't leak)
- [x] Handle uniqueness = DB `UNIQUE` constraint (not app-level check — race condition). (profiles.handle UNIQUE)
- [x] Service-role key server-only; never shipped to browser. `.env*` gitignored. (only NEXT_PUBLIC_* reach the client)
- [x] Test privacy by hitting the API directly as user B against user A's rows. (scripts/verify-rls.mjs — ALL PASSED)

## Accounts the user (Nishanth) still needs to create
- Supabase project → grab `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Resend → API key + verified sender (or use Resend test/onboarding domain).
- Vercel → connect the GitHub repo at deploy time.

## Working agreement
Commit as you go (reviewers want to see progression). Each phase = one or more small commits.
Run `git push` regularly — it auto-pushes Entire session checkpoints too.
