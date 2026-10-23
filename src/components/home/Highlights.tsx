import { home } from "@content/home";

/** Three short reasons to choose the brand, as cards (the reference's info-card row). */
export function Highlights() {
  return (
    <section
      aria-labelledby="highlights-heading"
      className="mx-auto max-w-site px-4 pb-16"
    >
      <h2 id="highlights-heading" className="text-center text-3xl">
        {home.highlights.heading}
      </h2>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {home.highlights.items.map((item) => (
          <li
            key={item.title}
            className="rounded-card border border-line bg-surface p-6 shadow-sm"
          >
            <h3 className="font-heading text-xl">{item.title}</h3>
            <p className="mt-2 text-ink-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
