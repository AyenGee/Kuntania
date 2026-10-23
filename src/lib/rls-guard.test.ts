import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for Supabase: every Prisma model must have row level security enabled in a
 * migration, otherwise that table is reachable through Supabase's public Data API.
 */

const prismaDir = path.join(process.cwd(), "prisma");
const schema = readFileSync(path.join(prismaDir, "schema.prisma"), "utf8");
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]);

const migrationsDir = path.join(prismaDir, "migrations");
const allSql = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => readFileSync(path.join(migrationsDir, d.name, "migration.sql"), "utf8"))
  .join("\n");

describe("row level security", () => {
  it("finds the models (sanity check)", () => {
    expect(models.length).toBeGreaterThanOrEqual(10);
  });

  it.each(models)("%s has row level security enabled", (model) => {
    const pattern = new RegExp(
      `ALTER TABLE (IF EXISTS )?"${model}" ENABLE ROW LEVEL SECURITY`,
    );
    expect(allSql).toMatch(pattern);
  });
});
