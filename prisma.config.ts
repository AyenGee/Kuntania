import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations should use a direct (non-pooled) connection when the host offers one (for example
  // Neon). Falls back to DATABASE_URL. The running app always uses DATABASE_URL.
  datasource: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "" },
});
