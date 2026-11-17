import { describe, expect, it } from "vitest";
import { passwordVersion } from "./password-version";

describe("passwordVersion", () => {
  it("is stable for the same hash", () => {
    expect(passwordVersion("$2b$12$abc")).toBe(passwordVersion("$2b$12$abc"));
  });

  it("changes when the password hash changes", () => {
    expect(passwordVersion("$2b$12$abc")).not.toBe(passwordVersion("$2b$12$abd"));
  });

  it("does not contain the hash itself", () => {
    const v = passwordVersion("$2b$12$abcdefghijklmnopqrstuv");
    expect(v).toHaveLength(16);
    expect("$2b$12$abcdefghijklmnopqrstuv").not.toContain(v);
  });
});
