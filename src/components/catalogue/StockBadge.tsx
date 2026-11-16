import { stockStatus } from "@/lib/catalogue";

/**
 * Products are made on demand, so "In stock" and "Only X left" are never shown. The only
 * thing worth telling a customer is that an item cannot be ordered right now (stock 0).
 */
export function StockBadge({ stock }: { stock: number }) {
  if (stockStatus(stock).state !== "sold_out") return null;
  return <p className="font-medium text-danger">Sold out</p>;
}
