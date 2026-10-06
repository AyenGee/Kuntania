import { Inter, Fraunces } from "next/font/google";

// Placeholder fonts. A designer can swap these two exports; tokens.css picks them up.
export const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading-loaded",
  display: "swap",
});
