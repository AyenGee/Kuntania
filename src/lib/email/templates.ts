import { site } from "@content/site";
import { escapeHtml, type MailInput } from "./send";

/** Minimal branded-later wrapper. Styling is intentionally plain. */
function layout(bodyHtml: string): string {
  return `<!doctype html><html lang="en-ZA"><body style="font-family:Arial,Helvetica,sans-serif;color:#1c1917;line-height:1.5;max-width:560px;margin:0 auto;padding:16px">
<h1 style="font-size:20px">${escapeHtml(site.name)}</h1>
${bodyHtml}
</body></html>`;
}

export function contactOwnerEmail(
  ownerEmail: string,
  m: { name: string; email: string; phone?: string; subject: string; message: string },
): MailInput {
  const phone = m.phone ? `\nPhone: ${m.phone}` : "";
  return {
    to: ownerEmail,
    replyTo: m.email,
    subject: `New contact message: ${m.subject}`,
    text: `From: ${m.name} <${m.email}>${phone}\nSubject: ${m.subject}\n\n${m.message}`,
    html: layout(
      `<p><strong>From:</strong> ${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;${
        m.phone ? `<br><strong>Phone:</strong> ${escapeHtml(m.phone)}` : ""
      }</p><p><strong>Subject:</strong> ${escapeHtml(m.subject)}</p><p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`,
    ),
  };
}

export function contactAckEmail(to: string, name: string): MailInput {
  const text = `Hi ${name},\n\nThanks for getting in touch. We've received your message and will get back to you as soon as we can.\n\n${site.name}`;
  return {
    to,
    subject: `We've received your message — ${site.name}`,
    text,
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p><p>Thanks for getting in touch. We've received your message and will get back to you as soon as we can.</p><p>${escapeHtml(site.name)}</p>`,
    ),
  };
}

export function newsletterWelcomeEmail(to: string, unsubscribeUrl: string): MailInput {
  const text = `Welcome to ${site.name}!\n\nYou're now subscribed to our newsletter. You can unsubscribe at any time: ${unsubscribeUrl}`;
  return {
    to,
    subject: `Welcome to ${site.name}`,
    text,
    html: layout(
      `<p>Welcome to ${escapeHtml(site.name)}!</p><p>You're now subscribed to our newsletter.</p><p style="font-size:12px"><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a> at any time.</p>`,
    ),
  };
}
