import Link from "next/link";
import { logoutAction } from "@/app/admin/login/actions";
import { requireAdmin } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/subscribers", label: "Subscribers" },
] as const;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="bg-brand text-brand-contrast print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-heading text-lg">Kunta Nia admin</span>
          <nav
            aria-label="Admin"
            className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-1 underline-offset-4 hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{admin.name}</span>
            <button
              type="submit"
              className="rounded-control border border-brand-contrast px-3 py-1"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
