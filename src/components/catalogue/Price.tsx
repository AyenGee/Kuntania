import { formatZar } from "@/lib/money";

export function Price({
  priceCents,
  compareAtPriceCents,
}: {
  priceCents: number;
  compareAtPriceCents: number | null;
}) {
  const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents;
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-xl font-semibold">{formatZar(priceCents)}</span>
      {onSale && (
        <>
          <span className="sr-only">Was</span>
          <s className="text-ink-muted">{formatZar(compareAtPriceCents)}</s>
        </>
      )}
    </p>
  );
}
