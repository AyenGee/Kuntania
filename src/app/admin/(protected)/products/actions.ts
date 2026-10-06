"use server";

import { revalidatePath } from "next/cache";
import { productFormSchema } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation/forms";

export async function saveProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id.length > 64) return { ok: false, message: "Product not found." };

  const parsed = productFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: valuesFrom(formData, ["id"]),
    };
  }
  const d = parsed.data;

  try {
    const product = await getDb().product.update({
      where: { id },
      data: {
        name: d.name,
        shortName: d.shortName,
        tagline: d.tagline,
        description: d.description,
        benefits: d.benefits,
        howToUse: d.howToUse,
        images: d.images,
        ingredientsInci: d.ingredientsInci,
        warnings: d.warnings,
        sizeLabel: d.sizeLabel,
        priceCents: d.price,
        compareAtPriceCents: d.compareAtPrice,
        stock: d.stock,
        sortOrder: d.sortOrder,
        active: d.active,
        seoTitle: d.seoTitle,
        seoDescription: d.seoDescription,
      },
      select: { slug: true },
    });
    console.info(JSON.stringify({ event: "admin.product_saved", by: admin.id }));
    // Customers see the change straight away.
    revalidatePath("/shop");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/");
    revalidatePath("/admin/products");
    return { ok: true, message: "Saved. The change is live on the website." };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin.product_save_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, message: "Sorry, we couldn't save that. Please try again." };
  }
}
