"use client";

import { useActionState, useState } from "react";
import { saveDiscountAction } from "@/app/admin/(protected)/discounts/actions";
import { Field, SelectField, SubmitButton } from "@/components/forms/Field";
import type { FormState } from "@/lib/validation/forms";

const initialState: FormState = { ok: false };

export type DiscountInitial = {
  id?: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export function DiscountForm({ initial }: { initial: DiscountInitial }) {
  const [state, action, pending] = useActionState(saveDiscountAction, initialState);
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const val = (k: keyof DiscountInitial) => (v[k] ?? (initial[k] as string)) as string;
  const [type, setType] = useState<"PERCENT" | "FIXED">(initial.type);
  const editing = Boolean(initial.id);

  return (
    <form action={action} className="space-y-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
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
        id="code"
        label="Code"
        required
        readOnly={editing}
        hint={
          editing
            ? "The code can't be changed once created."
            : "Customers type this at checkout, e.g. WELCOME10"
        }
        defaultValue={val("code")}
        error={errors.code}
        autoCapitalize="characters"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="type"
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
          options={[
            { value: "PERCENT", label: "Percentage off" },
            { value: "FIXED", label: "Rand amount off" },
          ]}
          error={errors.type}
        />
        <Field
          id="value"
          label={type === "PERCENT" ? "Percentage (1 to 100)" : "Amount off (R)"}
          required
          inputMode="decimal"
          defaultValue={val("value")}
          error={errors.value}
        />
        <Field
          id="minSubtotal"
          label="Minimum spend (R, optional)"
          inputMode="decimal"
          defaultValue={val("minSubtotal")}
          error={errors.minSubtotal}
        />
        <Field
          id="maxUses"
          label="Maximum uses (optional)"
          inputMode="numeric"
          hint="Leave blank for unlimited"
          defaultValue={val("maxUses")}
          error={errors.maxUses}
        />
        <Field
          id="startsAt"
          label="Starts on (optional)"
          type="date"
          defaultValue={val("startsAt")}
          error={errors.startsAt}
        />
        <Field
          id="endsAt"
          label="Last day (optional)"
          type="date"
          defaultValue={val("endsAt")}
          error={errors.endsAt}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={state.values ? v.active === "on" : initial.active}
        />
        <span>Active (untick to switch the code off)</span>
      </label>

      <SubmitButton pending={pending} pendingLabel="Saving…">
        {editing ? "Save changes" : "Create code"}
      </SubmitButton>
    </form>
  );
}
