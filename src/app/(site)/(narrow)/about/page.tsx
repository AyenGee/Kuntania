import type { Metadata } from "next";
import { about } from "@content/about";
import { pageMeta } from "@content/pages";

export const metadata: Metadata = {
  title: pageMeta.about.title,
  description: pageMeta.about.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const sections = [about.story, about.philosophy, about.commitment];
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">{pageMeta.about.title}</h1>
      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-2xl font-semibold">{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mt-3">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
