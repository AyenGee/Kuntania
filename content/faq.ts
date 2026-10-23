/**
 * FAQ entries. Delivery, returns and usage answers reflect what the client confirmed in
 * October 2026. Entries with `sensitive: true` give health-related guidance and must keep the
 * "consult your doctor" wording unless the client's advisor approves a change.
 * TODO(CLIENT): review the children and pregnancy answers.
 */

import { fulfilment, shipping } from "./site";

export type FaqEntry = { question: string; answer: string; sensitive?: boolean };

const rands = (cents: number) => `R${cents / 100}`;

export const faq: FaqEntry[] = [
  {
    question: "How long will my order take to arrive?",
    answer: `Orders are packed within ${fulfilment.packingTime} of payment being confirmed. Courier delivery then typically takes ${fulfilment.deliveryTime}. We'll email you tracking details once your order ships.`,
  },
  {
    question: "How much is delivery?",
    answer: `A flat ${rands(shipping.courierFlatRateCents)} per order${
      shipping.freeShippingThresholdCents !== null
        ? `, and delivery is free on orders over ${rands(shipping.freeShippingThresholdCents)}`
        : ""
    }.`,
  },
  {
    question: "Where do you deliver?",
    answer:
      "We deliver nationwide, door to door, to major cities and metropolitan areas. We can't currently deliver to deep rural areas or outlying postal codes. We don't offer pick-up points or collection.",
  },
  {
    question: "What is your returns policy?",
    answer:
      "For hygiene reasons we can't accept returns of opened or used products unless they are defective or not as described. If you return a product because you changed your mind, you pay the return shipping. If something arrives damaged or faulty, contact us with your order number and photos and we'll make it right at no cost to you. See our Shipping & Returns policy for the full details.",
  },
  {
    question: "How often should I use the products?",
    answer:
      "Use the Pre-wash Conditioning Mask every 2 to 3 weeks, before you wash. With the Hair Growth Oil, apply a few drops directly to the scalp with the dropper and massage with your fingertips for 3 to 5 minutes. Each product page has full directions for use.",
  },
  {
    question: "Are your products safe for children?",
    sensitive: true,
    answer:
      "Please consult your doctor or your child's paediatrician before using any new product on a child. Always do a patch test first, and keep all products out of reach of children.",
  },
  {
    question: "Are your products safe to use during pregnancy?",
    sensitive: true,
    answer:
      "If you are pregnant or breastfeeding, please consult your doctor before using any new product. Check the full ingredients list on each product page.",
  },
  {
    question: "Should I do a patch test?",
    answer:
      "Yes. Apply a small amount to the inside of your elbow and wait 48 hours before first use. Stop using the product and consult your doctor if irritation occurs.",
  },
];
