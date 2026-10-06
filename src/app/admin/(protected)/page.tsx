import Link from "next/link";
import { Card, PageHeader, StatusBadge, TableWrap, td, th } from "@/components/admin/ui";
import { getDashboard, type PeriodStats } from "@/lib/admin/dashboard";
import { formatDateTime } from "@/lib/admin/format";
import { formatZar } from "@/lib/money";

export const dynamic = "force-dynamic";

function Stat({ label, stats }: { label: string; stats: PeriodStats }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatZar(stats.revenueCents)}</p>
      <p className="text-sm text-ink-muted">
        {stats.orders} paid {stats.orders === 1 ? "order" : "orders"}
      </p>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const d = await getDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <section aria-label="Sales" className="grid gap-4 sm:grid-cols-3">
        <Stat label="Today" stats={d.today} />
        <Stat label="This week (from Monday)" stats={d.week} />
        <Stat label="This month" stats={d.month} />
      </section>
      <p className="-mt-3 text-sm text-ink-muted">
        Revenue counts paid orders only (SA time).
      </p>

      <Card title={`Orders to ship (${d.needsActionCount})`}>
        {d.needsAction.length === 0 ? (
          <p className="text-ink-muted">
            Nothing waiting. All paid orders have been shipped.
          </p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Paid</th>
                <th className={th}>Total</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.needsAction.map((o) => (
                <tr key={o.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium underline"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.stockShortfall && (
                      <span className="ml-2 font-semibold text-danger">
                        Stock problem
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    {o.firstName} {o.lastName}
                  </td>
                  <td className={td}>{formatDateTime(o.paidAt)}</td>
                  <td className={td}>{formatZar(o.totalCents)}</td>
                  <td className={td}>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Low stock">
          {d.lowStock.length === 0 ? (
            <p className="text-ink-muted">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <Link href={`/admin/products/${p.id}`} className="underline">
                    {p.name}
                  </Link>
                  <span
                    className={
                      p.stock === 0 ? "font-semibold text-danger" : "font-medium"
                    }
                  >
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Messages">
          <p>
            <Link href="/admin/messages" className="underline">
              {d.unhandledMessages} unhandled{" "}
              {d.unhandledMessages === 1 ? "message" : "messages"}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
