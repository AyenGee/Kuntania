# Client TODO — everything we need from Kunta Nia

Every placeholder in the code is marked `TODO(CLIENT)`. This file is the checklist to work
through with the client. Tick items off as they are resolved and the code is updated.

Status: `content/client-copy.md` has **not** been supplied yet. Items marked _(copy)_ are
expected to be answered by it.

## 1. Business and legal details (`content/site.ts`)

- [ ] Registered business name
- [ ] Legal form (Pty Ltd / CC / sole proprietor)
- [ ] Company registration number
- [ ] VAT registered? If yes: VAT number, and set `VAT_REGISTERED=true`
- [ ] Physical (street) address — required by ECT Act s43
- [ ] Customer-facing email and phone number
- [ ] Information Officer name and email (POPIA)
- [ ] Social media URLs (Instagram, Facebook, TikTok)

## 2. Products _(copy)_

- [ ] Confirm product names (see section 10: now using the label names)
- [ ] Prices (ZAR, VAT-inclusive), compare-at prices if any
- [ ] Sizes (e.g. 100 ml), starting stock levels
- [ ] Full INCI ingredient lists for both products
- [ ] Shelf life and period-after-opening
- [ ] Allergen confirmation (mask: hydrolysed wheat protein / gluten, coconut)
- [ ] Real product photos + alt text
- [ ] Oil "How to use" steps: Scalp Care, Pre-Poo, Hot Oil Treatment, Sealing (LOC/LCO) & Protective Styles — **confirm**

## 3. Cosmetic claims — approve wording _(copy)_

Original client wording vs. softer wording used on the site (to be filled in once the
client copy arrives). Each needs `TODO(CLIENT): approve claim wording`.

| Original                                                       | Site wording                                                                                    | Approved |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| "Hair Growth" (product name)                                   | Kept for now — **flagged**                                                                      | [ ]      |
| "Stimulates follicles" / "enhance scalp circulation…"          | "Rosemary and castor oil help nourish the scalp for a healthy-feeling foundation for your hair" | [ ]      |
| "repairs weak strands"                                         | "helps strengthen strands against breakage"                                                     | [ ]      |
| "deeply penetrate" / "deep hydration directly into the cortex" | "deeply conditions and softens"                                                                 | [ ]      |
| "100% Botanical Blend"                                         | "Botanical-Rich Formula"                                                                        | [ ]      |
| "Free From Harsh Synthetics"                                   | "No sulfates, parabens, phthalates or silicones" — check against real ingredient list           | [ ]      |
| "Cruelty-Free"                                                 | Kept — no certification logo unless client is certified                                         | [ ]      |

## 4. Shipping (`content/site.ts`)

- [ ] Flat-rate courier fee
- [ ] Free-shipping threshold (or none)
- [ ] Pick-up point option (PUDO / Pargo) and its rate, or none
- [ ] Local collection option, or none
- [ ] Delivery times and delivery areas (for FAQ and Shipping policy)

## 5. Site copy _(copy)_

- [ ] Hero headline and text, trust badges, "how to use together" routine
- [ ] Our Story, Our Philosophy, Our Commitment
- [ ] FAQ answers reviewed (including pregnancy / children — "consult your doctor")
- [ ] Brand tagline and SEO description
- [ ] Logo, brand colours, fonts (designer to restyle via `src/styles/tokens.css`)

## 6. Policies — must be approved before launch

- [ ] Shipping & Returns (hygiene note on opened cosmetics; damaged/defective process)
- [ ] Terms & Conditions
- [ ] Privacy Policy (POPIA)
- [ ] Set `POLICIES_APPROVED=true` only after approval

## 7. Accounts and credentials (client or developer to provide)

- [ ] PayFast merchant ID, merchant key, passphrase (sandbox first, then live)
- [ ] SMTP / business email sender details; SPF, DKIM, DMARC on the domain
- [ ] Domain name and DNS access
- [ ] Analytics choice (Plausible or Umami) or none
- [ ] Owner admin email address

## 8. Added in Phase 2 (draft content awaiting client review)

- [ ] FAQ (`content/faq.ts`): all 7 draft answers need review. Pregnancy and children answers say "consult your doctor" (marked `sensitive`); confirm wording.
- [ ] Policy drafts in `content/policies/` (`shipping-returns.md`, `terms.md`, `privacy.md`): fill every `TODO(CLIENT)`, then have a legal professional review. A red DRAFT banner shows until `POLICIES_APPROVED=true` in production.
- [ ] Privacy policy: name the courier, email, hosting and analytics providers and where data is stored; confirm retention periods.
- [ ] Newsletter consent wording and welcome email text (`src/lib/email/templates.ts`)
- [ ] Hero headline/body (`content/home.ts`), About copy (`content/about.ts`), page SEO titles/descriptions (`content/pages.ts`)
- [ ] OWNER_EMAIL: where contact messages are sent

## 9. Added in Phase 3 (catalogue)

Seeded values in `content/products.ts` are **placeholders**. Replace them (or edit in /admin after seeding):

- [ ] Real prices (placeholders: R100.00 oil, R150.00 mask), compare-at prices, sizes, stock
- [ ] Full INCI lists, shelf life / period-after-opening
- [ ] Approve all claim wording on the product pages (benefits, descriptions, "Cruelty-Free", "No sulfates, parabens, phthalates or silicones")
- [ ] Confirm the oil's four uses and steps; confirm mask directions and leave-on time
- [ ] Confirm allergen notice (mask: hydrolysed wheat protein / gluten, coconut) and warnings text
- [ ] Real product photos (replace the SVG placeholders in `public/images/products/`) and alt text
- [ ] Product SEO titles/descriptions

## 10. From the client's brochure (applied to the site; confirm each)

Read from the two brochure images supplied in chat. Treat as likely answers to confirm:

- [ ] **Product names on the labels:** "Hair Growth Oil" (Rosemary & Vitamin E, 100ml) and "Pre-wash Conditioning Mask" (Hibiscus & Fenugreek, 100ml). The site now uses these label names (slugs `hair-growth-oil`, `pre-wash-conditioning-mask`). Confirm final names, and that "Hair Growth" is acceptable (claims review).
- [ ] **Sizes:** both 100 ml per the labels.
- [ ] **Key ingredients:** oil: rosemary, vitamin E; mask: hibiscus, fenugreek. Full INCI still required.
- [ ] **Mask directions (brochure):** apply to rinsed hair root to tips, leave 20 minutes, rinse thoroughly, shampoo and condition; use every 2 to 3 weeks.
- [ ] **Oil directions (brochure):** a few drops to the scalp with the dropper, massage 3 to 5 minutes. (The oil's other uses in our draft are still unconfirmed.)
- [ ] **Care and storage (brochure):** store cool, dry, away from direct sunlight; avoid getting water into jars; patch test on inner elbow.
- [ ] **Brand line:** "Growth with purpose". Social: Instagram and TikTok @kunta.nia. Website on brochure is a template placeholder.
- [ ] **Castor oil:** our soft claim says "rosemary and castor oil" (from the build brief) but the label lists rosemary and vitamin E. Confirm whether castor oil is in the formula; otherwise reword.
- [ ] **Brochure claims to review before reuse on the site:** "results-driven", "restorative", "support healthy length retention", "deeply hydrate, strengthen", "clean" (see section 3).
- [ ] **Brand colours and fonts:** palette sampled from the brochure into `src/styles/tokens.css` (maroon #592c29, dusty rose #a27464, cream #fff9f1); confirm against a brand guide. Display font on the brochure is a heavy high-contrast serif; Gloock is an approximation.
- [ ] **Photos:** brochure images are Canva stock models and product shots. Confirm licensing/ownership before using on the website; get original product photos.

## 11. Payments (Phase 5)

- [ ] PayFast merchant account approved (live) with merchant ID, merchant key and a **passphrase** set in the PayFast dashboard (must match `PAYFAST_PASSPHRASE`)
- [ ] In the PayFast dashboard, enable ITN (Instant Transaction Notifications) for the live account
- [ ] Decide who handles refunds in the PayFast dashboard (the admin only records them)
- [ ] Confirm the 48-hour unpaid-order expiry (`content/site.ts`, `store.pendingOrderExpiryHours`)
- [ ] `CRON_SECRET` set in Vercel so the daily cleanup job can run

## 12. Emails (Phase 6)

All wording is in `content/emails.ts`. Review each email before launch:

- [ ] Order confirmation: processing/packing time ("what happens next")
- [ ] Cancelled and refunded emails: refund timing and wording
- [ ] Sender address (`EMAIL_FROM`) and `OWNER_EMAIL` (receives new-order alerts and contact messages)
- [ ] SMTP provider details; SPF, DKIM and DMARC records on the sending domain
- [ ] Email branding (logo, colours): `src/lib/email/layout.ts`

## 13. Admin (Phase 7)

- [ ] Owner's admin email and a strong password (12+ characters). Create with `npm run admin:create -- --email <email> --name "<name>"`
- [ ] Admin sessions last 8 hours, then the owner signs in again. Confirm that's acceptable
- [ ] Owner to review the order actions: cancelling a **paid, unshipped** order puts its stock back; refunds are _records only_ (the actual refund is made in the PayFast dashboard)
- [ ] Product photos are still file-based (`public/images/products`): the owner can't upload photos in v1

## 14. Hardening (Phase 8)

- [ ] A default **social share image** (`public/og.jpg`, about 1200x630) so links shared on WhatsApp, Facebook and X show a preview. Then switch `twitter.card` to `summary_large_image` in `src/app/layout.tsx`
- [ ] A **logo** file (for the Organization structured data and emails)
- [ ] Analytics choice (Plausible or Umami) and its settings (`ANALYTICS_*`); none is loaded until configured

## 15. Launch (Phase 9)

- [ ] **Legal check on returns:** have a legal professional confirm how the ECT Act s44 cooling-off right and the Consumer Protection Act apply to opened cosmetics, and align the Shipping & Returns policy and Terms with it. The current draft (opened products not returnable unless defective) must not go live unchecked
- [ ] Ask the legal adviser whether the Information Officer must be registered with the Information Regulator (POPIA)
- [ ] Decide who owns each account (domain, hosting, database, PayFast, email, analytics): they should be in the client's name
- [ ] Real product photo files delivered to the developer (the owner then selects them in the admin)
- [ ] Work through [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md)

## 16. Photos and logo (design pass, October 2026)

Source: 14 phone images supplied by the client. Prepared for the web by `scripts/prepare-images.py`.

- [ ] **7 of the 14 images look AI-generated** (they carry a small Gemini sparkle mark, now cropped off) and the product label text in them is wrong in places ("Hlbiscus", "Vltamin E", "OlI"). Used only for atmosphere: the oil-on-scalp image (How to use card). The other AI images (satin bottles, mask + oil on brown, diagonal split, brand card, logo on satin) are **not used** yet. Client to confirm she is happy with AI imagery and that the tool's terms allow commercial use
- [ ] Real product photos in use: the range photo (home banner and story band), oil bottles and mask jars (product cards and pages). Ask for **more real photos**: a single oil bottle and a single mask jar on a clean background, and a landscape lifestyle shot, would improve the product pages
- [ ] **Clean logo file** (transparent PNG or SVG). The emblem on the site was extracted from an AI-generated poster; the "KUNTA NIA" wordmark is set in the site's heading font instead, because the poster lettering couldn't be separated from its background
- [ ] Confirm the announcement-bar text ("Delivery anywhere in South Africa") and add the flat shipping fee when decided (`content/site.ts`)
- [ ] Approve the new homepage wording in `content/home.ts` (hero line, story, three "Why Kunta Nia" cards, how-to-use steps)
