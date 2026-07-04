# BudgetGuardian

Personal finance app that tells you your safe daily spending limit and
whether you're at risk of running out of money before your next salary.

Covers Phases 1–4 of the original spec (see
`budgetguardian-architecture-plan.md` for the full phased plan). Native
mobile (Phase 5) isn't included — see "What's not here" below for why,
and what to do instead.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + SQLite for local dev (Postgres for production — one line
  change, see `DEPLOYMENT.md`)
- Custom JWT session auth (httpOnly cookie, bcrypt-hashed passwords)
- Recharts for charts, Tesseract.js for on-device receipt OCR, the
  browser's built-in Speech Recognition API for voice entry
- PWA-installable (manifest + service worker)

## Getting started

```bash
npm install
cp .env.example .env
# open .env and set AUTH_SECRET to a random string:
#   openssl rand -base64 32

npx prisma generate
npx prisma db push   # creates dev.db (SQLite) with the schema

npm run dev
```

Open http://localhost:3000, register an account, and you'll be walked
through onboarding before landing on the dashboard.

> **Note on how this was built:** written and type-checked in a sandboxed
> environment with a locked-down network allowlist, so `prisma generate`
> (needs binaries.prisma.sh) and Google Fonts (fetched at build time)
> couldn't be verified end-to-end there. Both work normally with regular
> internet access — `npx next build` compiled successfully in that sandbox
> once fonts were swapped for system fonts as a test. If you hit a Prisma
> "did not initialize" error, it means `npx prisma generate` hasn't run
> yet with network access.

## Feature map

**Phase 1 — core**
- Auth (register/login/logout), onboarding, profile
- Expense & income CRUD, search, category filters, duplicate
- Dependents CRUD, rolled into the survival calculation
- Dashboard: balance, income, expenses, savings, the survival gauge,
  salary countdown, category pie chart, recent transactions
- Risk detection that adapts to *your* historical spending
  (`src/lib/prediction.ts`)

**Phase 2 — planning & reporting**
- Budget goals with progress tracking (`/goals`)
- Bills with due-date tracking and paid/unpaid state (`/bills`)
- Calendar view of expenses/income/bills (`/calendar`)
- Reports: date-range totals, income vs expense chart, category
  breakdown, 30-day spend heatmap (`/reports`)
- CSV export; PDF export via the browser's print dialog
- In-app notifications (bell icon): large expenses, bills due soon,
  salary near, budget exceeded, safe-spend exceeded — all computed live
  from your data, no push infrastructure required

**Phase 3 — smart input & advisor**
- AI Budget Advisor (`/advisor`): rule-based week-over-week spending
  insights out of the box, plus an optional natural-language summary if
  you set `ANTHROPIC_API_KEY`
- Voice expense entry: "I spent 250 on groceries" via the browser's
  Speech Recognition API, no external API needed
- Receipt scanner: on-device OCR via Tesseract.js — photograph a
  receipt, it extracts amount/date/category into the expense form

**Phase 4 — admin & installability**
- Admin panel (`/admin`): user list, suspend/unsuspend. Promote your
  first admin with `npm run make-admin -- you@example.com`
- PWA: installable, offline app-shell caching (API calls always hit the
  network so your financial data stays accurate)
- Multi-currency *storage* (7 currencies) — no live FX conversion yet

## What's not here

- **Native mobile app (Flutter/React Native)** — deliberately not
  included. This was built and tested in a sandbox with no Flutter SDK,
  emulator, or app-store tooling available, and shipping untested mobile
  code felt worse than being upfront about the gap. The web app above is
  responsive and PWA-installable in the meantime; a native app is a
  separate project that consumes the same API routes documented in
  `budgetguardian-architecture-plan.md`.
- **Email verification / password reset emails** — needs a transactional
  email provider (Resend, Postmark, etc.); the auth flow is structured to
  add this later without rework.
- **Live currency conversion** — needs a paid FX API; currency is stored
  per-user but not converted.

## Project structure

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (app)/dashboard, expenses, income, dependents,
│   │        goals, bills, calendar, reports, advisor, admin
│   ├── onboarding/
│   └── api/                  ← route handlers for everything above
├── components/
│   ├── ui/                   ← Button, Input, Select, Card, RiskBadge
│   ├── dashboard/             ← SurvivalGauge, SalaryCountdown, charts
│   ├── notification-bell.tsx, nav-bar.tsx, admin-user-table.tsx
│   └── voice-entry-button.tsx, receipt-scanner.tsx
├── lib/
│   ├── prediction.ts          ← core survival/risk logic (pure functions)
│   ├── dashboard-summary.ts   ← shared DB query + prediction glue
│   ├── reports.ts, notifications.ts, advisor.ts, expense-parsing.ts
│   ├── auth.ts, validation.ts
│   └── require-user.ts        ← requireUserId / requireAdminId guards
└── middleware.ts               ← route protection
```

## Design system

Tokens live in `tailwind.config.ts`: a green-tinted "mist" light mode and
a deep teal-charcoal dark mode, with risk states read like weather (calm
sage → ochre → storm rust). Display type is Fraunces, body is Inter,
currency figures use IBM Plex Mono. Signature element: the barometer-style
arc gauge on the dashboard (`components/dashboard/survival-gauge.tsx`).

## Deployment

See `DEPLOYMENT.md` for Vercel, Docker, and Railway/Render instructions,
plus how to switch to Postgres and promote your first admin user.
