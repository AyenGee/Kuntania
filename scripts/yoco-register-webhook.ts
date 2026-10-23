import "dotenv/config";

/**
 * Registers the payment webhook with Yoco and prints its signing secret (shown only once).
 *
 *   npm run yoco:webhook
 *
 * Reads YOCO_SECRET_KEY and SITE_URL from .env. Run it once per environment (SITE_URL must be
 * the public HTTPS address Yoco can reach, e.g. your Vercel domain), then put the printed
 * secret in YOCO_WEBHOOK_SECRET. Yoco allows one webhook, so delete the old one first if needed.
 */
async function main() {
  const key = process.env.YOCO_SECRET_KEY;
  const site = process.env.SITE_URL;
  if (!key) throw new Error("YOCO_SECRET_KEY is not set");
  if (!site || !site.startsWith("https://")) {
    throw new Error("SITE_URL must be the public https:// address of the shop");
  }

  const url = `${site.replace(/\/$/, "")}/api/payments/yoco/webhook`;
  const response = await fetch("https://payments.yoco.com/api/webhooks", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "kunta-nia-payments", url }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Yoco refused (HTTP ${response.status}): ${text}`);

  const data = JSON.parse(text) as { id?: string; secret?: string };
  console.log(`Webhook registered for ${url}`);
  console.log(`id:     ${data.id}`);
  console.log(`secret: ${data.secret}`);
  console.log(
    "\nCopy the secret into YOCO_WEBHOOK_SECRET now. Yoco will not show it again.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
