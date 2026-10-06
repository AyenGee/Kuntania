"use client";

import { useActionState } from "react";
import { unsubscribeFromNewsletter } from "@/app/(site)/newsletter/actions";
import type { FormState } from "@/lib/validation/forms";

const initial: FormState = { ok: false };

/** Confirmation button (POST) so email-scanner prefetching of the link can't unsubscribe anyone. */
export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(unsubscribeFromNewsletter, initial);

  if (state.ok) return <p role="status">{state.message}</p>;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.message && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-brand px-5 py-2.5 font-medium text-brand-contrast disabled:opacity-60"
      >
        {pending ? "Working…" : "Confirm unsubscribe"}
      </button>
    </form>
  );
}
