import { site } from "@content/site";
import { escapeHtml } from "./escape";
import { layout } from "./layout";
import type { MailInput } from "./send";

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
