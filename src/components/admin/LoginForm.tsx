"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/login/actions";
import { Field, SubmitButton } from "@/components/forms/Field";
import type { FormState } from "@/lib/validation/forms";

const initial: FormState = { ok: false };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <Field id="email" label="Email" type="email" required autoComplete="username" />
      <Field
        id="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}
