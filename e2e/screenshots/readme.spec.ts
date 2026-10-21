import { Page, expect, test } from '@playwright/test';
import { ADMIN_TOKEN } from '../tests/helpers';

// Walks through the app and saves the screenshots used in the README.
// Places one order and changes nothing else.

const OUT = process.env['SCREENSHOT_DIR'] ?? '/screenshots';
const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage });

test('desktop screenshots', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('ui-card').first()).toBeVisible();
  await shot(page, 'gift-list');

  // The picker, with focus on an unavailable date so the reason shows.
  await page.goto('/products/classic-red-roses');
  await page.getByRole('button', { name: 'Choose a delivery date' }).click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.ui-date-picker__status')).not.toContainText('available');
  await shot(page, 'date-picker');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Continue to checkout' }).click();
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.locator('.ui-error-summary')).toBeFocused();
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await shot(page, 'checkout-errors', true);

  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByLabel('Delivery address').fill('1 Example Street\nLondon N1 1AA');
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await shot(page, 'confirmation', true);

  await page.goto('/admin');
  await page.getByLabel('Admin token').fill(ADMIN_TOKEN);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await shot(page, 'admin');
});

test('phone screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto('/products/personalised-mug');
  await page.getByRole('button', { name: 'Choose a delivery date' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await shot(page, 'phone-date-picker');
});
