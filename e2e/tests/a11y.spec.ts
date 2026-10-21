import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations, firstAvailableDate } from './helpers';

// axe on every page, in a real browser, so colour contrast is checked too.
// The order journey and admin specs run axe on the pages they reach.
test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test('gift list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('ui-card').first()).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });

  test('product page, with the date picker closed and open', async ({ page }) => {
    await page.goto('/products/classic-red-roses');
    const trigger = page.getByRole('button', { name: 'Choose a delivery date' });
    await expect(trigger).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Choose a delivery date' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('out-of-stock product page', async ({ page }) => {
    await page.goto('/products/scented-candle-gift-set');
    await expect(page.getByText('This gift is out of stock')).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });

  test('checkout, before and after a failed submit', async ({ page, request }) => {
    const date = await firstAvailableDate(request, 'classic-red-roses');
    await page.goto(`/products/classic-red-roses/checkout?date=${date}`);
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.getByText('There is a problem')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('admin sign-in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByLabel('Admin token')).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });

  test('design system page, with an error shown', async ({ page }) => {
    await page.goto('/design-system');
    await expectNoSeriousA11yViolations(page);

    await page.getByRole('button', { name: 'Show error' }).click();
    await expect(page.getByText('There is a problem')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('page not found', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });
});
