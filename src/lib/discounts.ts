import { formatZar } from "@/lib/money";

export type DiscountRow = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

export type DiscountResult =
  { ok: true; amountCents: number } | { ok: false; message: string };

/** Codes are stored and compared uppercase. */
export function normaliseCode(input: string): string {
  return input.trim().toUpperCase();
}

const INVALID = "This discount code isn't valid.";

/**
 * Check a discount code against a subtotal and compute the amount off.
 * Unknown, inactive, not-yet-started, expired and fully-used codes all give the same
 * generic message so codes can't be probed. A percentage rounds DOWN (in the shop's favour);
 * a fixed amount never exceeds the subtotal.
 */
export function evaluateDiscount(
  discount: DiscountRow | null,
  subtotalCents: number,
  now: Date,
): DiscountResult {
  if (!discount || !discount.active) return { ok: false, message: INVALID };
  if (discount.startsAt && discount.startsAt > now)
    return { ok: false, message: INVALID };
  if (discount.endsAt && discount.endsAt < now) return { ok: false, message: INVALID };
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { ok: false, message: INVALID };
  }
  if (subtotalCents < discount.minSubtotalCents) {
    return {
      ok: false,
      message: `Spend at least ${formatZar(discount.minSubtotalCents)} to use this code.`,
    };
  }
  const raw =
    discount.type === "PERCENT"
      ? Math.floor((subtotalCents * Math.min(Math.max(discount.value, 0), 100)) / 100)
      : discount.value;
  return { ok: true, amountCents: Math.max(0, Math.min(raw, subtotalCents)) };
}
