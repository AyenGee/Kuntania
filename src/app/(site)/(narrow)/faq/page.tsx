import type { Metadata } from "next";
import { faq } from "@content/faq";
import { pageMeta } from "@content/pages";

export const metadata: Metadata = {
  title: pageMeta.faq.title,
  description: pageMeta.faq.description,
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Frequently asked questions</h1>
      <div className="mt-6 space-y-3">
        {faq.map((entry) => (
          <details key={entry.question} className="rounded-card border border-line p-4">
            <summary className="cursor-pointer font-medium">{entry.question}</summary>
            <p className="mt-3 text-ink-muted">{entry.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
