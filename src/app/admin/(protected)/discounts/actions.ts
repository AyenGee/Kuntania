"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { discountFormSchema } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation/forms";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/** Create (no id) or update (id) a discount code. The code itself can't be changed once created. */
export async function saveDiscountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = getDb();

  const raw = Object.fromEntries(formData);
  if (id) {
    const existing = await db.discountCode.findUnique({
      where: { id },
      select: { code: true },
    });
    if (!existing) return { ok: false, message: "Discount code not found." };
    raw.code = existing.code;
  }

  const parsed = discountFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: valuesFrom(formData, ["id"]),
    };
  }
  const d = parsed.data;
  const data = {
    type: d.type,
    value: d.value,
    minSubtotalCents: d.minSubtotal,
    maxUses: d.maxUses,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    active: d.active,
  };

  try {
    if (id) {
      await db.discountCode.update({ where: { id }, data });
      revalidatePath("/admin/discounts");
      return { ok: true, message: "Saved." };
    }
    await db.discountCode.create({ data: { code: d.code, ...data } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "That code already exists.",
        fieldErrors: { code: "That code already exists" },
        values: valuesFrom(formData, ["id"]),
      };
    }
    console.error(
      JSON.stringify({
        event: "admin.discount_save_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, we couldn't save that. Please try again." };
  }
  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

/** Quick activate / deactivate from the list. */
export async function toggleDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getDb();
  const current = await db.discountCode.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!current) return;
  await db.discountCode.update({ where: { id }, data: { active: !current.active } });
  revalidatePath("/admin/discounts");
}
