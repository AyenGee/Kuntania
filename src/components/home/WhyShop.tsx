import { home } from "@content/home";

type Icon = (typeof home.whyShop)[number]["icon"];

const PATHS: Record<Icon, string> = {
  truck:
    "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3",
  box: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8",
  chat: "M4 5h16v11H9l-5 4z",
};

/** "Why shop with us" strip. Icons are decorative (the text carries the meaning). */
export function WhyShop() {
  return (
    <section aria-labelledby="why-shop-heading" className="bg-surface-muted">
      <div className="mx-auto max-w-site px-4 py-12">
        <h2 id="why-shop-heading" className="sr-only">
          Why shop with Kunta Nia
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {home.whyShop.map((item) => (
            <li key={item.title} className="flex items-start gap-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="mt-0.5 h-8 w-8 shrink-0 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={PATHS[item.icon]} />
              </svg>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
