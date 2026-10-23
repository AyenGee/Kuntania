import { describe, expect, it } from "vitest";
import { databaseUrlProblems } from "./db-url";

const POOLER = "postgresql://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com";

describe("databaseUrlProblems", () => {
  it("accepts a correct Supabase pooler URL", () => {
    expect(
      databaseUrlProblems(`${POOLER}:6543/postgres?sslmode=require&uselibpqcompat=true`),
    ).toEqual([]);
  });

  it("flags a Supabase URL with no SSL setting", () => {
    const [p] = databaseUrlProblems(`${POOLER}:6543/postgres`);
    expect(p).toMatch(/sslmode=require&uselibpqcompat=true/);
  });

  it("flags sslmode=require without the compatibility flag", () => {
    const [p] = databaseUrlProblems(`${POOLER}:6543/postgres?sslmode=require`);
    expect(p).toMatch(/self-signed certificate/);
  });

  it("flags the IPv6-only direct host", () => {
    const problems = databaseUrlProblems(
      "postgresql://postgres:secret@db.abcd.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true",
    );
    expect(problems.join(" ")).toMatch(/IPv6/);
  });

  it("never leaks the password", () => {
    const problems = databaseUrlProblems(`${POOLER}:6543/postgres`);
    expect(problems.join(" ")).not.toContain("secret");
  });

  it("says nothing about other databases (local Docker, Neon, etc.)", () => {
    expect(databaseUrlProblems("postgresql://u:p@localhost:5432/kuntania")).toEqual([]);
    expect(
      databaseUrlProblems("postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/db"),
    ).toEqual([]);
  });

  it("reports an unparseable URL", () => {
    expect(databaseUrlProblems("not a url")).toEqual([
      "DATABASE_URL is not a valid URL.",
    ]);
  });
});
