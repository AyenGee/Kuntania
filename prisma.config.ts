import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations use DIRECT_DATABASE_URL when set (on Supabase: the Session pooler, port 5432),
  // otherwise DATABASE_URL. The running app always uses DATABASE_URL (the Transaction pooler).
  datasource: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "" },
});
