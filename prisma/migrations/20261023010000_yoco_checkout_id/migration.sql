-- Payments move from PayFast to Yoco: remember Yoco's checkout id on the order.
ALTER TABLE "Order" ADD COLUMN "paymentCheckoutId" TEXT;
ALTER TABLE "Order" ALTER COLUMN "paymentProvider" SET DEFAULT 'yoco';
CREATE INDEX "Order_paymentCheckoutId_idx" ON "Order"("paymentCheckoutId");
