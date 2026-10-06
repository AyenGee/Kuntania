import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { formatZar } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getDb().product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sizeLabel: true,
      priceCents: true,
      stock: true,
      active: true,
    },
  });

  return (
    <div>
      <PageHeader title="Products" />
      <TableWrap>
        <thead>
          <tr>
            <th className={th}>Product</th>
            <th className={th}>Price</th>
            <th className={th}>Stock</th>
            <th className={th}>In shop?</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className={td}>
                <Link href={`/admin/products/${p.id}`} className="font-medium underline">
                  {p.name}
                </Link>
                <br />
                <span className="text-ink-muted">{p.sizeLabel}</span>
              </td>
              <td className={td}>{formatZar(p.priceCents)}</td>
              <td className={td}>
                <span className={p.stock === 0 ? "font-semibold text-danger" : ""}>
                  {p.stock}
                </span>
              </td>
              <td className={td}>{p.active ? "Yes" : "Hidden"}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
