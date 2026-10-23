"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/app/admin/(protected)/products/actions";
import { Field, SubmitButton } from "@/components/forms/Field";
import type { FormState } from "@/lib/validation/forms";
import { PhotoListField } from "./PhotoListField";
import { TitledListField } from "./TitledListField";

const initial: FormState = { ok: false };

export type ProductFormInitial = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  benefits: { title: string; body: string }[];
  howToUse: { title: string; body: string }[];
  images: { src: string; alt: string }[];
  ingredientsInci: string;
  warnings: string;
  sizeLabel: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sortOrder: string;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
};

export function ProductForm({ product }: { product: ProductFormInitial }) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};
  // After a failed save, keep what the owner typed; otherwise show the saved values.
  const val = (key: keyof ProductFormInitial) =>
    (v[key] ?? (product[key] as string)) as string;
  const photos = () => {
    try {
      const parsed = v.images ? JSON.parse(v.images) : null;
      return Array.isArray(parsed)
        ? (parsed as { src: string; alt: string }[])
        : product.images;
    } catch {
      return product.images;
    }
  };
  const list = (key: "benefits" | "howToUse") => {
    try {
      const parsed = v[key] ? JSON.parse(v[key]) : null;
      return Array.isArray(parsed)
        ? (parsed as { title: string; body: string }[])
        : product[key];
    } catch {
      return product[key];
    }
  };

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={product.id} />

      <div aria-live="polite">
        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`rounded-control border-2 p-3 ${state.ok ? "border-success" : "border-danger text-danger"}`}
          >
            {state.message}
          </p>
        )}
      </div>

      <Field
        id="name"
        label="Name"
        required
        defaultValue={val("name")}
        error={errors.name}
      />
      <Field
        id="shortName"
        label="Short name"
        required
        defaultValue={val("shortName")}
        error={errors.shortName}
      />
      <Field
        id="tagline"
        label="Tagline"
        required
        defaultValue={val("tagline")}
        error={errors.tagline}
      />
      <Field
        id="description"
        label="Description"
        required
        multiline
        defaultValue={val("description")}
        error={errors.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="price"
          label="Price (R)"
          required
          inputMode="decimal"
          hint="Including VAT, e.g. 149.90"
          defaultValue={val("price")}
          error={errors.price}
        />
        <Field
          id="compareAtPrice"
          label="Old price to cross out (R, optional)"
          inputMode="decimal"
          hint="Leave blank if not on sale"
          defaultValue={val("compareAtPrice")}
          error={errors.compareAtPrice}
        />
        <Field
          id="stock"
          label="Stock"
          required
          inputMode="numeric"
          defaultValue={val("stock")}
          error={errors.stock}
        />
        <Field
          id="sizeLabel"
          label="Size"
          required
          hint="For example 100 ml"
          defaultValue={val("sizeLabel")}
          error={errors.sizeLabel}
        />
        <Field
          id="sortOrder"
          label="Position in shop"
          inputMode="numeric"
          hint="Lower numbers show first"
          defaultValue={val("sortOrder")}
          error={errors.sortOrder}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={state.values ? v.active === "on" : product.active}
        />
        <span>Show this product in the shop (untick to hide it)</span>
      </label>

      <TitledListField
        key={`benefits-${state.values ? "e" : "s"}`}
        name="benefits"
        label="Key benefits"
        initial={list("benefits")}
        error={errors.benefits}
      />
      <TitledListField
        key={`how-${state.values ? "e" : "s"}`}
        name="howToUse"
        label="How to use"
        initial={list("howToUse")}
        error={errors.howToUse}
      />

      <PhotoListField
        key={`photos-${state.values ? "e" : "s"}`}
        name="images"
        initial={photos()}
        error={errors.images}
      />

      <Field
        id="ingredientsInci"
        label="Full ingredients (INCI)"
        required
        multiline
        defaultValue={val("ingredientsInci")}
        error={errors.ingredientsInci}
      />
      <Field
        id="warnings"
        label="Warnings and patch test (one per line)"
        required
        multiline
        defaultValue={val("warnings")}
        error={errors.warnings}
      />
      <Field
        id="seoTitle"
        label="Google title"
        required
        defaultValue={val("seoTitle")}
        error={errors.seoTitle}
      />
      <Field
        id="seoDescription"
        label="Google description"
        required
        multiline
        defaultValue={val("seoDescription")}
        error={errors.seoDescription}
      />

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
