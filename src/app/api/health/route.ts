import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check for uptime monitors. Confirms the app is configured and can reach the database.
 * Reveals nothing about the system (no versions, hostnames or error details): the reason for a
 * failure is written to the server logs instead.
 */
export async function GET(): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };

  // A bad or missing environment variable breaks the cart and the admin login even while the
  // database is fine, so it has to show up here.
  let env: "ok" | "invalid" = "ok";
  try {
    getEnv();
  } catch (error) {
    env = "invalid";
    console.error(
      JSON.stringify({
        event: "health.env_invalid",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  let db: "up" | "down" = "up";
  try {
    await Promise.race([
      getDb().$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
  } catch (error) {
    db = "down";
    console.error(
      JSON.stringify({
        event: "health.db_down",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  if (env === "ok" && db === "up") {
    return Response.json({ status: "ok", db, env }, { headers });
  }
  return Response.json({ status: "degraded", db, env }, { status: 503, headers });
}
