/**
 * FAQ entries. ALL are drafts for client review (TODO(CLIENT): review every answer).
 * Entries with `sensitive: true` give health-related guidance and must keep the
 * "consult your doctor" wording unless the client's advisor approves a change.
 */

export type FaqEntry = { question: string; answer: string; sensitive?: boolean };

export const faq: FaqEntry[] = [
  {
    question: "How long will my order take to arrive?",
    // TODO(CLIENT): confirm processing and courier times
    answer:
      "Orders are usually packed within TODO(CLIENT): number business days of payment being confirmed. Courier delivery then typically takes TODO(CLIENT): number business days. We'll email you tracking details once your order ships.",
  },
  {
    question: "Where do you deliver?",
    // TODO(CLIENT): confirm delivery areas
    answer:
      "We deliver within South Africa. TODO(CLIENT): confirm whether all areas are covered. Remote areas may take longer.",
  },
  {
    question: "What is your returns policy?",
    // TODO(CLIENT): confirm return window
    answer:
      "For hygiene reasons we can't accept returns of opened or used products unless they are defective or not as described. If something arrives damaged or faulty, contact us with your order number and photos and we'll make it right. See our Shipping & Returns policy for the full details.",
  },
  {
    question: "How often should I use the products?",
    // TODO(CLIENT): confirm recommended frequency for each product
    answer:
      "TODO(CLIENT): confirm recommended frequency for each product, e.g. how often to use the oil and the mask. Each product page has full directions for use.",
  },
  {
    question: "Are your products safe for children?",
    sensitive: true,
    // TODO(CLIENT): confirm wording
    answer:
      "Please consult your doctor or your child's paediatrician before using any new product on a child. Always do a patch test first, and keep all products out of reach of children.",
  },
  {
    question: "Are your products safe to use during pregnancy?",
    sensitive: true,
    // TODO(CLIENT): confirm wording
    answer:
      "If you are pregnant or breastfeeding, please consult your doctor before using any new product. Check the full ingredients list on each product page.",
  },
  {
    question: "Should I do a patch test?",
    answer:
      "Yes. Apply a small amount to the inside of your elbow and wait 48 hours before first use. Stop using the product and consult your doctor if irritation occurs.",
  },
];
