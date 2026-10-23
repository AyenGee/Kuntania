import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrlProblems } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // Explain common connection-string mistakes (Supabase SSL / IPv6) instead of a cryptic error.
  for (const problem of databaseUrlProblems(connectionString)) {
    console.warn(JSON.stringify({ event: "db.config_warning", problem }));
  }

  // A small pool per server instance: serverless hosting runs many instances, and the database
  // pooler (Supabase's Supavisor) multiplexes them. Queries are unnamed, so they also work in
  // the pooler's transaction mode, which does not support prepared statements.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 5, idleTimeoutMillis: 10_000 }),
  });
}

/** Single shared Prisma client (reused across hot reloads in development). */
export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}
