"use client";

import { useActionState } from "react";
import { subscribeToNewsletter } from "@/app/(site)/newsletter/actions";
import type { FormState } from "@/lib/validation/forms";
import { Honeypot, SubmitButton } from "./Field";
import { FormAlert } from "./FormAlert";

const initial: FormState = { ok: false };

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const errors = state.fieldErrors ?? {};
  // Several forms can appear on one page, so ids must be unique per source.
  const emailId = `newsletter-email-${source}`;
  const consentId = `newsletter-consent-${source}`;

  if (state.ok) {
    return (
      <p role="status" className="text-sm">
        {state.message ?? "Thanks! You're subscribed."}
      </p>
    );
  }

  return (
    <form action={action} className="relative space-y-3" noValidate>
      <Honeypot />
      <input type="hidden" name="source" value={source} />
      <FormAlert message={state.message} className="text-sm text-danger" />
      <div>
        <label htmlFor={emailId} className="mb-1 block text-sm font-medium">
          Email address
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          className="w-full rounded-control border border-control bg-surface px-3 py-2"
        />
        {errors.email && (
          <p id={`${emailId}-error`} className="mt-1 text-sm text-danger">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            required
            aria-describedby={errors.consent ? `${consentId}-error` : undefined}
            className="mt-1"
          />
          <span>
            I&rsquo;d like to receive emails from Kunta Nia and understand I can
            unsubscribe at any time. See our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <p id={`${consentId}-error`} className="mt-1 text-sm text-danger">
            {errors.consent}
          </p>
        )}
      </div>
      <SubmitButton pending={pending}>Subscribe</SubmitButton>
    </form>
  );
}
