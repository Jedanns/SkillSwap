# SkillSwap

School Project DSPI 2026 JUNE

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router, TypeScript, Turbopack)
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)**
- **[Prisma 7](https://www.prisma.io)** ORM
- **[Supabase](https://supabase.com)** (Postgres + Auth via `@supabase/ssr`)

## Getting started

1. Copy the env template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

   Get the values from your Supabase project dashboard:
   - **Project URL** & **Publishable / Secret keys**: Project Settings → API Keys
   - **Database connection strings**: the "Connect" button → ORMs / Prisma tab

2. Sync the database schema (after `.env` is filled in with a real database):

   ```bash
   pnpm exec prisma migrate dev --name init
   ```

3. Run the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project layout

```
src/
  app/                  # App Router routes
  components/ui/         # shadcn/ui components
  generated/prisma/      # Generated Prisma client (gitignored)
  lib/
    prisma.ts            # Prisma client singleton
    utils.ts             # shadcn cn() helper
    supabase/
      client.ts          # Browser Supabase client
      server.ts          # Server Supabase client (RSC / actions / route handlers)
      middleware.ts      # Session-refresh helper
  middleware.ts          # Root middleware (refreshes the Supabase session)
prisma/
  schema.prisma          # Database schema
prisma.config.ts         # Prisma CLI config (loads .env, points migrations at DIRECT_URL)
```
