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

- [ ] Confirm product names (placeholders: "Hair Growth & Scalp Oil", "Deep Conditioning Mask")
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
