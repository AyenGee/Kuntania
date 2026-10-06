/** What a payment provider needs to know about an order. Amounts are integer cents (ZAR). */
export type PayableOrder = {
  orderNumber: string;
  totalCents: number;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * How to send the customer to the provider's payment page. PayFast needs a form POST;
 * a provider such as Yoco could instead return a plain redirect (method "GET", no fields).
 */
export type PaymentRedirect = {
  method: "POST" | "GET";
  url: string;
  fields: Record<string, string>;
};

/** Keep payment code behind this interface so another provider can be added later. */
export interface PaymentProvider {
  readonly id: string;
  /** Build the redirect for a freshly created order. Throws if the provider isn't configured. */
  createPayment(order: PayableOrder): PaymentRedirect;
}
