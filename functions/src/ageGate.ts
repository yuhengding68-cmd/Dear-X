/** Age gate uses the calendar date in Australia/Sydney, not the device's local zone. */

export const AGE_GATE_TIMEZONE = 'Australia/Sydney';

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function calendarDate(now: Date, timeZone = AGE_GATE_TIMEZONE): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick('year'), month: pick('month'), day: pick('day') };
}

export function parseDob(dob: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function ageOn(dob: string, now = new Date()): number | null {
  const birth = parseDob(dob);
  if (!birth) return null;
  const today = calendarDate(now);
  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) {
    age -= 1;
  }
  return age;
}

/** Hard gate: missing, impossible, or under-18 dates are not adults. */
export function isAtLeast18(dob: string, now = new Date()): boolean {
  const age = ageOn(dob, now);
  return age !== null && age >= 18;
}

export async function denialKey(identifier: string): Promise<string> {
  const data = new TextEncoder().encode(`dearx-age-v1|${identifier.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
