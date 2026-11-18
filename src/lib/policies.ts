import { readFile } from "node:fs/promises";
import path from "node:path";

export type PolicySlug = "shipping-returns" | "terms" | "privacy";

/** Read a policy Markdown file from content/policies at build/request time. */
export async function readPolicy(slug: PolicySlug): Promise<string> {
  return readFile(path.join(process.cwd(), "content", "policies", `${slug}.md`), "utf8");
}
