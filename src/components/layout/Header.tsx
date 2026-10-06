import Image from "next/image";
import Link from "next/link";
import { images } from "@content/images";
import { nav, site } from "@content/site";
import { CartCount } from "@/components/cart/CartCount";

/**
 * Maroon header: emblem + name on the left, a normal row of links and the cart on the right.
 * On narrow screens the links drop to their own centred row, so nothing overflows.
 */
export function Header() {
  const emblem = images.logoEmblem;
  return (
    <header className="sticky top-0 z-40 bg-brand text-brand-contrast shadow-sm">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label={`${site.name} home`}
        >
          <Image
            src={emblem.src}
            alt=""
            width={emblem.width}
            height={emblem.height}
            priority
            className="h-10 w-auto"
          />
          <span className="font-heading text-xl tracking-[0.2em] text-gold uppercase">
            {site.name}
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="flex w-full items-center justify-center gap-x-6 gap-y-1 text-sm font-medium md:w-auto md:justify-end"
        >
          {nav.main.map((item) => (
            <Link key={item.href} href={item.href} className="py-1 hover:underline">
              {item.label}
            </Link>
          ))}
          <CartCount />
        </nav>
      </div>
    </header>
  );
}
