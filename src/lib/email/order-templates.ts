import { emailCopy } from "@content/emails";
import { formatZar } from "@/lib/money";
import { safeTrackingUrl } from "@/lib/order-status";
import { PROVINCES } from "@/lib/provinces";
import { escapeHtml } from "./escape";
import { bulletList, heading, layout, mutedParagraph, paragraph, table } from "./layout";
import type { MailInput } from "./send";

/** Everything the order emails need, free of database types so templates are pure. */
export type OrderEmailData = {
  id: string;
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  deliveryMethod: "COURIER" | "PICKUP_POINT" | "COLLECTION";
  deliveryNotes: string | null;
  items: { name: string; size: string; quantity: number; lineTotalCents: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  vatIncludedCents: number;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  stockShortfall: boolean;
};

const DELIVERY_LABEL = {
  COURIER: "Courier delivery",
  PICKUP_POINT: "Pick-up point",
  COLLECTION: "Collection",
} as const;

function provinceLabel(value: string): string {
  return PROVINCES.find((p) => p.value === value)?.label ?? value;
}

function addressLines(o: OrderEmailData): string[] {
  return [
    `${o.firstName} ${o.lastName}`,
    o.addressLine1,
    ...(o.addressLine2 ? [o.addressLine2] : []),
    o.suburb,
    `${o.city}, ${provinceLabel(o.province)}`,
    o.postalCode,
  ];
}

function itemRows(o: OrderEmailData): [string, string][] {
  return o.items.map((i) => [
    `${i.name} (${i.size}) × ${i.quantity}`,
    formatZar(i.lineTotalCents),
  ]);
}

function totalRows(o: OrderEmailData): [string, string][] {
  const rows: [string, string][] = [["Subtotal", formatZar(o.subtotalCents)]];
  if (o.discountCents > 0) rows.push(["Discount", `-${formatZar(o.discountCents)}`]);
  rows.push(["Shipping", o.shippingCents === 0 ? "Free" : formatZar(o.shippingCents)]);
  rows.push(["Total", formatZar(o.totalCents)]);
  return rows;
}

function totalsText(o: OrderEmailData): string {
  return [
    ...itemRows(o).map(([l, v]) => `${l}: ${v}`),
    "",
    ...totalRows(o).map(([l, v]) => `${l}: ${v}`),
    ...(o.vatIncludedCents > 0
      ? [`Includes VAT of ${formatZar(o.vatIncludedCents)}`]
      : []),
  ].join("\n");
}

function vatNote(o: OrderEmailData): string {
  return o.vatIncludedCents > 0
    ? mutedParagraph(`Total includes VAT of ${formatZar(o.vatIncludedCents)}.`)
    : "";
}

function orderLink(siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/order-status`;
}

/** Customer: payment received, order confirmed. */
export function orderConfirmationEmail(
  o: OrderEmailData,
  opts: { siteUrl: string; replyTo?: string },
): MailInput {
  const c = emailCopy.confirmation;
  const statusUrl = orderLink(opts.siteUrl);
  const deliveryLabel = DELIVERY_LABEL[o.deliveryMethod];

  const text = [
    `Hi ${o.firstName},`,
    "",
    c.intro,
    `Order number: ${o.orderNumber}`,
    "",
    totalsText(o),
    "",
    `${deliveryLabel} to:`,
    ...addressLines(o),
    "",
    "What happens next:",
    ...c.nextSteps.map((s) => `- ${s}`),
    `Check your order: ${statusUrl}`,
    "",
    emailCopy.help,
    emailCopy.signOff,
  ].join("\n");

  const html = layout(
    [
      heading(c.heading),
      paragraph(`Hi ${o.firstName},`),
      paragraph(c.intro),
      paragraph(`Order number: ${o.orderNumber}`),
      table([...itemRows(o), ...totalRows(o)], { boldLast: true }),
      vatNote(o),
      `<p style="margin:16px 0 4px"><strong>${escapeHtml(deliveryLabel)} to:</strong></p>`,
      `<p style="margin:0 0 12px">${addressLines(o).map(escapeHtml).join("<br>")}</p>`,
      `<p style="margin:16px 0 4px"><strong>What happens next</strong></p>`,
      bulletList(c.nextSteps),
      `<p style="margin:0 0 12px"><a href="${escapeHtml(statusUrl)}">Check your order status</a></p>`,
      paragraph(emailCopy.help),
      paragraph(emailCopy.signOff),
    ].join("\n"),
  );

  return {
    to: o.email,
    replyTo: opts.replyTo,
    subject: c.subject(o.orderNumber),
    text,
    html,
  };
}

/** Owner: a new paid order to pack. Flags stock shortfalls loudly. */
export function ownerNewOrderEmail(
  o: OrderEmailData,
  opts: { siteUrl: string; ownerEmail: string },
): MailInput {
  const adminUrl = `${opts.siteUrl.replace(/\/+$/, "")}/admin/orders/${o.id}`;
  const warning = o.stockShortfall
    ? "ATTENTION: stock ran out before this payment came through. The order is paid, so please check stock and contact the customer if you can't fulfil it."
    : null;
  const subject = `${o.stockShortfall ? "[STOCK PROBLEM] " : ""}New order ${o.orderNumber} (${formatZar(o.totalCents)})`;

  const text = [
    ...(warning ? [warning, ""] : []),
    `New paid order ${o.orderNumber}`,
    "",
    totalsText(o),
    "",
    "Customer:",
    `${o.firstName} ${o.lastName}`,
    o.email,
    o.phone,
    "",
    `${DELIVERY_LABEL[o.deliveryMethod]} to:`,
    ...addressLines(o),
    ...(o.deliveryNotes ? ["", `Delivery notes: ${o.deliveryNotes}`] : []),
    "",
    `Open in admin: ${adminUrl}`,
  ].join("\n");

  const html = layout(
    [
      warning
        ? `<p style="margin:0 0 16px;padding:12px;border:2px solid #b42318;color:#b42318;font-weight:bold">${escapeHtml(warning)}</p>`
        : "",
      heading(`New order ${o.orderNumber}`),
      table([...itemRows(o), ...totalRows(o)], { boldLast: true }),
      `<p style="margin:16px 0 4px"><strong>Customer</strong></p>`,
      `<p style="margin:0 0 12px">${[`${o.firstName} ${o.lastName}`, o.email, o.phone].map(escapeHtml).join("<br>")}</p>`,
      `<p style="margin:16px 0 4px"><strong>${escapeHtml(DELIVERY_LABEL[o.deliveryMethod])} to</strong></p>`,
      `<p style="margin:0 0 12px">${addressLines(o).map(escapeHtml).join("<br>")}</p>`,
      o.deliveryNotes
        ? `<p style="margin:0 0 12px;white-space:pre-wrap"><strong>Delivery notes:</strong> ${escapeHtml(o.deliveryNotes)}</p>`
        : "",
      `<p style="margin:0 0 12px"><a href="${escapeHtml(adminUrl)}">Open this order in admin</a></p>`,
    ].join("\n"),
  );

  return { to: opts.ownerEmail, subject, text, html };
}

/** Customer: order shipped, with courier and tracking. */
export function orderShippedEmail(
  o: OrderEmailData,
  opts: { siteUrl: string; replyTo?: string },
): MailInput {
  const c = emailCopy.shipped;
  const trackingUrl = safeTrackingUrl(o.trackingUrl);
  const details: string[] = [];
  if (o.courierName) details.push(`Courier: ${o.courierName}`);
  if (o.trackingNumber) details.push(`Tracking number: ${o.trackingNumber}`);

  const text = [
    `Hi ${o.firstName},`,
    "",
    c.intro,
    `Order number: ${o.orderNumber}`,
    ...details,
    ...(trackingUrl ? [`Track your parcel: ${trackingUrl}`] : []),
    "",
    "Delivering to:",
    ...addressLines(o),
    "",
    emailCopy.help,
    emailCopy.signOff,
  ].join("\n");

  const html = layout(
    [
      heading(c.heading),
      paragraph(`Hi ${o.firstName},`),
      paragraph(c.intro),
      paragraph(`Order number: ${o.orderNumber}`),
      details.length ? bulletList(details) : "",
      trackingUrl
        ? `<p style="margin:0 0 12px"><a href="${escapeHtml(trackingUrl)}">Track your parcel</a></p>`
        : "",
      `<p style="margin:16px 0 4px"><strong>Delivering to:</strong></p>`,
      `<p style="margin:0 0 12px">${addressLines(o).map(escapeHtml).join("<br>")}</p>`,
      paragraph(emailCopy.help),
      paragraph(emailCopy.signOff),
    ].join("\n"),
  );

  return {
    to: o.email,
    replyTo: opts.replyTo,
    subject: c.subject(o.orderNumber),
    text,
    html,
  };
}

/** Customer: order cancelled or refunded. */
export function orderCancelledOrRefundedEmail(
  o: OrderEmailData,
  kind: "cancelled" | "refunded",
  opts: { replyTo?: string },
): MailInput {
  const c = emailCopy[kind];
  const text = [
    `Hi ${o.firstName},`,
    "",
    c.intro,
    `Order number: ${o.orderNumber}`,
    `Total: ${formatZar(o.totalCents)}`,
    "",
    c.refundNote,
    "",
    emailCopy.help,
    emailCopy.signOff,
  ].join("\n");

  const html = layout(
    [
      heading(c.heading),
      paragraph(`Hi ${o.firstName},`),
      paragraph(c.intro),
      paragraph(`Order number: ${o.orderNumber}`),
      paragraph(`Total: ${formatZar(o.totalCents)}`),
      paragraph(c.refundNote),
      paragraph(emailCopy.help),
      paragraph(emailCopy.signOff),
    ].join("\n"),
  );

  return {
    to: o.email,
    replyTo: opts.replyTo,
    subject: c.subject(o.orderNumber),
    text,
    html,
  };
}
