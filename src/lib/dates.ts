import type { Lang } from '@/lib/site';

/** Career dates are stored as `YYYY-MM` (month precision is all a CV needs). */
export const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

const LOCALE: Record<Lang, string> = { en: 'en-US', uk: 'uk-UA' };

export function parseYearMonth(value: string): Date {
  const m = YEAR_MONTH.exec(value);
  if (!m) throw new Error(`Expected YYYY-MM, got '${value}'.`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

/** "March 2018" / "Березень 2018" (nominative month, capitalised). */
export function formatYearMonth(lang: Lang, value: string): string {
  const date = parseYearMonth(value);
  const month = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', timeZone: 'UTC' }).format(date);
  return `${month.charAt(0).toLocaleUpperCase(LOCALE[lang])}${month.slice(1)} ${date.getUTCFullYear()}`;
}

/** "March 2018 - August 2022", or "August 2023 - Present" when there is no end. */
export function formatPeriod(lang: Lang, start: string, end: string | undefined, presentLabel: string): string {
  return `${formatYearMonth(lang, start)} - ${end ? formatYearMonth(lang, end) : presentLabel}`;
}

/** Whole years between `start` (YYYY-MM) and `now`. */
export function fullYearsSince(start: string, now = new Date()): number {
  const from = parseYearMonth(start);
  const months = (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + (now.getUTCMonth() - from.getUTCMonth());
  return Math.max(0, Math.floor(months / 12));
}
