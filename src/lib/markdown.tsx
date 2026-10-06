import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Tiny, dependency-free Markdown renderer for our own policy files.
 * Supports: # ## ### headings, paragraphs, "- " lists, **bold**, [text](url).
 * Output is React elements (never raw HTML), so content cannot inject markup.
 */

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function safeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|\/)/.test(href);
}

export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link && safeHref(link[2])) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={i} href={href} className="underline">
          {label}
        </Link>
      ) : (
        <a key={i} href={href} rel="noopener noreferrer" className="underline">
          {label}
        </a>
      );
    }
    return part;
  });
}

export function Markdown({ source }: { source: string }) {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, i) => {
        const heading = /^(#{1,3})\s+(.*)$/.exec(block);
        if (heading) {
          const level = heading[1].length;
          if (level === 1) return null; // page <h1> comes from the page itself
          const Tag = level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={i}
              className={
                level === 2 ? "mt-8 text-2xl font-semibold" : "mt-6 text-xl font-semibold"
              }
            >
              {renderInline(heading[2])}
            </Tag>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="mt-3 list-disc space-y-1 pl-6">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-3">
            {renderInline(lines.join(" "))}
          </p>
        );
      })}
    </>
  );
}
