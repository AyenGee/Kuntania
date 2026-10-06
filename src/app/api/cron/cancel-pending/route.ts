import { isAuthorizedCron } from "@/lib/cron-auth";
import { cancelStalePendingOrders } from "@/lib/pending-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Protected by `Authorization: Bearer $CRON_SECRET`. Scheduled daily in vercel.json. */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const cancelled = await cancelStalePendingOrders();
    console.info(JSON.stringify({ event: "cron.cancel_pending", cancelled }));
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
