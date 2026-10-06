import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import {
  ButtonLink,
  PageHeader,
  StatusBadge,
  TableWrap,
  secondaryButtonClass,
  td,
  th,
} from "@/components/admin/ui";
import { formatDateTime, isoDateSast } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { formatZar } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 25;
const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatusValue[];

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const db = getDb();
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        totalCents: true,
        createdAt: true,
        stockShortfall: true,
      },
    }),
    db.order.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  const today = isoDateSast(new Date());
  const monthStart = `${today.slice(0, 8)}01`;

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Order number, email or name"
            className="w-64 max-w-full rounded-control border border-control bg-surface px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="rounded-control border border-control bg-surface px-3 py-2"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={secondaryButtonClass}>
          Filter
        </button>
      </form>

      <details className="rounded-card border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium">
          Export orders to CSV (for the bookkeeper)
        </summary>
        <form
          method="get"
          action="/admin/orders/export"
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="from" className="mb-1 block text-sm font-medium">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              required
              defaultValue={monthStart}
              className="rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-sm font-medium">
              To (inclusive)
            </label>
            <input
              id="to"
              name="to"
              type="date"
              required
              defaultValue={today}
              className="rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <button type="submit" className={secondaryButtonClass}>
            Download CSV
          </button>
        </form>
      </details>

      {orders.length === 0 ? (
        <p className="text-ink-muted">No orders match.</p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={th}>Total</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium underline">
                    {o.orderNumber}
                  </Link>
                  {o.stockShortfall && (
                    <span className="ml-2 font-semibold text-danger">Stock problem</span>
                  )}
                </td>
                <td className={td}>{formatDateTime(o.createdAt)}</td>
                <td className={td}>
                  {o.firstName} {o.lastName}
                  <br />
                  <span className="text-ink-muted">{o.email}</span>
                </td>
                <td className={td}>{formatZar(o.totalCents)}</td>
                <td className={td}>
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-3">
          {page > 1 && (
            <ButtonLink href={link(page - 1)} secondary>
              Previous
            </ButtonLink>
          )}
          <span className="text-sm">
            Page {page} of {pages} ({total} orders)
          </span>
          {page < pages && (
            <ButtonLink href={link(page + 1)} secondary>
              Next
            </ButtonLink>
          )}
        </nav>
      )}
    </div>
  );
}
