import "dotenv/config";
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Create an admin user, or reset the password of an existing one.
 *
 *   npm run admin:create -- --email owner@example.co.za --name "Owner"
 *
 * The password is typed at a hidden prompt (never on the command line, so it can't end up in
 * shell history). For non-interactive use (CI, provisioning) set ADMIN_PASSWORD instead.
 * Passwords must be at least 12 characters.
 */

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // Mute echo while the password is typed.
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })
      ._writeToOutput;
    let muted = false;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (
      s: string,
    ) => {
      if (!muted) write.call(rl, s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) {
    throw new Error(
      "No terminal to prompt on. Set ADMIN_PASSWORD or run this in a terminal.",
    );
  }
  const first = await promptHidden("Password (min 12 characters): ");
  const second = await promptHidden("Repeat password: ");
  if (first !== second) throw new Error("Passwords do not match.");
  return first;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = (arg("name") ?? process.env.ADMIN_NAME ?? "Owner").trim() || "Owner";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      'Please provide a valid email: npm run admin:create -- --email you@example.com --name "Your Name"',
    );
  }

  const password = await readPassword();
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      await db.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, name },
      });
      console.log(`Password reset for ${email}.`);
    } else {
      await db.adminUser.create({ data: { email, name, passwordHash } });
      console.log(`Admin user created: ${email}.`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
