"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { shipDetailsSchema, transitionOrder } from "@/lib/admin/order-actions";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email/order-emails";
import { fieldErrorsFrom, type FormState } from "@/lib/validation/forms";

const intentSchema = z.object({
  orderId: z.string().min(1).max(64),
  intent: z.enum([
    "processing",
    "ship",
    "delivered",
    "cancel",
    "refund",
    "notes",
    "resend",
  ]),
});

const EMAIL_NOTE = {
  sent: " The customer was emailed.",
  failed:
    " The status was saved but the email could not be sent: check the SMTP settings.",
  none: "",
} as const;

/**
 * One admin action endpoint for the order page, switched on `intent`.
 * Every call re-checks the admin session on the server (never trust the page that rendered
 * the button) and uses transitionOrder, which enforces the allowed status changes.
 */
export async function orderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = intentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "Something was wrong with that request." };
  const { orderId, intent } = parsed.data;

  try {
    let result: FormState;

    switch (intent) {
      case "processing":
      case "delivered":
      case "cancel":
      case "refund": {
        const to = {
          processing: "PROCESSING",
          delivered: "DELIVERED",
          cancel: "CANCELLED",
          refund: "REFUNDED",
        }[intent] as "PROCESSING" | "DELIVERED" | "CANCELLED" | "REFUNDED";
        const r = await transitionOrder({ orderId, to, adminName: admin.name });
        result = r.ok
          ? {
              ok: true,
              message: `Order updated.${EMAIL_NOTE[r.email]}${r.restocked ? " Stock was returned to the shelf." : ""}`,
            }
          : { ok: false, message: r.message };
        break;
      }

      case "ship": {
        const ship = shipDetailsSchema.safeParse(Object.fromEntries(formData));
        if (!ship.success) {
          return { ok: false, fieldErrors: fieldErrorsFrom(ship.error) };
        }
        const r = await transitionOrder({
          orderId,
          to: "SHIPPED",
          adminName: admin.name,
          ship: ship.data,
        });
        result = r.ok
          ? { ok: true, message: `Order marked as shipped.${EMAIL_NOTE[r.email]}` }
          : { ok: false, message: r.message };
        break;
      }

      case "notes": {
        const notes = String(formData.get("adminNotes") ?? "")
          .trim()
          .slice(0, 5000);
        await getDb().order.update({
          where: { id: orderId },
          data: { adminNotes: notes === "" ? null : notes },
        });
        result = { ok: true, message: "Notes saved." };
        break;
      }

      case "resend": {
        const order = await getDb().order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        if (!order || order.status === "PENDING_PAYMENT") {
          return {
            ok: false,
            message: "There's nothing to confirm: this order hasn't been paid.",
          };
        }
        const sent = await sendOrderConfirmation(orderId);
        result = sent
          ? { ok: true, message: "Confirmation email sent to the customer." }
          : {
              ok: false,
              message: "The email could not be sent. Check the SMTP settings.",
            };
        break;
      }
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin.order_action_failed",
        intent,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, something went wrong. Please try again." };
  }
}
