import { store } from "@content/site";
import { getDb } from "@/lib/db";
import { NEEDS_ACTION_STATUSES, REVENUE_STATUSES } from "./order-transitions";
import { startOfSastDay, startOfSastMonth, startOfSastWeek } from "./periods";

export type PeriodStats = { orders: number; revenueCents: number };

/** Mutable copies for Prisma, which wants plain (non-readonly) arrays. */
const revenueStatuses = [...REVENUE_STATUSES];
const needsActionStatuses = [...NEEDS_ACTION_STATUSES];

async function paidStatsSince(since: Date): Promise<PeriodStats> {
  const r = await getDb().order.aggregate({
    where: { status: { in: revenueStatuses }, paidAt: { gte: since } },
    _count: { _all: true },
    _sum: { totalCents: true },
  });
  return { orders: r._count._all, revenueCents: r._sum.totalCents ?? 0 };
}

/** Everything the dashboard shows. Revenue counts paid orders only (by payment date, SA time). */
export async function getDashboard(now: Date = new Date()) {
  const db = getDb();
  const [today, week, month, needsAction, needsActionCount, lowStock, unhandledMessages] =
    await Promise.all([
      paidStatsSince(startOfSastDay(now)),
      paidStatsSince(startOfSastWeek(now)),
      paidStatsSince(startOfSastMonth(now)),
      db.order.findMany({
        where: { status: { in: needsActionStatuses } },
        orderBy: { paidAt: "asc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          firstName: true,
          lastName: true,
          totalCents: true,
          paidAt: true,
          stockShortfall: true,
        },
      }),
      db.order.count({ where: { status: { in: needsActionStatuses } } }),
      db.product.findMany({
        where: { active: true, stock: { lte: store.lowStockThreshold } },
        orderBy: { stock: "asc" },
        select: { id: true, name: true, stock: true },
      }),
      db.contactMessage.count({ where: { handled: false } }),
    ]);

  return {
    today,
    week,
    month,
    needsAction,
    needsActionCount,
    lowStock,
    unhandledMessages,
  };
}
