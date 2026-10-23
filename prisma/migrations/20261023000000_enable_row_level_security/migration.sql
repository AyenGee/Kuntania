-- Lock every table away from Supabase's public Data API.
--
-- Supabase publishes tables in the "public" schema through an auto-generated REST API for the
-- `anon` and `authenticated` roles, and new tables are NOT protected by default. This app never
-- uses that API: it connects directly as the table owner (the `postgres` role), which bypasses
-- row level security. Enabling RLS with no policies therefore denies the API to everyone else
-- while leaving the app untouched. It is harmless on any other PostgreSQL host.
--
-- Add a line here for every new table (a test fails if one is missing).

ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscountCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration history table.
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
