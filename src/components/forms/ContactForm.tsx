"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/contact/actions";
import type { FormState } from "@/lib/validation/forms";
import { Field, Honeypot, SubmitButton } from "./Field";

const initial: FormState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <p role="status" className="rounded-card border border-line bg-surface-muted p-4">
        Thank you — your message has been sent. We&rsquo;ll be in touch soon.
      </p>
    );
  }

  return (
    <form action={action} className="relative space-y-4" noValidate>
      <Honeypot />
      {state.message && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <Field id="name" label="Name" required autoComplete="name" error={errors.name} />
      <Field
        id="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        error={errors.email}
      />
      <Field
        id="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        hint="South African number, e.g. 082 123 4567"
        error={errors.phone}
      />
      <Field id="subject" label="Subject" required error={errors.subject} />
      <Field id="message" label="Message" required multiline error={errors.message} />
      <p className="text-sm text-ink-muted">
        We use your details only to reply to you. See our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>
      <SubmitButton pending={pending}>Send message</SubmitButton>
    </form>
  );
}
