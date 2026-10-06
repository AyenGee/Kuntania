import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";
import { ALLOWED_TRANSITIONS, canTransition } from "./order-transitions";
import {
  parseSastDateRange,
  startOfSastDay,
  startOfSastMonth,
  startOfSastWeek,
} from "./periods";
import { centsToRandsInput, parseRandsToCents } from "./rands";

describe("order transitions", () => {
  it("allows the normal fulfilment path", () => {
    expect(canTransition("PAID", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("PAID", "SHIPPED")).toBe(true);
  });
  it("never lets the admin mark an order paid", () => {
    for (const from of Object.keys(
      ALLOWED_TRANSITIONS,
    ) as (keyof typeof ALLOWED_TRANSITIONS)[]) {
      expect(canTransition(from, "PAID")).toBe(false);
    }
  });
  it("only lets unpaid orders be cancelled (not refunded or shipped)", () => {
    expect(canTransition("PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "SHIPPED")).toBe(false);
    expect(canTransition("PENDING_PAYMENT", "REFUNDED")).toBe(false);
  });
  it("treats cancelled and refunded as final and blocks going backwards", () => {
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.REFUNDED).toEqual([]);
    expect(canTransition("SHIPPED", "PROCESSING")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });
});

describe("SA time periods", () => {
  it("starts the SA day at 22:00 UTC the previous evening", () => {
    // 01:30 SAST on 17 June is still 23:30 UTC on 16 June
    expect(startOfSastDay(new Date("2026-06-16T23:30:00Z")).toISOString()).toBe(
      "2026-06-16T22:00:00.000Z",
    );
    expect(startOfSastDay(new Date("2026-06-16T21:59:00Z")).toISOString()).toBe(
      "2026-06-15T22:00:00.000Z",
    );
  });
  it("starts the week on Monday and the month on the 1st (SAST)", () => {
    const wed = new Date("2026-06-17T10:00:00Z"); // Wednesday 17 June 2026
    expect(startOfSastWeek(wed).toISOString()).toBe("2026-06-14T22:00:00.000Z"); // Mon 15 June
    expect(startOfSastMonth(wed).toISOString()).toBe("2026-05-31T22:00:00.000Z"); // 1 June
    // Sunday still belongs to the week that began the previous Monday
    expect(startOfSastWeek(new Date("2026-06-21T10:00:00Z")).toISOString()).toBe(
      "2026-06-14T22:00:00.000Z",
    );
  });
});

describe("parseSastDateRange", () => {
  it("makes an inclusive range into [start, endExclusive)", () => {
    const r = parseSastDateRange("2026-06-01", "2026-06-30")!;
    expect(r.start.toISOString()).toBe("2026-05-31T22:00:00.000Z");
    expect(r.endExclusive.toISOString()).toBe("2026-06-30T22:00:00.000Z");
  });
  it("accepts a single day", () => {
    expect(parseSastDateRange("2026-06-01", "2026-06-01")).not.toBeNull();
  });
  it.each([
    ["2026-06-30", "2026-06-01"],
    ["2026-02-31", "2026-03-05"],
    ["june", "2026-06-30"],
    ["2020-01-01", "2026-06-30"],
  ])("rejects %s to %s", (from, to) => {
    expect(parseSastDateRange(from, to)).toBeNull();
  });
});

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(12345)).toBe("12345");
  });
  it("neutralises spreadsheet formulas in text but leaves numbers alone", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+27821234567")).toBe("'+27821234567");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell(-5)).toBe("-5");
  });
  it("writes a BOM, header and CRLF rows", () => {
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("﻿a,b\r\n1,x\r\n");
  });
});

describe("rands input", () => {
  it.each([
    ["149", 14900],
    ["149.9", 14990],
    ["R 1 249,50", 124950],
    ["0.05", 5],
  ])("parses %s", (input, cents) => expect(parseRandsToCents(input)).toBe(cents));
  it.each(["", "abc", "-5", "1.234", "1e3", "12,345.67"])("rejects %j", (input) =>
    expect(parseRandsToCents(input)).toBeNull(),
  );
  it("formats cents for form fields", () => {
    expect(centsToRandsInput(14990)).toBe("149.90");
    expect(centsToRandsInput(5)).toBe("0.05");
  });
});
