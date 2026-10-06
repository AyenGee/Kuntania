import { beforeEach, describe, expect, it, vi } from "vitest";

type Item = { productId: string; quantity: number };
type OrderRow = { id: string; status: string; items: Item[]; [k: string]: unknown };

const state = {
  order: null as OrderRow | null,
  stock: {} as Record<string, number>,
  events: [] as { type: string; message: string }[],
  raceLost: false,
};

function self(): unknown {
  return fakeDb;
}
const fakeDb = {
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(self()),
  order: {
    findUnique: async () => state.order,
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; status: string };
      data: Record<string, unknown>;
    }) => {
      if (state.raceLost || !state.order || state.order.status !== where.status)
        return { count: 0 };
      Object.assign(state.order, data);
      return { count: 1 };
    },
  },
  product: {
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { stock: { increment: number } };
    }) => {
      state.stock[where.id] += data.stock.increment;
      return { count: 1 };
    },
  },
  orderEvent: {
    create: async ({ data }: { data: { type: string; message: string } }) => {
      state.events.push(data);
    },
  },
};
vi.mock("@/lib/db", () => ({ getDb: () => fakeDb }));

const sendShippedEmail = vi.fn<(id: string) => Promise<boolean>>();
const sendCancelledOrRefundedEmail =
  vi.fn<(id: string, kind: "cancelled" | "refunded") => Promise<boolean>>();
vi.mock("@/lib/email/order-emails", () => ({
  sendShippedEmail: (id: string) => sendShippedEmail(id),
  sendCancelledOrRefundedEmail: (id: string, kind: "cancelled" | "refunded") =>
    sendCancelledOrRefundedEmail(id, kind),
}));

const { transitionOrder, shipDetailsSchema } = await import("./order-actions");

const items = [
  { productId: "p1", quantity: 2 },
  { productId: "p2", quantity: 1 },
];
const setOrder = (status: string) => {
  state.order = { id: "o1", status, items };
};
const run = (
  to: Parameters<typeof transitionOrder>[0]["to"],
  ship?: { courierName: string },
) =>
  transitionOrder({
    orderId: "o1",
    to,
    adminName: "Owner",
    ship: ship
      ? { courierName: ship.courierName, trackingNumber: "T1", trackingUrl: undefined }
      : undefined,
  });

beforeEach(() => {
  state.stock = { p1: 5, p2: 5 };
  state.events = [];
  state.raceLost = false;
  sendShippedEmail.mockReset().mockResolvedValue(true);
  sendCancelledOrRefundedEmail.mockReset().mockResolvedValue(true);
});

describe("transitionOrder", () => {
  it("ships an order, records courier details and emails the customer", async () => {
    setOrder("PAID");
    const r = await run("SHIPPED", { courierName: "The Courier Guy" });
    expect(r).toEqual({ ok: true, email: "sent", restocked: false });
    expect(state.order).toMatchObject({
      status: "SHIPPED",
      courierName: "The Courier Guy",
      trackingNumber: "T1",
    });
    expect(state.events[0].message).toMatch(/Marked Shipped by Owner/);
    expect(sendShippedEmail).toHaveBeenCalledWith("o1");
  });

  it("refuses to ship without courier details", async () => {
    setOrder("PAID");
    const r = await run("SHIPPED");
    expect(r.ok).toBe(false);
    expect(state.order!.status).toBe("PAID");
    expect(sendShippedEmail).not.toHaveBeenCalled();
  });

  it("refuses transitions that aren't allowed, including marking paid by hand", async () => {
    setOrder("PENDING_PAYMENT");
    expect((await run("PAID")).ok).toBe(false);
    expect((await run("SHIPPED", { courierName: "X" })).ok).toBe(false);
    expect(state.order!.status).toBe("PENDING_PAYMENT");
    setOrder("CANCELLED");
    expect((await run("PROCESSING")).ok).toBe(false);
    expect(state.events).toEqual([]);
  });

  it("refuses when someone else changed the order first (race)", async () => {
    setOrder("PAID");
    state.raceLost = true;
    const r = await run("PROCESSING");
    expect(r).toMatchObject({ ok: false });
    expect(state.events).toEqual([]);
  });

  it("restocks when a paid, unshipped order is cancelled, and emails the customer", async () => {
    setOrder("PAID");
    const r = await run("CANCELLED");
    expect(r).toEqual({ ok: true, email: "sent", restocked: true });
    expect(state.stock).toEqual({ p1: 7, p2: 6 });
    expect(sendCancelledOrRefundedEmail).toHaveBeenCalledWith("o1", "cancelled");
    expect(state.events[0].message).toMatch(/refund them in the PayFast dashboard/);
  });

  it("cancels an unpaid order without restocking or emailing", async () => {
    setOrder("PENDING_PAYMENT");
    const r = await run("CANCELLED");
    expect(r).toEqual({ ok: true, email: "none", restocked: false });
    expect(state.stock).toEqual({ p1: 5, p2: 5 });
    expect(sendCancelledOrRefundedEmail).not.toHaveBeenCalled();
  });

  it("records a refund without restocking, notes the PayFast step, and emails", async () => {
    setOrder("SHIPPED");
    const r = await run("REFUNDED");
    expect(r).toEqual({ ok: true, email: "sent", restocked: false });
    expect(state.stock).toEqual({ p1: 5, p2: 5 });
    expect(sendCancelledOrRefundedEmail).toHaveBeenCalledWith("o1", "refunded");
    expect(state.events[0].message).toMatch(/PayFast dashboard/);
  });

  it("keeps the status change and reports when the email fails", async () => {
    setOrder("PAID");
    sendShippedEmail.mockResolvedValue(false);
    const r = await run("SHIPPED", { courierName: "X" });
    expect(r).toEqual({ ok: true, email: "failed", restocked: false });
    expect(state.order!.status).toBe("SHIPPED");
  });

  it("sends no email for processing or delivered", async () => {
    setOrder("PAID");
    expect(await run("PROCESSING")).toMatchObject({ ok: true, email: "none" });
    setOrder("SHIPPED");
    expect(await run("DELIVERED")).toMatchObject({ ok: true, email: "none" });
  });
});

describe("shipDetailsSchema", () => {
  it("requires a courier and only accepts http(s) tracking links", () => {
    expect(
      shipDetailsSchema.safeParse({
        courierName: "",
        trackingNumber: "",
        trackingUrl: "",
      }).success,
    ).toBe(false);
    expect(
      shipDetailsSchema.safeParse({
        courierName: "X",
        trackingNumber: "",
        trackingUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    const ok = shipDetailsSchema.safeParse({
      courierName: " X ",
      trackingNumber: "",
      trackingUrl: "https://t.example.com/1",
    });
    expect(ok.success && ok.data).toEqual({
      courierName: "X",
      trackingNumber: undefined,
      trackingUrl: "https://t.example.com/1",
    });
  });
});
