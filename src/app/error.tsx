"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-ink-muted">
        Sorry about that. Please try again, or head back to the shop.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-brand px-5 py-2.5 text-brand-contrast"
        >
          Try again
        </button>
        <Link href="/shop" className="rounded-control border border-line px-5 py-2.5">
          Go to the shop
        </Link>
      </div>
    </div>
  );
}
