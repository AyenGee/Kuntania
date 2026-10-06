import Link from "next/link";
import { nav, site } from "@content/site";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-heading text-xl font-semibold">
          {site.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          {nav.main.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
          {/* Cart count is wired up in Phase 4 */}
          <Link href="/cart" className="hover:underline">
            Cart
          </Link>
        </nav>
      </div>
    </header>
  );
}
