/**
 * Minimal CSV writer. Text cells that start with = + - @ (or tab/CR) are prefixed with an
 * apostrophe so spreadsheets never execute customer-supplied text as a formula
 * (CSV/formula injection). Rows end with CRLF; a UTF-8 BOM is added so Excel reads accents.
 */
type Cell = string | number | boolean | null | undefined;

export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
