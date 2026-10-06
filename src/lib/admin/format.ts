const TZ = "Africa/Johannesburg";

const dateTime = new Intl.DateTimeFormat("en-ZA", {
  timeZone: TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("en-ZA", {
  timeZone: TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** "6 Oct 2026, 14:30" in SA time. */
export function formatDateTime(d: Date | null | undefined): string {
  return d ? dateTime.format(d) : "—";
}

export function formatDate(d: Date | null | undefined): string {
  return d ? dateOnly.format(d) : "—";
}

/** "YYYY-MM-DD" in SA time (for date inputs and CSV rows). */
export function isoDateSast(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts;
}
