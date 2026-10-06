import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

const render = (src: string) => renderToStaticMarkup(<Markdown source={src} />);

describe("Markdown", () => {
  it("renders headings, lists, bold and safe links", () => {
    const html = render(
      "# Title\n\n## Section\n\nHello **world** [site](https://example.com).\n\n- one\n- two",
    );
    expect(html).not.toContain("Title");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<li>one</li>");
  });

  it("does not turn unsafe links into anchors and escapes HTML", () => {
    const html = render("[x](javascript:alert(1)) <script>alert(1)</script>");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("<script>");
  });
});
