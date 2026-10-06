import { describe, expect, it } from "vitest";
import {
  buildPayfastRedirect,
  expectedItnSignature,
  isValidSourceIp,
  parseAmountToCents,
  phpUrlencode,
  signPayment,
  signaturesMatch,
  validationBody,
  type Pair,
} from "./payfast";

// Expected MD5s below were computed independently (Python, PHP-compatible urlencode)
// from the exact parameter strings shown in the comments.
const PASSPHRASE = "my pass phrase!";

const paymentPairs: Pair[] = [
  ["merchant_id", "10000100"],
  ["merchant_key", "46f0cd694581a"],
  ["return_url", "https://shop.example.co.za/checkout/success?order=KN-10001"],
  ["cancel_url", "https://shop.example.co.za/checkout/cancelled?order=KN-10001"],
  ["notify_url", "https://shop.example.co.za/api/payments/payfast/notify"],
  ["name_first", "Thandi"],
  ["name_last", "Nkosi-O'Brien"],
  ["email_address", "thandi+test@example.com"],
  ["m_payment_id", "KN-10001"],
  ["amount", "350.00"],
  ["item_name", "Kunta Nia order KN-10001"],
];

const itnPairs: Pair[] = [
  ["m_payment_id", "KN-10001"],
  ["pf_payment_id", "1089250"],
  ["payment_status", "COMPLETE"],
  ["item_name", "Kunta Nia order KN-10001"],
  ["item_description", ""],
  ["amount_gross", "350.00"],
  ["amount_fee", "-8.05"],
  ["amount_net", "341.95"],
  ["custom_str1", ""],
  ["name_first", "Thandi"],
  ["name_last", "Nkosi-O'Brien"],
  ["email_address", "thandi+test@example.com"],
  ["merchant_id", "10000100"],
];

describe("phpUrlencode", () => {
  it("matches PHP urlencode()", () => {
    expect(phpUrlencode("a b!'()*~-_.@&=/é")).toBe(
      "a+b%21%27%28%29%2A%7E-_.%40%26%3D%2F%C3%A9",
    );
  });
});

describe("signPayment", () => {
  it("signs a payment request with a passphrase", () => {
    expect(signPayment(paymentPairs, PASSPHRASE)).toBe(
      "8bf1317b5d687ed987122cef952ad240",
    );
  });
  it("signs without a passphrase", () => {
    expect(signPayment(paymentPairs)).toBe("7c1cc369b8edd227e6dbd27e77f6e098");
  });
  it("leaves blank values out of the signature", () => {
    expect(signPayment([...paymentPairs, ["custom_str1", ""]], PASSPHRASE)).toBe(
      "8bf1317b5d687ed987122cef952ad240",
    );
  });
  it("depends on field order", () => {
    const swapped = [paymentPairs[1], paymentPairs[0], ...paymentPairs.slice(2)];
    expect(signPayment(swapped, PASSPHRASE)).not.toBe(
      signPayment(paymentPairs, PASSPHRASE),
    );
  });
});

describe("expectedItnSignature", () => {
  it("includes blank values, ignores the signature field, appends the passphrase", () => {
    expect(expectedItnSignature(itnPairs, PASSPHRASE)).toBe(
      "16f3581772ac27560bff052d95ce3bd1",
    );
    expect(
      expectedItnSignature([...itnPairs, ["signature", "whatever"]], PASSPHRASE),
    ).toBe("16f3581772ac27560bff052d95ce3bd1");
    expect(expectedItnSignature(itnPairs)).toBe("861f8b7677e1b6f80ba8158ce15f70b4");
  });
  it("changes if any value is tampered with", () => {
    const tampered = itnPairs.map(
      ([k, v]) => [k, k === "amount_gross" ? "1.00" : v] as Pair,
    );
    expect(expectedItnSignature(tampered, PASSPHRASE)).not.toBe(
      "16f3581772ac27560bff052d95ce3bd1",
    );
  });
});

describe("signaturesMatch", () => {
  it("compares case-insensitively and rejects missing/short values", () => {
    expect(signaturesMatch("ABC123", "abc123")).toBe(true);
    expect(signaturesMatch("abc12", "abc123")).toBe(false);
    expect(signaturesMatch(undefined, "abc123")).toBe(false);
    expect(signaturesMatch("", "abc123")).toBe(false);
  });
});

describe("parseAmountToCents", () => {
  it.each([
    ["350.00", 35000],
    ["0.05", 5],
    ["12.5", 1250],
    ["12", 1200],
    ["1234567.89", 123456789],
  ])("parses %s", (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });
  it.each(["", "abc", "-5.00", "1.234", "1e3", "1,50", " "])("rejects %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });
});

describe("validationBody / isValidSourceIp", () => {
  it("excludes the signature and passphrase", () => {
    const body = validationBody([...itnPairs, ["signature", "x"]]);
    expect(body).not.toContain("signature");
    expect(body).not.toContain("passphrase");
    expect(body.startsWith("m_payment_id=KN-10001&")).toBe(true);
  });
  it("matches source IPs exactly", () => {
    expect(isValidSourceIp("197.97.145.144", ["197.97.145.144"])).toBe(true);
    expect(isValidSourceIp("1.2.3.4", ["197.97.145.144"])).toBe(false);
    expect(isValidSourceIp("unknown", [])).toBe(false);
  });
});

describe("buildPayfastRedirect", () => {
  const order = {
    orderNumber: "KN-10001",
    totalCents: 35000,
    email: "thandi+test@example.com",
    firstName: "Thandi",
    lastName: "Nkosi-O'Brien",
  };
  const cfg = {
    mode: "sandbox" as const,
    merchantId: "10000100",
    merchantKey: "46f0cd694581a",
    passphrase: PASSPHRASE,
    siteUrl: "https://shop.example.co.za/",
  };

  it("builds a signed POST to the sandbox with the right amount and callbacks", () => {
    const r = buildPayfastRedirect(order, cfg);
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(r.fields.amount).toBe("350.00");
    expect(r.fields.m_payment_id).toBe("KN-10001");
    expect(r.fields.notify_url).toBe(
      "https://shop.example.co.za/api/payments/payfast/notify",
    );
    expect(r.fields.return_url).toBe(
      "https://shop.example.co.za/checkout/success?order=KN-10001",
    );
    expect(r.fields.cancel_url).toBe(
      "https://shop.example.co.za/checkout/cancelled?order=KN-10001",
    );
    // Same inputs as the independently computed fixture above.
    expect(r.fields.signature).toBe("8bf1317b5d687ed987122cef952ad240");
    expect(Object.keys(r.fields).at(-1)).toBe("signature");
  });

  it("uses the live URL in live mode", () => {
    expect(buildPayfastRedirect(order, { ...cfg, mode: "live" }).url).toBe(
      "https://www.payfast.co.za/eng/process",
    );
  });
});
