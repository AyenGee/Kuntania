import { beforeEach, describe, expect, it, vi } from "vitest";

const events: { orderId: string; type: string; message: string }[] = [];
let orderRow: Record<string, unknown> | null;

const fakeDb = {
  order: { findUnique: async () => orderRow },
  orderEvent: {
    create: async ({ data }: { data: (typeof events)[number] }) => {
      events.push(data);
    },
  },
};
vi.mock("@/lib/db", () => ({ getDb: () => fakeDb }));
vi.mock("@/lib/env", () => ({
  getEnv: () => ({ SITE_URL: "https://shop.example.co.za", OWNER_EMAIL: envOwner.value }),
}));
const envOwner = { value: "owner@example.co.za" as string | undefined };

const sendMail = vi.fn<(m: { to: string; subject: string }) => Promise<boolean>>();
vi.mock("./send", () => ({
  sendMail: (m: { to: string; subject: string }) => sendMail(m),
}));

const {
  sendOrderConfirmation,
  sendOwnerNewOrderAlert,
  sendShippedEmail,
  sendCancelledOrRefundedEmail,
} = await import("./order-emails");

beforeEach(() => {
  events.length = 0;
  sendMail.mockReset();
  sendMail.mockResolvedValue(true);
  envOwner.value = "owner@example.co.za";
  orderRow = {
    id: "o1",
    orderNumber: "KN-10001",
    email: "thandi@example.com",
    firstName: "Thandi",
    lastName: "Nkosi",
    phone: "+27821234567",
    addressLine1: "12 Main Road",
    addressLine2: null,
    suburb: "Parktown",
    city: "Johannesburg",
    province: "GAUTENG",
    postalCode: "2193",
    deliveryMethod: "COURIER",
    deliveryNotes: null,
    items: [
      {
        productNameSnapshot: "Hair Growth Oil",
        sizeSnapshot: "100 ml",
        quantity: 1,
        lineTotalCents: 10000,
      },
    ],
    subtotalCents: 10000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 10000,
    vatIncludedCents: 0,
    courierName: "Courier",
    trackingNumber: "T1",
    trackingUrl: null,
    stockShortfall: false,
  };
});

describe("order emails", () => {
  it("sends the confirmation to the customer and records it in the order log", async () => {
    expect(await sendOrderConfirmation("o1")).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("thandi@example.com");
    expect(events.map((e) => e.type)).toEqual(["email_sent"]);
    expect(events[0].message).toContain("order confirmation");
  });

  it("sends the owner alert to OWNER_EMAIL, and skips it when unset", async () => {
    expect(await sendOwnerNewOrderAlert("o1")).toBe(true);
    expect(sendMail.mock.calls[0][0].to).toBe("owner@example.co.za");

    sendMail.mockClear();
    envOwner.value = undefined;
    expect(await sendOwnerNewOrderAlert("o1")).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("records a failure when sending fails, and never throws", async () => {
    sendMail.mockResolvedValue(false);
    await expect(sendOrderConfirmation("o1")).resolves.toBe(false);
    expect(events.map((e) => e.type)).toEqual(["email_failed"]);
  });

  it("never throws even if the mailer itself blows up", async () => {
    sendMail.mockRejectedValue(new Error("SMTP exploded"));
    await expect(sendShippedEmail("o1")).resolves.toBe(false);
    expect(events.map((e) => e.type)).toEqual(["email_failed"]);
  });

  it("returns false for an unknown order without throwing", async () => {
    orderRow = null;
    await expect(sendOrderConfirmation("nope")).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends shipped and cancelled/refunded notices", async () => {
    await sendShippedEmail("o1");
    await sendCancelledOrRefundedEmail("o1", "refunded");
    expect(sendMail.mock.calls[0][0].subject).toContain("shipped");
    expect(sendMail.mock.calls[1][0].subject).toContain("refunded");
    expect(events.map((e) => e.type)).toEqual(["email_sent", "email_sent"]);
  });
});
