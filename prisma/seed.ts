import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedProducts } from "../content/products";

/**
 * Idempotent seed: creates the two launch products and one admin user if missing.
 * It NEVER overwrites existing rows, so re-running it can't clobber the owner's edits
 * (prices, stock, copy) or reset the admin password.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    for (const p of seedProducts) {
      await db.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: p,
      });
      console.log(`product ready: ${p.slug}`);
    }

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin user");
    } else if (password.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters");
    } else {
      const existing = await db.adminUser.findUnique({ where: { email } });
      if (existing) {
        console.log("admin user already exists: left unchanged");
      } else {
        await db.adminUser.create({
          data: {
            email,
            name: process.env.ADMIN_NAME?.trim() || "Owner",
            passwordHash: await bcrypt.hash(password, 12),
          },
        });
        console.log("admin user created");
      }
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
