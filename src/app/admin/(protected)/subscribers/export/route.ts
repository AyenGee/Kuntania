import { toCsv } from "@/lib/admin/csv";
import { isoDateSast } from "@/lib/admin/format";
import { adminOrNull } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Active newsletter subscribers only (unsubscribed people are never exported). */
export async function GET(): Promise<Response> {
  if (!(await adminOrNull())) return new Response("Unauthorized", { status: 401 });

  const subscribers = await getDb().newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    orderBy: { consentAt: "asc" },
    select: { email: true, consentAt: true, source: true },
  });

  const csv = toCsv(
    ["Email", "Consent date (SA)", "Source"],
    subscribers.map((s) => [s.email, isoDateSast(s.consentAt), s.source]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kunta-nia-subscribers_${isoDateSast(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
