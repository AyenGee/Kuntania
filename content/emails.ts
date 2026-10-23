/**
 * Wording for transactional emails. Edit here, not in the templates.
 * Every TODO(CLIENT) is tracked in docs/CLIENT_TODO.md.
 */

export const emailCopy = {
  /** Shown at the bottom of every customer email. */
  signOff: "Thank you for choosing Kunta Nia.",

  confirmation: {
    subject: (orderNumber: string) => `Your Kunta Nia order ${orderNumber} is confirmed`,
    heading: "Thank you for your order!",
    intro: "We've received your payment and your order is confirmed.",
    // Times confirmed by the client (see fulfilment in content/site.ts and the FAQ).
    nextSteps: [
      "We'll pack your order within 1 business day.",
      "When it ships, we'll email you the courier and tracking details. Delivery usually takes 2 to 4 business days.",
      "You can check your order any time on our order status page.",
    ],
  },

  shipped: {
    subject: (orderNumber: string) => `Your Kunta Nia order ${orderNumber} has shipped`,
    heading: "Your order is on its way",
    intro: "Good news: your order has been handed to the courier.",
  },

  cancelled: {
    subject: (orderNumber: string) => `Your Kunta Nia order ${orderNumber} was cancelled`,
    heading: "Your order has been cancelled",
    intro: "Your order has been cancelled.",
    // TODO(CLIENT): confirm how and when cancelled orders are refunded
    refundNote:
      "If you've already paid, we'll refund you to your original payment method. Your bank may take a few days to show it.",
  },

  refunded: {
    subject: (orderNumber: string) => `Your Kunta Nia order ${orderNumber} was refunded`,
    heading: "Your order has been refunded",
    intro: "We've refunded your order.",
    // TODO(CLIENT): confirm refund timing (Yoco refunds can take several business days)
    refundNote:
      "The refund goes back to your original payment method. Your bank may take several business days to show it.",
  },

  help: "Questions? Just reply to this email or contact us through our website.",
} as const;
