import { beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal in-memory stand-in for the Prisma client methods applyCompletedPayment uses. */
type Item = { productId: string; quantity: number };
type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  discountCodeId: string | null;
  items: Item[];
  paidAt?: Date;
  paymentReference?: string;
  stockShortfall?: boolean;
};

const state = {
  orders: [] as OrderRow[],
  stock: {} as Record<string, number>,
  discountUses: {} as Record<string, number>,
  events: [] as { orderId: string; type: string; message: string }[],
};

function self(): unknown {
  return fakeDb;
}

const fakeDb = {
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(self()),
  order: {
    findUnique: async ({ where }: { where: { orderNumber: string } }) =>
      state.orders.find((o) => o.orderNumber === where.orderNumber) ?? null,
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; status: { in: string[] } };
      data: Partial<OrderRow>;
    }) => {
      const o = state.orders.find(
        (x) => x.id === where.id && where.status.in.includes(x.status),
      );
      if (!o) return { count: 0 };
      Object.assign(o, data);
      return { count: 1 };
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<OrderRow>;
    }) => {
      Object.assign(
        state.orders.find((o) => o.id === where.id)!,
        data,
      );
    },
  },
  product: {
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; stock?: { gte: number } };
      data: { stock: number | { decrement: number } };
    }) => {
      const current = state.stock[where.id];
      if (where.stock && current < where.stock.gte) return { count: 0 };
      state.stock[where.id] =
        typeof data.stock === "number" ? data.stock : current - data.stock.decrement;
      return { count: 1 };
    },
  },
  discountCode: {
    update: async ({ where }: { where: { id: string } }) => {
      state.discountUses[where.id] = (state.discountUses[where.id] ?? 0) + 1;
    },
  },
  orderEvent: {
    create: async ({
      data,
    }: {
      data: { orderId: string; type: string; message: string };
    }) => {
      state.events.push(data);
    },
  },
};

vi.mock("@/lib/db", () => ({ getDb: () => fakeDb }));
const notify = vi.fn(async () => {});
vi.mock("./after-paid", () => ({ notifyOrderPaid: notify }));

const { applyCompletedPayment } = await import("./apply-payment");

beforeEach(() => {
  notify.mockClear();
  state.orders = [
    {
      id: "o1",
      orderNumber: "KN-10001",
      status: "PENDING_PAYMENT",
      discountCodeId: "d1",
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ],
    },
  ];
  state.stock = { p1: 10, p2: 5 };
  state.discountUses = {};
  state.events = [];
});

const pay = () =>
  applyCompletedPayment({ orderNumber: "KN-10001", paymentReference: "1089250" });

describe("applyCompletedPayment", () => {
  it("marks the order paid, decrements stock, counts the discount, logs an event", async () => {
    const r = await pay();
    expect(r).toMatchObject({ applied: true, stockShortfall: false });
    const o = state.orders[0];
    expect(o.status).toBe("PAID");
    expect(o.paymentReference).toBe("1089250");
    expect(o.paidAt).toBeInstanceOf(Date);
    expect(state.stock).toEqual({ p1: 8, p2: 4 });
    expect(state.discountUses.d1).toBe(1);
    expect(state.events.map((e) => e.type)).toEqual(["payment_received"]);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: a repeated ITN changes nothing", async () => {
    await pay();
    const again = await pay();
    expect(again).toEqual({ applied: false, reason: "already_processed" });
    expect(state.stock).toEqual({ p1: 8, p2: 4 }); // not decremented twice
    expect(state.discountUses.d1).toBe(1); // not counted twice
    expect(state.events).toHaveLength(1); // no duplicate event
    expect(notify).toHaveBeenCalledTimes(1); // no duplicate emails
  });

  it("does nothing for an order that is already shipped", async () => {
    state.orders[0].status = "SHIPPED";
    expect(await pay()).toEqual({ applied: false, reason: "already_processed" });
    expect(state.orders[0].status).toBe("SHIPPED");
    expect(state.stock).toEqual({ p1: 10, p2: 5 });
  });

  it("reports an unknown order", async () => {
    expect(
      await applyCompletedPayment({ orderNumber: "KN-99999", paymentReference: "x" }),
    ).toEqual({ applied: false, reason: "not_found" });
  });

  it("still marks the order PAID when stock ran out, floors stock at 0 and flags it", async () => {
    state.stock.p1 = 1; // customer wants 2
    const r = await pay();
    expect(r).toMatchObject({ applied: true, stockShortfall: true });
    expect(state.orders[0].status).toBe("PAID");
    expect(state.orders[0].stockShortfall).toBe(true);
    expect(state.stock.p1).toBe(0);
    expect(state.stock.p2).toBe(4);
    expect(state.events[0].message).toMatch(/WARNING/);
    expect(notify).toHaveBeenCalledWith("o1", true);
  });

  it("reinstates an auto-cancelled order when a late payment arrives", async () => {
    state.orders[0].status = "CANCELLED";
    const r = await pay();
    expect(r).toMatchObject({ applied: true });
    expect(state.orders[0].status).toBe("PAID");
    expect(state.events[0].message).toMatch(/reinstated/);
  });

  it("handles orders without a discount code", async () => {
    state.orders[0].discountCodeId = null;
    await pay();
    expect(state.discountUses).toEqual({});
  });
});
