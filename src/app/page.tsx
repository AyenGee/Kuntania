import { home } from "@content/home";

export default function HomePage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold">{home.hero.heading}</h1>
      <p className="mt-3 text-ink-muted">{home.hero.body}</p>
    </section>
  );
}
