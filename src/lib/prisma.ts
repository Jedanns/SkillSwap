import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7's client engine connects through a driver adapter. At runtime we use
// the POOLED Supabase connection (Supavisor, port 6543, `?pgbouncer=true`) set
// in DATABASE_URL. Migrations use the DIRECT connection — see prisma.config.ts.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single PrismaClient across hot reloads in development, otherwise each
// reload would open a new connection pool and exhaust the database.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
