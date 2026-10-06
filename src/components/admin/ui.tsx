import Link from "next/link";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";

const STATUS_STYLE: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: "bg-surface text-ink-muted border-line",
  PAID: "bg-accent text-brand-contrast border-accent",
  PROCESSING: "bg-accent text-brand-contrast border-accent",
  SHIPPED: "bg-brand text-brand-contrast border-brand",
  DELIVERED: "bg-success text-brand-contrast border-success",
  CANCELLED: "bg-surface text-danger border-danger",
  REFUNDED: "bg-surface text-danger border-danger",
};

export function StatusBadge({ status }: { status: OrderStatusValue }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

/** Consistent button look for links and buttons in the admin. */
export const buttonClass =
  "inline-block rounded-control bg-brand px-4 py-2 text-sm font-medium text-brand-contrast disabled:opacity-50";
export const secondaryButtonClass =
  "inline-block rounded-control border border-control bg-surface px-4 py-2 text-sm font-medium";
export const dangerButtonClass =
  "inline-block rounded-control border border-danger bg-surface px-4 py-2 text-sm font-medium text-danger";

export function ButtonLink({
  href,
  children,
  secondary,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link href={href} className={secondary ? secondaryButtonClass : buttonClass}>
      {children}
    </Link>
  );
}

/** Responsive table wrapper: scrolls sideways on phones instead of breaking the layout. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export const th = "border-b border-line px-3 py-2 font-medium whitespace-nowrap";
export const td = "border-b border-line px-3 py-2 align-top";
