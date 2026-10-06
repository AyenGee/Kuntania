/**
 * Home page copy. Sections with empty arrays are hidden until the client supplies copy.
 * Featured products come from the database (Phase 3).
 */

export const home = {
  hero: {
    /** TODO(CLIENT): hero headline */
    heading: "Natural hair care, made with intention",
    /** TODO(CLIENT): hero supporting text */
    body: "TODO(CLIENT): hero supporting text. Nourishing care for your hair journey.",
    cta: { label: "Shop now", href: "/shop" },
  },
  /** TODO(CLIENT): trust badges. Do not claim certifications the client does not hold. */
  trustBadges: [] as { title: string; body: string }[],
  featured: { heading: "Our products" },
  routine: {
    heading: "Use them together",
    /** TODO(CLIENT): confirm routine steps (refine once real directions are approved) */
    steps: [] as { title: string; body: string }[],
  },
  newsletter: {
    heading: "Stay in touch",
    body: "Hair care tips and news from Kunta Nia. No spam, unsubscribe any time.",
  },
};
