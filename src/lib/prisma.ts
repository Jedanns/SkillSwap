import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7's client engine connects through a driver adapter. At runtime we use
// the POOLED Supabase connection (Supavisor, port 6543, `?pgbouncer=true`) set
// in DATABASE_URL. Migrations use the DIRECT connection — see prisma.config.ts.
// `connectionTimeoutMillis` makes the app fail fast (~10s) instead of hanging
// for ~22s when the database is unreachable — e.g. on networks that block the
// Postgres ports 5432/6543 (some campus/corporate firewalls allow only HTTPS,
// which is why Supabase Auth still works but DB queries time out).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

// Reuse a single PrismaClient across hot reloads in development, otherwise each
// reload would open a new connection pool and exhaust the database.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
