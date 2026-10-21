import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Page, expect } from '@playwright/test';

/** WCAG 2.2 A and AA, the level the spec targets. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Runs axe on the page as it is now and fails on any serious or critical
 * violation, listing each rule and the elements it found.
 */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = serious.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`);

  expect(report, report.join('\n\n')).toEqual([]);
}

export interface AvailabilityDate {
  date: string;
  available: boolean;
  reason: string | null;
}

/** The first date the product can be booked for, according to the API. */
export async function firstAvailableDate(request: APIRequestContext, slug: string): Promise<string> {
  const response = await request.get(`/api/products/${slug}/availability`);
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { dates: AvailabilityDate[] };
  const date = body.dates.find((d) => d.available)?.date;
  if (!date) throw new Error(`No available date for ${slug}`);
  return date;
}

/** '2026-11-12' → 'Thursday 12 November', matching the app's labels. */
export function longDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(',', '');
}

export const ADMIN_TOKEN = process.env['ADMIN_TOKEN'] ?? 'change-me';

/** Text of the element that has focus, trimmed, for keyboard assertions. */
export async function focusedText(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}
