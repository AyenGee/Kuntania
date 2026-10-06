import type { Metadata } from "next";
import Link from "next/link";
import { DiscountForm } from "@/components/admin/DiscountForm";
import {
  Card,
  PageHeader,
  TableWrap,
  secondaryButtonClass,
  td,
  th,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { formatZar } from "@/lib/money";
import { toggleDiscountAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discount codes" };

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const codes = await getDb().discountCode.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Discount codes" />

      {codes.length === 0 ? (
        <p className="text-ink-muted">No discount codes yet.</p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Code</th>
              <th className={th}>Discount</th>
              <th className={th}>Used</th>
              <th className={th}>Valid</th>
              <th className={th}>Status</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  <Link
                    href={`/admin/discounts/${c.id}`}
                    className="font-medium underline"
                  >
                    {c.code}
                  </Link>
                </td>
                <td className={td}>
                  {c.type === "PERCENT" ? `${c.value}% off` : `${formatZar(c.value)} off`}
                  {c.minSubtotalCents > 0 && (
                    <>
                      <br />
                      <span className="text-ink-muted">
                        min spend {formatZar(c.minSubtotalCents)}
                      </span>
                    </>
                  )}
                </td>
                <td className={td}>
                  {c.usedCount}
                  {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                </td>
                <td className={td}>
                  {c.startsAt || c.endsAt
                    ? `${formatDate(c.startsAt)} to ${formatDate(c.endsAt)}`
                    : "Always"}
                </td>
                <td className={td}>{c.active ? "Active" : "Off"}</td>
                <td className={td}>
                  <form action={toggleDiscountAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className={secondaryButtonClass}>
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Card title="Create a new code">
        <DiscountForm
          initial={{
            code: "",
            type: "PERCENT",
            value: "",
            minSubtotal: "",
            maxUses: "",
            startsAt: "",
            endsAt: "",
            active: true,
          }}
        />
      </Card>
    </div>
  );
}
