// Date logic for the date picker, kept free of Angular so it can be tested
// and explained on its own.
//
// Dates are 'YYYY-MM-DD' strings, the same as the API sends. Arithmetic
// goes through Date.UTC, which has no clock changes, so adding a day can
// never land on the wrong date in late March or October.

import { UnavailableReason } from '../../api/api.models';

/** 'YYYY-MM' */
export type Month = string;

function toUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Same day in another month, or that month's last day if it is shorter. */
export function addMonths(date: string, months: number): string {
  const d = toUtc(date);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const day = Math.min(d.getUTCDate(), daysInMonth(target.getUTCFullYear(), target.getUTCMonth()));
  target.setUTCDate(day);
  return fromUtc(target);
}

/** ISO strings compare correctly as plain strings. */
export function clampDate(date: string, min: string, max: string): string {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export function monthOf(date: string): Month {
  return date.slice(0, 7);
}

/** 0 for Monday through 6 for Sunday: UK weeks start on Monday. */
function weekdayIndex(date: string): number {
  return (toUtc(date).getUTCDay() + 6) % 7;
}

/** The month as rows of 7 (Monday to Sunday), with null where a row spills into another month. */
export function monthGrid(month: Month): (string | null)[][] {
  const first = `${month}-01`;
  const [year, monthNumber] = month.split('-').map(Number);
  const cells: (string | null)[] = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let day = 0; day < daysInMonth(year, monthNumber - 1); day++) {
    cells.push(addDays(first, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Where a key moves focus from `date`, following the WAI-ARIA date picker
 * pattern. Returns null for keys that don't move focus.
 */
export function moveDate(date: string, key: string): string | null {
  switch (key) {
    case 'ArrowLeft':
      return addDays(date, -1);
    case 'ArrowRight':
      return addDays(date, 1);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'PageUp':
      return addMonths(date, -1);
    case 'PageDown':
      return addMonths(date, 1);
    case 'Home':
      return addDays(date, -weekdayIndex(date));
    case 'End':
      return addDays(date, 6 - weekdayIndex(date));
    default:
      return null;
  }
}

const longDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** '2026-11-12' → 'Thursday 12 November' */
export function formatLongDate(date: string): string {
  return longDate.format(toUtc(date)).replace(',', '');
}

/** '2026-11' → 'November 2026' */
export function formatMonth(month: Month): string {
  return monthYear.format(toUtc(`${month}-01`));
}

const REASONS: Record<UnavailableReason, string> = {
  past: 'in the past',
  after_cutoff: 'too late to order, orders for tomorrow close at 2pm',
  closed: "we don't deliver that day",
  fully_booked: 'fully booked',
  lead_time: 'too soon, this gift is made to order',
  out_of_stock: 'out of stock',
  too_far: 'too far ahead to book',
};

export function reasonText(reason: UnavailableReason): string {
  return REASONS[reason];
}

/** What a screen reader hears for a date cell: "Saturday 14 November, fully booked". */
export function cellLabel(date: string, reason: UnavailableReason | null): string {
  const label = formatLongDate(date);
  return reason ? `${label}, ${reasonText(reason)}` : label;
}
