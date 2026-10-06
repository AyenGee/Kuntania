import type { Resolution } from "@/lib/cart-resolve";
import { formatZar } from "@/lib/money";

/** Subtotal / discount / shipping / total (+ "VAT included" when VAT registered). */
export function Totals({
  resolution,
  shippingLabel = "Shipping",
}: {
  resolution: Resolution;
  shippingLabel?: string;
}) {
  const { totals } = resolution;
  return (
    <dl className="space-y-2">
      <Row label="Subtotal" value={formatZar(totals.subtotalCents)} />
      {totals.discountCents > 0 && (
        <Row
          label={`Discount${resolution.discount ? ` (${resolution.discount.code})` : ""}`}
          value={`-${formatZar(totals.discountCents)}`}
        />
      )}
      <Row
        label={shippingLabel}
        value={totals.shippingCents === 0 ? "Free" : formatZar(totals.shippingCents)}
      />
      <div className="border-t border-line pt-2">
        <Row label="Total" value={formatZar(totals.totalCents)} strong />
      </div>
      {totals.vatIncludedCents > 0 && (
        <p className="text-sm text-ink-muted">
          Includes VAT of {formatZar(totals.vatIncludedCents)}
        </p>
      )}
    </dl>
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
    <div
      className={`flex justify-between gap-4 ${strong ? "text-lg font-semibold" : ""}`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
