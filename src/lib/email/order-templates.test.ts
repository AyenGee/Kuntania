import { describe, expect, it } from "vitest";
import {
  orderCancelledOrRefundedEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "./order-templates";

const order: OrderEmailData = {
  id: "ord_1",
  orderNumber: "KN-10001",
  email: "thandi@example.com",
  firstName: "Thandi",
  lastName: "Nkosi",
  phone: "+27821234567",
  addressLine1: "12 Main Road",
  addressLine2: "Unit 4",
  suburb: "Parktown",
  city: "Johannesburg",
  province: "GAUTENG",
  postalCode: "2193",
  deliveryMethod: "COURIER",
  deliveryNotes: null,
  items: [
    { name: "Hair Growth Oil", size: "100 ml", quantity: 2, lineTotalCents: 20000 },
    {
      name: "Pre-wash Conditioning Mask",
      size: "100 ml",
      quantity: 1,
      lineTotalCents: 15000,
    },
  ],
  subtotalCents: 35000,
  discountCents: 3500,
  shippingCents: 8000,
  totalCents: 39500,
  vatIncludedCents: 5152,
  courierName: null,
  trackingNumber: null,
  trackingUrl: null,
  stockShortfall: false,
};
const site = { siteUrl: "https://shop.example.co.za/", replyTo: "owner@example.co.za" };

describe("orderConfirmationEmail", () => {
  const mail = orderConfirmationEmail(order, site);

  it("addresses the customer with the order number in the subject", () => {
    expect(mail.to).toBe("thandi@example.com");
    expect(mail.replyTo).toBe("owner@example.co.za");
    expect(mail.subject).toContain("KN-10001");
  });

  it("includes items, totals, address and next steps in both html and text", () => {
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("Hair Growth Oil");
      expect(body).toContain("Pre-wash Conditioning Mask");
      expect(body).toContain("Johannesburg");
      expect(body).toContain("Gauteng");
      expect(body).toMatch(/395[.,]00/); // total
      expect(body).toMatch(/35[.,]00/); // discount
    }
    expect(mail.text).toContain("What happens next");
    expect(mail.text).toContain("https://shop.example.co.za/order-status");
    expect(mail.text).toMatch(/Includes VAT of/);
  });

  it("omits VAT and discount lines when there are none", () => {
    const plain = orderConfirmationEmail(
      { ...order, vatIncludedCents: 0, discountCents: 0, totalCents: 43000 },
      site,
    );
    expect(plain.text).not.toMatch(/VAT/);
    expect(plain.text).not.toMatch(/Discount/);
  });

  it("escapes HTML in customer-supplied fields", () => {
    const evil = orderConfirmationEmail(
      {
        ...order,
        firstName: "<script>alert(1)</script>",
        addressLine1: "1 <b>Bad</b> St",
      },
      site,
    );
    expect(evil.html).not.toContain("<script>");
    expect(evil.html).not.toContain("<b>Bad</b>");
    expect(evil.html).toContain("&lt;script&gt;");
  });
});

describe("ownerNewOrderEmail", () => {
  const opts = {
    siteUrl: "https://shop.example.co.za",
    ownerEmail: "owner@example.co.za",
  };

  it("lists the customer, address, notes and an admin link", () => {
    const mail = ownerNewOrderEmail({ ...order, deliveryNotes: "Gate code 1234" }, opts);
    expect(mail.to).toBe("owner@example.co.za");
    expect(mail.subject).toBe("New order KN-10001 (R 395,00)");
    expect(mail.text).toContain("thandi@example.com");
    expect(mail.text).toContain("+27821234567");
    expect(mail.text).toContain("Gate code 1234");
    expect(mail.text).toContain("https://shop.example.co.za/admin/orders/ord_1");
    expect(mail.text).not.toContain("ATTENTION");
  });

  it("flags a stock shortfall in the subject and body", () => {
    const mail = ownerNewOrderEmail({ ...order, stockShortfall: true }, opts);
    expect(mail.subject).toMatch(/^\[STOCK PROBLEM\]/);
    expect(mail.text).toContain("ATTENTION");
    expect(mail.html).toContain("ATTENTION");
  });
});

describe("orderShippedEmail", () => {
  it("includes courier, tracking number and a safe tracking link", () => {
    const mail = orderShippedEmail(
      {
        ...order,
        courierName: "The Courier Guy",
        trackingNumber: "TCG123",
        trackingUrl: "https://track.example.com/TCG123",
      },
      site,
    );
    expect(mail.subject).toContain("shipped");
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("The Courier Guy");
      expect(body).toContain("TCG123");
      expect(body).toContain("https://track.example.com/TCG123");
    }
  });

  it("never links an unsafe tracking URL", () => {
    const mail = orderShippedEmail(
      {
        ...order,
        courierName: "X",
        trackingNumber: "1",
        trackingUrl: "javascript:alert(1)",
      },
      site,
    );
    expect(mail.html).not.toContain("javascript:");
    expect(mail.text).not.toContain("javascript:");
  });
});

describe("orderCancelledOrRefundedEmail", () => {
  it("has distinct wording for cancelled and refunded", () => {
    const cancelled = orderCancelledOrRefundedEmail(order, "cancelled", {});
    const refunded = orderCancelledOrRefundedEmail(order, "refunded", {});
    expect(cancelled.subject).toContain("cancelled");
    expect(refunded.subject).toContain("refunded");
    expect(cancelled.text).not.toBe(refunded.text);
    expect(refunded.text).toContain("KN-10001");
  });
});
