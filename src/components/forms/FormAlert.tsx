"use client";

import { useEffect, useRef } from "react";

/**
 * Error summary for a form. When a new message appears, keyboard focus moves to it so
 * keyboard and screen-reader users notice that the submit failed (WCAG 3.3.1, 4.1.3).
 */
export function FormAlert({
  message,
  className = "text-danger",
}: {
  message: string | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message) return null;
  return (
    <p ref={ref} role="alert" tabIndex={-1} className={`${className} outline-offset-4`}>
      {message}
    </p>
  );
}
