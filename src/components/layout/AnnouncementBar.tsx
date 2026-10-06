import { announcement } from "@content/site";

/** Thin strip above the header (set `announcement` in content/site.ts; null hides it). */
export function AnnouncementBar() {
  if (!announcement) return null;
  return (
    <div className="bg-accent px-4 py-2 text-center text-sm font-medium text-brand-contrast">
      <p>{announcement}</p>
    </div>
  );
}
