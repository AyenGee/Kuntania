import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard: every admin page, route handler and server-action file must check the
 * session itself. A layout check alone is NOT enough, because Next renders layouts and pages
 * in parallel and doesn't re-run layouts on client navigation.
 */

const ROOT = path.join(process.cwd(), "src", "app", "admin", "(protected)");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT).filter((f) => /[\\/](page\.tsx|route\.ts|actions\.ts)$/.test(f));

describe("admin auth guards", () => {
  it("finds the admin files (sanity check)", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((f) => [path.relative(ROOT, f), f]))(
    "%s checks the admin session",
    (_name, file) => {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/\b(requireAdmin|adminOrNull)\(/);
    },
  );

  it("every server action module is marked 'use server' and checks the session", () => {
    for (const file of files.filter((f) => f.endsWith("actions.ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/^"use server"/);
    }
  });
});
