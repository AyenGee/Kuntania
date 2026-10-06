import { stockStatus } from "@/lib/catalogue";

export function StockBadge({ stock }: { stock: number }) {
  const status = stockStatus(stock);
  if (status.state === "sold_out") {
    return <p className="font-medium text-danger">Sold out</p>;
  }
  if (status.state === "low") {
    return <p className="font-medium text-accent">Only {status.remaining} left</p>;
  }
  return <p className="font-medium text-success">In stock</p>;
}
