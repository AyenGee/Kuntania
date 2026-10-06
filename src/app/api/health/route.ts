import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check for uptime monitors. Confirms the app is up and can reach the database.
 * Reveals nothing about the system (no versions, hostnames or error details).
 */
export async function GET(): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  try {
    await Promise.race([
      getDb().$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    return Response.json({ status: "ok", db: "up" }, { headers });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "health.db_down",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return Response.json({ status: "degraded", db: "down" }, { status: 503, headers });
  }
}
