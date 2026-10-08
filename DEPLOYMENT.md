# Harris Memorial College Library — Deployment Guide

## Supabase Database

**Project ref:** `jtrquebhngbnwtqqypwv`  
**Region:** ap-northeast-2 (Seoul)  
**Dashboard:** https://supabase.com/dashboard/project/jtrquebhngbnwtqqypwv

The app uses **server-side Prisma** for all library data. Supabase public keys are used for SSR session refresh only.

### Seeded accounts

| Email | Password | Role |
|-------|----------|------|
| admin@hmc.edu.ph | admin123 | ADMIN |
| librarian@hmc.edu.ph | librarian123 | LIBRARIAN |

Run `npm run db:setup` locally after configuring `.env.local` to push schema and seed data.

---

## Environment Variables

Copy `.env.example` → `.env.local` (local) or configure in Vercel (production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://jtrquebhngbnwtqqypwv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# URL-encode special chars in password (# → %23)
DATABASE_URL=postgresql://postgres.jtrquebhngbnwtqqypwv:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.jtrquebhngbnwtqqypwv:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres

JWT_SECRET=[generate-a-long-random-string]
```

Get `[PASSWORD]` from: **Supabase Dashboard → Project Settings → Database → Database password**

**Production URL:** https://harris-library.vercel.app

---

## Vercel Project

**Project:** `harris-library` (team: nonagon999s-projects)  
**Region:** Singapore (`sin1`) — configured in `vercel.json`

Environment variables are configured for Production, Preview, and Development.

---

## Deploy

### CLI (recommended)

```bash
vercel link --project harris-library
vercel --prod
```

### Git integration

1. Push code to GitHub
2. Import/connect repo at [vercel.com](https://vercel.com)
3. Ensure env vars match `.env.example`
4. Deploy

---

## Local development

```bash
npm install
cp .env.example .env.local   # add Supabase password (encode # as %23)
npm run db:setup               # push schema + seed
npm run dev
```

---

## Architecture Notes

- **Next.js App Router** — frontend + API routes in one deployment
- **Prisma 5** — ORM connects to Supabase PostgreSQL via `DATABASE_URL`
- **JWT auth** — librarian sessions via httpOnly cookies (not Supabase Auth)
- **Build:** `prisma generate && next build` (also runs on `postinstall`)
