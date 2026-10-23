/**
 * Sanity checks for the database connection string, aimed at the two Supabase mistakes that
 * cause confusing failures. Returns human-readable problems (empty = nothing to report).
 * It never includes the password or any part of the URL in its messages.
 */
export function databaseUrlProblems(url: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return ["DATABASE_URL is not a valid URL."];
  }

  const problems: string[] = [];
  const isSupabase =
    parsed.hostname.endsWith(".supabase.com") || parsed.hostname.endsWith(".supabase.co");
  if (!isSupabase) return problems;

  const sslmode = parsed.searchParams.get("sslmode");
  const libpqCompat = parsed.searchParams.get("uselibpqcompat") === "true";

  if (!sslmode) {
    problems.push(
      "Supabase connections must be encrypted: add ?sslmode=require&uselibpqcompat=true to DATABASE_URL.",
    );
  } else if (sslmode === "require" && !libpqCompat) {
    problems.push(
      "With sslmode=require the Node driver verifies Supabase's certificate and fails with " +
        '"self-signed certificate in certificate chain". Add &uselibpqcompat=true to DATABASE_URL.',
    );
  }

  // The direct host (db.<ref>.supabase.co) is IPv6-only unless the IPv4 add-on is bought, which
  // Vercel and many home networks cannot reach. The pooler hosts work everywhere.
  if (parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co")) {
    problems.push(
      "This is Supabase's direct host, which is IPv6-only on most plans. Use the pooler " +
        "connection string (host ends in .pooler.supabase.com) instead.",
    );
  }
  return problems;
}
