import { beforeEach, describe, expect, it, vi } from "vitest";

const sendOrderConfirmation = vi.fn<(id: string) => Promise<boolean>>();
const sendOwnerNewOrderAlert = vi.fn<(id: string) => Promise<boolean>>();
vi.mock("@/lib/email/order-emails", () => ({
  sendOrderConfirmation: (id: string) => sendOrderConfirmation(id),
  sendOwnerNewOrderAlert: (id: string) => sendOwnerNewOrderAlert(id),
}));

let scheduled: (() => Promise<void>) | null = null;
let afterThrows = false;
vi.mock("next/server", () => ({
  after: (fn: () => Promise<void>) => {
    if (afterThrows) throw new Error("`after` was called outside a request scope");
    scheduled = fn;
  },
}));

const { notifyOrderPaid } = await import("./after-paid");

beforeEach(() => {
  sendOrderConfirmation.mockReset().mockResolvedValue(true);
  sendOwnerNewOrderAlert.mockReset().mockResolvedValue(true);
  scheduled = null;
  afterThrows = false;
});

describe("notifyOrderPaid", () => {
  it("defers the emails until after the response, then sends both", async () => {
    await notifyOrderPaid("o1", false);
    expect(sendOrderConfirmation).not.toHaveBeenCalled(); // not sent inline
    await scheduled!();
    expect(sendOrderConfirmation).toHaveBeenCalledWith("o1");
    expect(sendOwnerNewOrderAlert).toHaveBeenCalledWith("o1");
  });

  it("still tries the owner alert if the customer email fails, and never throws", async () => {
    sendOrderConfirmation.mockRejectedValue(new Error("smtp down"));
    await notifyOrderPaid("o1", true);
    await expect(scheduled!()).resolves.toBeUndefined();
    expect(sendOwnerNewOrderAlert).toHaveBeenCalled();
  });

  it("falls back to sending immediately outside a request", async () => {
    afterThrows = true;
    await notifyOrderPaid("o1", false);
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(sendOwnerNewOrderAlert).toHaveBeenCalledTimes(1);
  });
});
