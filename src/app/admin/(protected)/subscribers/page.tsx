import type { Metadata } from "next";
import { ButtonLink, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscribers" };

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const db = getDb();
  const [active, unsubscribed, recent] = await Promise.all([
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    db.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      orderBy: { consentAt: "desc" },
      take: 100,
      select: { id: true, email: true, consentAt: true, source: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Subscribers">
        <ButtonLink href="/admin/subscribers/export">
          Download active subscribers (CSV)
        </ButtonLink>
      </PageHeader>
      <p>
        <strong>{active}</strong> active · {unsubscribed} unsubscribed
      </p>
      <p className="text-sm text-ink-muted">
        Only people who ticked the box to receive emails are listed. Every marketing email
        you send must include an unsubscribe link, and anyone who has unsubscribed must
        not be emailed.
      </p>
      {recent.length > 0 && (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Subscribed</th>
              <th className={th}>From</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id}>
                <td className={td}>{s.email}</td>
                <td className={td}>{formatDate(s.consentAt)}</td>
                <td className={td}>{s.source}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {active > recent.length && (
        <p className="text-sm text-ink-muted">
          Showing the 100 newest. The CSV has everyone.
        </p>
      )}
    </div>
  );
}
