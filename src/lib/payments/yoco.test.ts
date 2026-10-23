import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkSucceededPayment,
  createYocoProvider,
  parseYocoEvent,
  verifyWebhookSignature,
  yocoModeOf,
} from "./yoco";

const SECRET_BYTES = Buffer.from("unit-test-signing-key-0123456789");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW = 1_800_000_000;

function sign(id: string, timestamp: string, body: string): string {
  return createHmac("sha256", SECRET_BYTES)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
}

const BODY = JSON.stringify({
  id: "evt_1",
  type: "payment.succeeded",
  payload: {
    id: "p_123",
    amount: 11000,
    currency: "ZAR",
    status: "succeeded",
    mode: "test",
    metadata: { checkoutId: "ch_abc", orderNumber: "KN-10001" },
  },
});

function verify(overrides: Partial<Parameters<typeof verifyWebhookSignature>[0]> = {}) {
  return verifyWebhookSignature({
    id: "msg_1",
    timestamp: String(NOW),
    signatureHeader: `v1,${sign("msg_1", String(NOW), BODY)}`,
    body: BODY,
    secret: SECRET,
    now: NOW,
    ...overrides,
  });
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed, fresh webhook", () => {
    expect(verify()).toBe(true);
  });

  it("accepts when one of several listed signatures matches", () => {
    const good = sign("msg_1", String(NOW), BODY);
    expect(verify({ signatureHeader: `v1,AAAA v1,${good}` })).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verify({ body: BODY.replace("11000", "100") })).toBe(false);
  });

  it("rejects a signature made with another secret", () => {
    const other = createHmac("sha256", Buffer.from("another-key"))
      .update(`msg_1.${NOW}.${BODY}`)
      .digest("base64");
    expect(verify({ signatureHeader: `v1,${other}` })).toBe(false);
  });

  it("rejects missing headers and non-v1 signatures", () => {
    expect(verify({ id: null })).toBe(false);
    expect(verify({ timestamp: null })).toBe(false);
    expect(verify({ signatureHeader: null })).toBe(false);
    expect(verify({ signatureHeader: `v2,${sign("msg_1", String(NOW), BODY)}` })).toBe(
      false,
    );
  });

  it("rejects old and future timestamps (replay protection)", () => {
    const stale = String(NOW - 600);
    expect(
      verify({
        timestamp: stale,
        signatureHeader: `v1,${sign("msg_1", stale, BODY)}`,
      }),
    ).toBe(false);
    const future = String(NOW + 600);
    expect(
      verify({
        timestamp: future,
        signatureHeader: `v1,${sign("msg_1", future, BODY)}`,
      }),
    ).toBe(false);
  });

  it("rejects a non-numeric timestamp", () => {
    expect(verify({ timestamp: "abc" })).toBe(false);
  });
});

describe("parseYocoEvent", () => {
  it("parses a payment event", () => {
    const e = parseYocoEvent(BODY);
    expect(e?.type).toBe("payment.succeeded");
    expect(e?.payload.amount).toBe(11000);
    expect(e?.payload.metadata.checkoutId).toBe("ch_abc");
  });

  it("returns null for junk", () => {
    expect(parseYocoEvent("not json")).toBeNull();
    expect(parseYocoEvent("{}")).toBeNull();
    expect(
      parseYocoEvent(JSON.stringify({ type: "x", payload: { id: "1" } })),
    ).toBeNull();
  });
});

describe("checkSucceededPayment", () => {
  const event = parseYocoEvent(BODY)!;
  const withPayload = (p: Record<string, unknown>) => ({
    ...event,
    payload: { ...event.payload, ...p },
  });

  it("accepts a matching payment", () => {
    expect(checkSucceededPayment(event, { totalCents: 11000 }, "test")).toEqual({
      ok: true,
    });
  });

  it("rejects a different amount", () => {
    expect(checkSucceededPayment(event, { totalCents: 15000 }, "test")).toEqual({
      ok: false,
      reason: "amount_mismatch",
    });
  });

  it("rejects the wrong currency and a non-succeeded status", () => {
    expect(
      checkSucceededPayment(
        withPayload({ currency: "USD" }),
        { totalCents: 11000 },
        "test",
      ),
    ).toEqual({ ok: false, reason: "wrong_currency" });
    expect(
      checkSucceededPayment(
        withPayload({ status: "pending" }),
        { totalCents: 11000 },
        "test",
      ),
    ).toEqual({ ok: false, reason: "status_not_succeeded" });
  });

  it("rejects a test payment when running with live keys, and vice versa", () => {
    expect(checkSucceededPayment(event, { totalCents: 11000 }, "live")).toEqual({
      ok: false,
      reason: "mode_mismatch",
    });
    expect(
      checkSucceededPayment(withPayload({ mode: "live" }), { totalCents: 11000 }, "test"),
    ).toEqual({ ok: false, reason: "mode_mismatch" });
  });
});

describe("yocoModeOf", () => {
  it("reads the mode from the key prefix", () => {
    expect(yocoModeOf("sk_test_abc")).toBe("test");
    expect(yocoModeOf("sk_live_abc")).toBe("live");
  });
});

describe("createYocoProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  const order = {
    orderNumber: "KN-10001",
    totalCents: 11000,
    email: "a@example.test",
    firstName: "A",
    lastName: "B",
  };

  it("creates a ZAR checkout for the exact total and returns the redirect", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: "ch_abc", redirectUrl: "https://c.yoco.com/checkout/ch_abc" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = createYocoProvider({
      secretKey: "sk_test_x",
      siteUrl: "https://shop.example.test",
    });
    const result = await provider.createPayment(order);
    expect(result).toEqual({
      url: "https://c.yoco.com/checkout/ch_abc",
      checkoutId: "ch_abc",
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://payments.yoco.com/api/checkouts");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk_test_x");
    expect(headers["Idempotency-Key"]).toBe("kunta-nia-KN-10001");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      amount: 11000,
      currency: "ZAR",
      successUrl: "https://shop.example.test/checkout/success?order=KN-10001",
      cancelUrl: "https://shop.example.test/checkout/cancelled?order=KN-10001",
      metadata: { orderNumber: "KN-10001" },
    });
  });

  it("throws, without leaking the key, when Yoco refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 401 })),
    );
    const provider = createYocoProvider({
      secretKey: "sk_test_secret",
      siteUrl: "https://shop.example.test",
    });
    await expect(provider.createPayment(order)).rejects.toThrow("HTTP 401");
    await expect(provider.createPayment(order)).rejects.not.toThrow(/sk_test_secret/);
  });

  it("rejects a response without a usable redirect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ id: "ch_abc", redirectUrl: "not a url" })),
    );
    const provider = createYocoProvider({
      secretKey: "sk_test_x",
      siteUrl: "https://shop.example.test",
    });
    await expect(provider.createPayment(order)).rejects.toThrow();
  });
});
