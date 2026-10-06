import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { Card, ButtonLink, PageHeader, StatusBadge } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { formatZar } from "@/lib/money";
import { safeTrackingUrl } from "@/lib/order-status";
import { PROVINCES } from "@/lib/provinces";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order" };

const DELIVERY_LABEL = {
  COURIER: "Courier delivery",
  PICKUP_POINT: "Pick-up point",
  COLLECTION: "Collection",
} as const;

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await getDb().order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
      discountCode: { select: { code: true } },
    },
  });
  if (!order) notFound();

  const province =
    PROVINCES.find((p) => p.value === order.province)?.label ?? order.province;
  const trackingUrl = safeTrackingUrl(order.trackingUrl);

  return (
    <div className="space-y-4">
      <PageHeader title={`Order ${order.orderNumber}`}>
        <StatusBadge status={order.status} />
        <ButtonLink href={`/admin/orders/${order.id}/packing-slip`} secondary>
          Packing slip
        </ButtonLink>
        <ButtonLink href="/admin/orders" secondary>
          All orders
        </ButtonLink>
      </PageHeader>

      {order.stockShortfall && (
        <p
          role="alert"
          className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
        >
          Stock problem: stock ran out before this payment came through. The order is
          paid, so please check your stock and contact the customer if you can&rsquo;t
          fulfil it.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2">
                  <span>
                    {i.productNameSnapshot} ({i.sizeSnapshot}) × {i.quantity}
                  </span>
                  <span>{formatZar(i.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <Row label="Subtotal" value={formatZar(order.subtotalCents)} />
              {order.discountCents > 0 && (
                <Row
                  label={`Discount${order.discountCode ? ` (${order.discountCode.code})` : ""}`}
                  value={`-${formatZar(order.discountCents)}`}
                />
              )}
              <Row
                label="Shipping"
                value={
                  order.shippingCents === 0 ? "Free" : formatZar(order.shippingCents)
                }
              />
              <Row label="Total" value={formatZar(order.totalCents)} strong />
              {order.vatIncludedCents > 0 && (
                <Row label="VAT included" value={formatZar(order.vatIncludedCents)} />
              )}
            </dl>
          </Card>

          <Card title="Customer and delivery">
            <p className="font-medium">
              {order.firstName} {order.lastName}
            </p>
            <p>
              <a href={`mailto:${order.email}`} className="underline">
                {order.email}
              </a>
            </p>
            <p>
              <a href={`tel:${order.phone}`} className="underline">
                {order.phone}
              </a>
            </p>
            <p className="mt-3 font-medium">{DELIVERY_LABEL[order.deliveryMethod]}</p>
            <address className="not-italic">
              {order.addressLine1}
              <br />
              {order.addressLine2 && (
                <>
                  {order.addressLine2}
                  <br />
                </>
              )}
              {order.suburb}
              <br />
              {order.city}, {province}
              <br />
              {order.postalCode}
            </address>
            {order.deliveryNotes && (
              <p className="mt-3 whitespace-pre-wrap">
                <strong>Delivery notes:</strong> {order.deliveryNotes}
              </p>
            )}
            {(order.courierName || order.trackingNumber) && (
              <p className="mt-3">
                <strong>Shipped with:</strong> {order.courierName ?? "—"}
                {order.trackingNumber && <> · {order.trackingNumber}</>}
                {trackingUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={trackingUrl}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track
                    </Link>
                  </>
                )}
              </p>
            )}
          </Card>

          <Card title="Payment">
            <dl className="space-y-1 text-sm">
              <Row label="Provider" value={order.paymentProvider} />
              <Row label="Reference" value={order.paymentReference ?? "—"} />
              <Row label="Paid at" value={formatDateTime(order.paidAt)} />
              <Row label="Placed" value={formatDateTime(order.createdAt)} />
              <Row
                label="Marketing emails"
                value={order.marketingOptIn ? "Opted in" : "No"}
              />
            </dl>
          </Card>

          <Card title="History">
            <ol className="space-y-2 text-sm">
              {order.events.map((e) => (
                <li key={e.id}>
                  <span className="text-ink-muted">{formatDateTime(e.createdAt)}</span>
                  <br />
                  {e.message}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <OrderActions
          orderId={order.id}
          status={order.status}
          adminNotes={order.adminNotes}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <dt className="text-ink-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
