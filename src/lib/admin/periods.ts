/**
 * Day/week/month boundaries in South African Standard Time (UTC+2, no daylight saving),
 * returned as UTC instants. The owner thinks in SA days, not UTC days.
 */
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start (00:00 SAST) of the SA calendar day containing `instant`, as a UTC Date. */
export function startOfSastDay(instant: Date): Date {
  const s = new Date(instant.getTime() + SAST_OFFSET_MS);
  return new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - SAST_OFFSET_MS,
  );
}

/** Start of the SA week (Monday 00:00 SAST). */
export function startOfSastWeek(instant: Date): Date {
  const dayStart = startOfSastDay(instant);
  const s = new Date(dayStart.getTime() + SAST_OFFSET_MS);
  const daysSinceMonday = (s.getUTCDay() + 6) % 7;
  return new Date(dayStart.getTime() - daysSinceMonday * DAY_MS);
}

export function startOfSastMonth(instant: Date): Date {
  const s = new Date(instant.getTime() + SAST_OFFSET_MS);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1) - SAST_OFFSET_MS);
}

/**
 * Parse an inclusive "YYYY-MM-DD" date range (SA dates) into [start, endExclusive) UTC instants.
 * Returns null if either date is invalid, the range is backwards, or it is longer than ~2 years.
 */
export function parseSastDateRange(
  from: string,
  to: string,
): { start: Date; endExclusive: Date } | null {
  const re = /^(\d{4})-(\d{2})-(\d{2})$/;
  const f = re.exec(from);
  const t = re.exec(to);
  if (!f || !t) return null;

  const isRealDate = (m: RegExpExecArray) => {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  };
  if (!isRealDate(f) || !isRealDate(t)) return null;

  const start = new Date(Date.UTC(+f[1], +f[2] - 1, +f[3]) - SAST_OFFSET_MS);
  const endExclusive = new Date(
    Date.UTC(+t[1], +t[2] - 1, +t[3]) + DAY_MS - SAST_OFFSET_MS,
  );
  if (start >= endExclusive) return null;
  if (endExclusive.getTime() - start.getTime() > 731 * DAY_MS) return null;
  return { start, endExclusive };
}
