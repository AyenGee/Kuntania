import "dotenv/config";

/**
 * Manages the payment webhook with Yoco.
 *
 *   npm run yoco:webhook                  register the webhook and print its signing secret
 *   npm run yoco:webhook -- --list        list the webhooks registered for the key
 *   npm run yoco:webhook -- --delete <id> delete a webhook by id
 *
 * Reads YOCO_SECRET_KEY and SITE_URL from .env. Register once per environment (SITE_URL must be
 * the public HTTPS address Yoco can reach, e.g. https://kuntania.com), then put the printed
 * secret in YOCO_WEBHOOK_SECRET. The secret is shown only once. Yoco allows one webhook, so
 * delete the old one first if registering fails.
 */
const API = "https://payments.yoco.com/api/webhooks";

async function call(key: string, method: string, path = "", body?: unknown) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Yoco refused (HTTP ${response.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  const key = process.env.YOCO_SECRET_KEY;
  const site = process.env.SITE_URL;
  if (!key) throw new Error("YOCO_SECRET_KEY is not set");
  console.log(`Using a ${key.startsWith("sk_test_") ? "TEST" : "LIVE"} key.`);

  const args = process.argv.slice(2);
  if (args[0] === "--list") {
    console.log(JSON.stringify(await call(key, "GET"), null, 2));
    return;
  }
  if (args[0] === "--delete") {
    if (!args[1]) throw new Error("Usage: --delete <webhook id>");
    await call(key, "DELETE", `/${encodeURIComponent(args[1])}`);
    console.log(`Deleted webhook ${args[1]}`);
    return;
  }

  if (!site || !site.startsWith("https://")) {
    throw new Error("SITE_URL must be the public https:// address of the shop");
  }
  const url = `${site.replace(/\/$/, "")}/api/payments/yoco/webhook`;
  const data = (await call(key, "POST", "", { name: "kunta-nia-payments", url })) as {
    id?: string;
    secret?: string;
  };
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
