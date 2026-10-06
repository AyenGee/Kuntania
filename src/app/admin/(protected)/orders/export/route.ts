import { toCsv } from "@/lib/admin/csv";
import { isoDateSast } from "@/lib/admin/format";
import { parseSastDateRange } from "@/lib/admin/periods";
import { centsToRandsInput } from "@/lib/admin/rands";
import { adminOrNull } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const HEADER = [
  "Order number",
  "Created (SA date)",
  "Status",
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Address line 1",
  "Address line 2",
  "Suburb",
  "City",
  "Province",
  "Postal code",
  "Delivery method",
  "Items",
  "Subtotal (R)",
  "Discount (R)",
  "Shipping (R)",
  "Total (R)",
  "VAT included (R)",
  "Discount code",
  "Payment reference",
  "Paid (SA date)",
  "Courier",
  "Tracking number",
];

/** Orders created within an inclusive SA date range, as CSV for the bookkeeper. */
export async function GET(request: Request): Promise<Response> {
  if (!(await adminOrNull())) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const range = parseSastDateRange(
    url.searchParams.get("from") ?? "",
    url.searchParams.get("to") ?? "",
  );
  if (!range) {
    return new Response("Please choose a valid date range (up to two years).", {
      status: 400,
    });
  }

  const orders = await getDb().order.findMany({
    where: { createdAt: { gte: range.start, lt: range.endExclusive } },
    orderBy: { createdAt: "asc" },
    include: { items: true, discountCode: { select: { code: true } } },
  });

  const rows = orders.map((o) => [
    o.orderNumber,
    isoDateSast(o.createdAt),
    o.status,
    o.firstName,
    o.lastName,
    o.email,
    o.phone,
    o.addressLine1,
    o.addressLine2,
    o.suburb,
    o.city,
    o.province,
    o.postalCode,
    o.deliveryMethod,
    o.items.map((i) => `${i.productNameSnapshot} x${i.quantity}`).join("; "),
    centsToRandsInput(o.subtotalCents),
    centsToRandsInput(o.discountCents),
    centsToRandsInput(o.shippingCents),
    centsToRandsInput(o.totalCents),
    centsToRandsInput(o.vatIncludedCents),
    o.discountCode?.code,
    o.paymentReference,
    o.paidAt ? isoDateSast(o.paidAt) : "",
    o.courierName,
    o.trackingNumber,
  ]);

  const filename = `kunta-nia-orders_${url.searchParams.get("from")}_to_${url.searchParams.get("to")}.csv`;
  return new Response(toCsv(HEADER, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
