import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscountForm } from "@/components/admin/DiscountForm";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { isoDateSast } from "@/lib/admin/format";
import { centsToRandsInput } from "@/lib/admin/rands";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit discount code" };

export default async function AdminDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const c = await getDb().discountCode.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={`Code ${c.code}`}>
        <ButtonLink href="/admin/discounts" secondary>
          All codes
        </ButtonLink>
      </PageHeader>
      <Card>
        <p className="mb-4 text-sm text-ink-muted">
          Used {c.usedCount} {c.usedCount === 1 ? "time" : "times"} so far. A code counts
          as used once an order using it has been paid.
        </p>
        <DiscountForm
          initial={{
            id: c.id,
            code: c.code,
            type: c.type,
            value: c.type === "PERCENT" ? String(c.value) : centsToRandsInput(c.value),
            minSubtotal:
              c.minSubtotalCents > 0 ? centsToRandsInput(c.minSubtotalCents) : "",
            maxUses: c.maxUses === null ? "" : String(c.maxUses),
            startsAt: c.startsAt ? isoDateSast(c.startsAt) : "",
            endsAt: c.endsAt ? isoDateSast(c.endsAt) : "",
            active: c.active,
          }}
        />
      </Card>
    </div>
  );
}
