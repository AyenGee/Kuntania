import { describe, expect, it, vi } from "vitest";
import { verifyItn, type ItnConfig, type ItnDeps } from "./itn";
import { expectedItnSignature, type Pair } from "./payfast";

const PASSPHRASE = "my pass phrase!";
const cfg: ItnConfig = { mode: "live", merchantId: "10000100", passphrase: PASSPHRASE };
const PAYFAST_IP = "197.97.145.144";

function signed(overrides: Record<string, string> = {}): Pair[] {
  const base: Record<string, string> = {
    m_payment_id: "KN-10001",
    pf_payment_id: "1089250",
    payment_status: "COMPLETE",
    item_name: "Kunta Nia order KN-10001",
    amount_gross: "350.00",
    amount_fee: "-8.05",
    amount_net: "341.95",
    name_first: "Thandi",
    merchant_id: "10000100",
    ...overrides,
  };
  const pairs = Object.entries(base) as Pair[];
  return [...pairs, ["signature", expectedItnSignature(pairs, PASSPHRASE)]];
}

function deps(over: Partial<ItnDeps> = {}): ItnDeps {
  return {
    resolveValidIps: vi.fn(async () => [PAYFAST_IP]),
    getExpectedAmountCents: vi.fn(async () => 35000),
    confirmWithPayfast: vi.fn(async () => true),
    ...over,
  };
}

describe("verifyItn", () => {
  it("accepts a fully valid notification", async () => {
    const r = await verifyItn(signed(), PAYFAST_IP, cfg, deps());
    expect(r).toMatchObject({ ok: true, amountCents: 35000 });
  });

  it("rejects a bad signature before doing any network work", async () => {
    const d = deps();
    const pairs = signed().map(
      ([k, v]) => (k === "signature" ? [k, "0".repeat(32)] : [k, v]) as Pair,
    );
    expect(await verifyItn(pairs, PAYFAST_IP, cfg, d)).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
    expect(d.resolveValidIps).not.toHaveBeenCalled();
    expect(d.confirmWithPayfast).not.toHaveBeenCalled();
  });

  it("rejects a tampered field (signature no longer matches)", async () => {
    const pairs = signed().map(
      ([k, v]) => (k === "amount_gross" ? [k, "1.00"] : [k, v]) as Pair,
    );
    expect(await verifyItn(pairs, PAYFAST_IP, cfg, deps())).toMatchObject({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects a notification missing its signature", async () => {
    const pairs = signed().filter(([k]) => k !== "signature");
    expect(await verifyItn(pairs, PAYFAST_IP, cfg, deps())).toMatchObject({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects requests from a non-PayFast IP in live mode", async () => {
    expect(await verifyItn(signed(), "6.6.6.6", cfg, deps())).toEqual({
      ok: false,
      reason: "invalid_source_ip",
    });
  });

  it("does not enforce the source IP in sandbox mode", async () => {
    const d = deps();
    const r = await verifyItn(signed(), "6.6.6.6", { ...cfg, mode: "sandbox" }, d);
    expect(r.ok).toBe(true);
    expect(d.resolveValidIps).not.toHaveBeenCalled();
  });

  it("rejects an amount that differs by even one cent", async () => {
    for (const expected of [35001, 34999]) {
      const r = await verifyItn(
        signed(),
        PAYFAST_IP,
        cfg,
        deps({ getExpectedAmountCents: async () => expected }),
      );
      expect(r).toEqual({ ok: false, reason: "amount_mismatch" });
    }
  });

  it("rejects an unreadable amount", async () => {
    const r = await verifyItn(signed({ amount_gross: "abc" }), PAYFAST_IP, cfg, deps());
    expect(r).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("rejects an unknown order", async () => {
    const r = await verifyItn(
      signed(),
      PAYFAST_IP,
      cfg,
      deps({ getExpectedAmountCents: async () => null }),
    );
    expect(r).toEqual({ ok: false, reason: "unknown_order" });
  });

  it("rejects a different merchant id", async () => {
    const r = await verifyItn(
      signed({ merchant_id: "99999999" }),
      PAYFAST_IP,
      cfg,
      deps(),
    );
    expect(r).toEqual({ ok: false, reason: "merchant_mismatch" });
  });

  it("rejects when PayFast's server does not confirm", async () => {
    const r = await verifyItn(
      signed(),
      PAYFAST_IP,
      cfg,
      deps({ confirmWithPayfast: async () => false }),
    );
    expect(r).toEqual({ ok: false, reason: "server_validation_failed" });
  });

  it("sends PayFast the data without signature or passphrase", async () => {
    const d = deps();
    await verifyItn(signed(), PAYFAST_IP, cfg, d);
    const body = (d.confirmWithPayfast as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(body).toContain("m_payment_id=KN-10001");
    expect(body).not.toMatch(/signature|passphrase/);
  });
});
