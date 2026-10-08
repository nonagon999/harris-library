# Harris Library OPAC

Online Public Access Catalog and Librarian Portal for **Harris Memorial College, Inc.**

- **Public OPAC** — Search and browse the library catalog
- **Librarian Portal** — Books, circulation, borrowers, MARC import, reports
- **Production:** https://harris-library.vercel.app

## Tech Stack

- Next.js 16 (App Router)
- Prisma 5 + PostgreSQL (Supabase)
- JWT session auth
- Tailwind CSS 4
- Deployed on Vercel

## Requirements

- **Node.js** 20.x or later (LTS recommended)
- **npm** 10+
- Access to the existing **Supabase** project (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Git

## Getting Started (any computer)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/harris-library.git
cd harris-library
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with values from your Supabase dashboard and a `JWT_SECRET`.  
**Use the same Supabase project on every machine** — do not create a new database.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key (public) |
| `DATABASE_URL` | Yes | PostgreSQL pooler URL (secret) |
| `DIRECT_URL` | Yes | PostgreSQL direct URL for migrations (secret) |
| `JWT_SECRET` | Yes | Random string for librarian sessions (secret) |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Supabase project ref and Vercel setup.

### 4. Apply database schema (first time only)

```bash
npm run db:setup
```

Or, if migrations already exist on the shared Supabase database:

```bash
npx prisma migrate deploy
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:setup` | Push schema + seed (local setup helper) |
| `npm run db:seed` | Seed sample data |
| `npm run db:migrate` | Create/apply migrations (dev) |

## Default login (seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hmc.edu.ph | admin123 |
| Librarian | librarian@hmc.edu.ph | librarian123 |

Change these in production.

## Git workflow (office ↔ home)

Use **GitHub as the single source of truth** for code. Supabase holds the database; Vercel deploys from GitHub.

### Office computer

```bash
git pull                  # get latest changes
# … work in Cursor …
git add .
git commit -m "Describe your changes"
git push
```

### Home computer

```bash
git pull                  # get changes from office
# … work in Cursor …
git add .
git commit -m "Describe your changes"
git push
```

### Tips

- Always `git pull` before starting work to avoid conflicts.
- Never commit `.env` or `.env.local` — they stay on each machine only.
- Copy `.env.example` → `.env.local` on the second computer and paste the **same** Supabase credentials.
- Do not run `npm run db:reset` against the shared Supabase database.

## Deploy

Production is on **Vercel** (`harris-library`). See [DEPLOYMENT.md](./DEPLOYMENT.md).

After connecting GitHub to Vercel, pushes to `main`/`master` can trigger automatic deploys. Environment variables are configured in the Vercel dashboard — not in Git.

Manual deploy:

```bash
vercel deploy --prod --yes --scope nonagon999s-projects
```

## Project structure

```
src/
├── app/
│   ├── api/       # REST API routes
│   ├── opac/      # Public catalog
│   ├── portal/    # Librarian portal
│   └── login/
├── components/
└── lib/           # Prisma, auth, MARC, etc.
prisma/            # Schema and migrations
public/            # Static assets (logo, images)
```

## Security

- **Never** commit `.env`, database passwords, JWT secrets, or Supabase service-role keys.
- Use `.env.example` for variable names only.
- Production secrets live in **Vercel → Environment Variables**.
