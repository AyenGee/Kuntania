/** What a payment provider needs to know about an order. Amounts are integer cents (ZAR). */
export type PayableOrder = {
  orderNumber: string;
  totalCents: number;
  email: string;
  firstName: string;
  lastName: string;
};

/** Where to send the customer to pay, and the provider's id for this payment attempt. */
export type PaymentRedirect = {
  url: string;
  /** The provider's checkout id, stored on the order so the payment notification can find it. */
  checkoutId: string;
};

/** Keep payment code behind this interface so another provider can be added later. */
export interface PaymentProvider {
  readonly id: string;
  /** Create a hosted checkout for a freshly created order. Throws if the provider rejects it. */
  createPayment(order: PayableOrder): Promise<PaymentRedirect>;
}
