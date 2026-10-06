import type { Metadata } from "next";
import {
  Card,
  PageHeader,
  secondaryButtonClass,
  buttonClass,
} from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { setMessageHandledAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  // Unhandled first, then newest first.
  const messages = await getDb().contactMessage.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" />
      {messages.length === 0 && <p className="text-ink-muted">No messages yet.</p>}
      {messages.map((m) => (
        <Card key={m.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{m.subject}</p>
              <p className="text-sm text-ink-muted">
                {m.name} ·{" "}
                <a href={`mailto:${m.email}`} className="underline">
                  {m.email}
                </a>
                {m.phone && (
                  <>
                    {" · "}
                    <a href={`tel:${m.phone}`} className="underline">
                      {m.phone}
                    </a>
                  </>
                )}{" "}
                · {formatDateTime(m.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.handled ? "border-line text-ink-muted" : "border-accent text-accent"}`}
            >
              {m.handled ? "Handled" : "New"}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
              className={buttonClass}
            >
              Reply by email
            </a>
            <form action={setMessageHandledAction}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="handled" value={String(!m.handled)} />
              <button type="submit" className={secondaryButtonClass}>
                {m.handled ? "Mark as not handled" : "Mark as handled"}
              </button>
            </form>
          </div>
        </Card>
      ))}
    </div>
  );
}
