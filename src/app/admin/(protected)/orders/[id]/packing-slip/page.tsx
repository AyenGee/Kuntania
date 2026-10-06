import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { business, site } from "@content/site";
import { PROVINCES } from "@/lib/provinces";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Packing slip" };

/** Printable packing slip: items to pack and where they go, with no prices. */
export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await getDb().order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();
  const province =
    PROVINCES.find((p) => p.value === order.province)?.label ?? order.province;

  return (
    <div className="mx-auto max-w-2xl bg-surface p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <PrintButton />
      </div>

      <h1 className="text-2xl font-semibold">{site.name}: packing slip</h1>
      <p className="text-ink-muted">{business.physicalAddress}</p>

      <p className="mt-6 text-lg font-semibold">Order {order.orderNumber}</p>

      <h2 className="mt-6 font-semibold">Ship to</h2>
      <address className="not-italic">
        {order.firstName} {order.lastName}
        <br />
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
        <br />
        {order.phone}
      </address>
      {order.deliveryNotes && (
        <p className="mt-2 whitespace-pre-wrap">
          <strong>Delivery notes:</strong> {order.deliveryNotes}
        </p>
      )}

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2">Item</th>
            <th className="py-2">Size</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-center">Packed</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-line">
              <td className="py-2">{i.productNameSnapshot}</td>
              <td className="py-2">{i.sizeSnapshot}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-center">☐</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 text-sm text-ink-muted">
        Thank you for shopping with {site.name}.
      </p>
    </div>
  );
}
