import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type CommonProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

const controlClass =
  "border-control bg-surface w-full rounded-control border px-3 py-2 text-base aria-[invalid=true]:border-danger";

/** Labelled input/textarea with error + hint tied to the control (WCAG 1.3.1, 3.3.1). */
export function Field({
  id,
  label,
  error,
  hint,
  multiline,
  ...rest
}: CommonProps & { multiline?: boolean } & InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const shared = {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {rest.required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={6} className={controlClass} {...rest} />
      ) : (
        <input {...shared} className={controlClass} {...rest} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Hidden-from-humans trap field. Bots that fill it are silently dropped server-side. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </label>
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-brand px-5 py-2.5 font-medium text-brand-contrast disabled:opacity-60"
    >
      {pending ? "Sending…" : children}
    </button>
  );
}
