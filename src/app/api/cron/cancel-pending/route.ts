import { isAuthorizedCron } from "@/lib/cron-auth";
import { cancelStalePendingOrders, purgeOldRateLimits } from "@/lib/pending-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Protected by `Authorization: Bearer $CRON_SECRET`. Scheduled daily in vercel.json. */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const cancelled = await cancelStalePendingOrders();
    const purged = await purgeOldRateLimits();
    console.info(JSON.stringify({ event: "cron.cancel_pending", cancelled, purged }));
    return Response.json({ cancelled });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "cron.cancel_pending_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return new Response("Error", { status: 500 });
  }
}
