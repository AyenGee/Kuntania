import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-muted">
        Sorry, we couldn&rsquo;t find the page you were looking for.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/shop"
          className="rounded-control bg-brand px-5 py-2.5 text-brand-contrast"
        >
          Go to the shop
        </Link>
        <Link href="/" className="rounded-control border border-line px-5 py-2.5">
          Home
        </Link>
      </div>
    </div>
  );
}
