# Deploying to Vercel

The app is a standard Next.js (App Router) project — Vercel auto-detects it.
The build is verified green (`npm run build`). Follow these steps.

## 1. Import the repo

1. Go to <https://vercel.com/new> and import
   `Nishanth-sebastin/eagerminds-bookmarks` from GitHub.
2. Framework preset: **Next.js** (auto-detected). Leave build/output settings
   at their defaults.

## 2. Set environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (for the
Production, Preview, and Development environments). These are the **only** vars
the runtime needs:

| Variable                        | Value (from your local `.env.local`)            |
| ------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://fhhywtktbbujxfmsyavx.supabase.co`      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key                          |
| `RESEND_API_KEY`                | your Resend API key                             |
| `EMAIL_FROM`                    | `Bookmarks <bookmarks@eshppapp.shop>`           |

> Do **not** add `SUPABASE_SERVICE_ROLE_KEY` or the `SUPABASE_DB_*` values — no
> runtime code uses them; they exist only for local migration/verification
> scripts. Keeping them off Vercel reduces blast radius.

## 3. Deploy

Click **Deploy**. When it finishes you'll get a URL like
`https://eagerminds-bookmarks.vercel.app`.

## 4. Point Supabase Auth at the production URL

In **Supabase → Authentication → URL Configuration**:

- **Site URL**: your Vercel URL (e.g. `https://eagerminds-bookmarks.vercel.app`)
- **Redirect URLs**: add `https://<your-vercel-url>/auth/confirm`

And in **Authentication → Email Templates → Confirm signup**, set the link to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```

(This makes the email-confirmation link land on the app's `/auth/confirm`
handler, which exchanges the token for a session — see option (b) in the build
notes.)

## 5. Smoke-test the live URL

- Visit `/` → landing page.
- `/signup` → create an account → check for the welcome email + the Supabase
  confirmation email.
- Click the confirmation link → you should land logged-in on `/dashboard`.
- Add a bookmark, toggle it public, open `/<your-handle>` in a private window →
  only public bookmarks show.
- Visit `/dashboard` while logged out → redirected to `/login`.

## CLI alternative

Prefer the CLI? `npm i -g vercel`, then `vercel login`, then `vercel --prod`
from the repo root, adding the same env vars when prompted (or via
`vercel env add`).
