"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";

/** Mark a contact message as handled / not handled. */
export async function setMessageHandledAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const handled = String(formData.get("handled") ?? "") === "true";
  if (!id || id.length > 64) return;
  await getDb().contactMessage.updateMany({ where: { id }, data: { handled } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
