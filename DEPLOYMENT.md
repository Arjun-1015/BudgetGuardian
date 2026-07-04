# Deploying BudgetGuardian

Two supported paths: **Vercel + managed Postgres** (least effort) or
**Docker** (portable, works on Railway/Render/Fly/your own VPS).

Either way, first switch the database provider from SQLite to Postgres —
SQLite is for local dev only.

## 1. Switch to Postgres

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Get a free Postgres instance from [Neon](https://neon.tech) or
[Supabase](https://supabase.com) — either gives you a `DATABASE_URL`
connection string.

## 2. Environment variables

Every deployment needs:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string from Neon/Supabase |
| `AUTH_SECRET` | Random string — `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://budgetguardian.app` |
| `ANTHROPIC_API_KEY` | Optional — enables the AI advisor's natural-language summary. Without it, the advisor still works using rule-based insights. |

## 3a. Deploy on Vercel

```bash
npm i -g vercel
vercel
```

- Set the environment variables above in the Vercel dashboard
  (Project → Settings → Environment Variables).
- Vercel runs `npm run build`, which already includes `prisma generate`
  (see `package.json`'s `build` script) — no extra config needed.
- After the first deploy, run `npx prisma db push` locally against your
  production `DATABASE_URL` (or set up `prisma migrate deploy` in CI) to
  create the tables.

## 3b. Deploy with Docker

```bash
docker build -t budgetguardian .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.com" \
  budgetguardian
```

Or for local testing with a bundled Postgres:

```bash
docker compose up --build
```

This image works as-is on Railway, Render, Fly.io, or any host that can
run a Dockerfile — point their "Docker deploy" option at this repo.

## 4. Create the database tables

Whichever host you use, run once against your production database:

```bash
DATABASE_URL="your-production-url" npx prisma db push
```

(Swap to `prisma migrate deploy` if you set up formal migrations later.)

## 5. Make yourself an admin

Register a normal account through the app first, then run:

```bash
DATABASE_URL="your-production-url" npm run make-admin -- you@example.com
```

This flips `isAdmin` on your user so the Admin link appears in the nav.

## 6. CI

`.github/workflows/ci.yml` runs type-checking, linting, and a build on
every push/PR against a throwaway SQLite database — it doesn't touch your
production database.

## What's not automated here

- **Mobile app store deployment** — there's no native app in this repo
  yet (see the architecture doc's Phase 5). The web app is a installable
  PWA in the meantime (manifest + service worker included).
- **Email verification / password reset emails** — the schema and auth
  flow support adding this, but it needs a transactional email provider
  (Resend, Postmark, etc.) which wasn't wired up to keep this deployable
  with zero paid services out of the box.
