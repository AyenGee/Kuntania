import { site } from "@content/site";
import { escapeHtml } from "./escape";

/**
 * Email chrome. Email clients need inline styles, so these hex values mirror the design
 * tokens in src/styles/tokens.css (maroon brand, cream surface). Restyle here for emails.
 */
export const EMAIL_COLORS = {
  brand: "#592c29",
  brandContrast: "#fff9f1",
  surface: "#fff9f1",
  ink: "#2e1a18",
  muted: "#6b4a45",
  line: "#e3d0c6",
} as const;

export function layout(bodyHtml: string): string {
  const c = EMAIL_COLORS;
  return `<!doctype html><html lang="en-ZA"><body style="margin:0;background:${c.surface};font-family:Arial,Helvetica,sans-serif;color:${c.ink};line-height:1.5">
<div style="max-width:600px;margin:0 auto">
<div style="background:${c.brand};color:${c.brandContrast};padding:16px 24px;font-size:20px;font-weight:bold">${escapeHtml(site.name)}</div>
<div style="padding:24px">
${bodyHtml}
</div>
</div></body></html>`;
}

export function heading(text: string): string {
  return `<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(text)}</h1>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px">${escapeHtml(text)}</p>`;
}

export function mutedParagraph(text: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;color:${EMAIL_COLORS.muted}">${escapeHtml(text)}</p>`;
}

export function bulletList(items: readonly string[]): string {
  return `<ul style="margin:0 0 12px;padding-left:20px">${items
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("")}</ul>`;
}

export function table(
  rows: [string, string][],
  opts: { boldLast?: boolean } = {},
): string {
  const c = EMAIL_COLORS;
  const body = rows
    .map(([label, value], i) => {
      const bold = opts.boldLast && i === rows.length - 1 ? "font-weight:bold;" : "";
      return `<tr><td style="padding:6px 0;border-bottom:1px solid ${c.line};${bold}">${escapeHtml(label)}</td><td style="padding:6px 0;border-bottom:1px solid ${c.line};text-align:right;${bold}">${escapeHtml(value)}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border-collapse:collapse">${body}</table>`;
}
