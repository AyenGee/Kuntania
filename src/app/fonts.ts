import { Inter, Gloock } from "next/font/google";

// Gloock approximates the heavy display serif in the client's brochure; Inter is a neutral body face.
// TODO(CLIENT): confirm the brochure fonts.
// Placeholder fonts. A designer can swap these two exports; tokens.css picks them up.
export const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const headingFont = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading-loaded",
  display: "swap",
});
