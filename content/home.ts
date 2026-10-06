/**
 * Home and shop page copy. Edit here, not in the components.
 * Every TODO(CLIENT) is tracked in docs/CLIENT_TODO.md. Wording is deliberately modest
 * (cosmetic claims need substantiation); the client approves it before launch.
 */

export const home = {
  hero: {
    // The tagline comes from the client's brochure: "Growth with purpose".
    heading: "Growth with purpose",
    // TODO(CLIENT): approve wording
    body: "Botanical hair care for natural hair: a Pre-wash Conditioning Mask and a Hair Growth Oil.",
    cta: { label: "Shop the range", href: "/shop" },
  },

  products: {
    heading: "Shop the range",
    link: { label: "View all", href: "/shop" },
  },

  story: {
    heading: "Made for natural hair",
    // From the client's brochure, softened. TODO(CLIENT): approve wording
    body: [
      "Kunta Nia was born out of a passion for authentic natural hair care.",
      "Understanding the unique needs of textured hair, from moisture retention to length preservation, we set out to create thoughtfully formulated products you can build a wash day around.",
    ],
    cta: { label: "Our story", href: "/about" },
  },

  /** Short reasons to choose the brand. Facts only: all from the brochure and product labels. */
  highlights: {
    heading: "Why Kunta Nia",
    items: [
      {
        title: "Botanical ingredients",
        body: "Rosemary and vitamin E in our Hair Growth Oil. Hibiscus and fenugreek in our Pre-wash Conditioning Mask.", // TODO(CLIENT): confirm
      },
      {
        title: "Made for textured hair",
        body: "Created around the needs of natural hair, from moisture retention to length preservation.", // TODO(CLIENT): confirm
      },
      {
        title: "Simple routine",
        body: "Two products that fit into your wash day: one before you wash, one for your scalp.", // TODO(CLIENT): confirm
      },
    ],
  },

  /** Directions from the client's brochure. TODO(CLIENT): confirm. Full details are on each product page. */
  howToUse: {
    heading: "How to use",
    cards: [
      {
        title: "Pre-wash Conditioning Mask",
        steps: [
          "Rinse your hair and apply the mask, distributing evenly from root to tips.",
          "Leave in for 20 minutes, then rinse out thoroughly.",
          "Shampoo and condition as usual to complete your wash day.",
          "Use every 2 to 3 weeks.",
        ],
        image: "maskPhoto", // key in the image map used by the HowToUse component
        href: "/products/pre-wash-conditioning-mask",
      },
      {
        title: "Hair Growth Oil",
        steps: [
          "Apply a few drops directly to the scalp using the dropper.",
          "Gently massage with your fingertips for 3 to 5 minutes.",
        ],
        image: "scalpMood",
        href: "/products/hair-growth-oil",
      },
    ],
  },

  /** "Why shop with us" strip (the reference site has a similar one). Facts about how this shop works. */
  whyShop: [
    {
      title: "Delivery across South Africa",
      body: "Tracked courier delivery to your door.", // TODO(CLIENT): confirm coverage and times
      icon: "truck",
    },
    {
      title: "Secure payment",
      body: "Pay safely online through PayFast.",
      icon: "lock",
    },
    {
      title: "Track your order",
      body: "Look up your order any time with your order number.",
      icon: "box",
    },
    {
      title: "We're here to help",
      body: "Questions about your order or your hair? Send us a message.",
      icon: "chat",
    },
  ],

  newsletter: {
    heading: "Stay in touch",
    body: "Hair care tips and news from Kunta Nia. No spam, unsubscribe any time.",
  },
} as const;

export const shopPage = {
  heading: "Shop",
  // TODO(CLIENT): approve wording
  intro: "Two products, made for natural hair. Choose yours below.",
} as const;
