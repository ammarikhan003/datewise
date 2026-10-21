import { expect, test } from '@playwright/test';
import { ADMIN_TOKEN, expectNoSeriousA11yViolations, firstAvailableDate, longDate } from './helpers';

test.describe('admin', () => {
  test('rejects a wrong token', async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel('Admin token').fill('not-the-token');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('.ui-error-summary')).toContainText("That token wasn't accepted.");
    await expect(page.getByLabel('Admin token')).toBeVisible();
  });

  test('closing a day makes it unavailable to customers, with the reason', async ({ page, request }) => {
    const date = await firstAvailableDate(request, 'classic-red-roses');
    const label = longDate(date);

    try {
      await page.goto('/admin');
      await page.getByLabel('Admin token').fill(ADMIN_TOKEN);
      await page.getByRole('button', { name: 'Sign in' }).click();

      const row = page.getByRole('row', { name: new RegExp(`^${label}`) });
      await expect(row).toBeVisible();
      await expectNoSeriousA11yViolations(page);

      const edit = row.getByRole('button', { name: `Edit ${label}` });
      await edit.click();
      await expect(page.getByRole('heading', { name: `Edit ${label}` })).toBeFocused();
      await expectNoSeriousA11yViolations(page);

      await page.getByLabel('Closed for deliveries').check();
      await page.getByLabel('Reason for closing').fill('E2E test closure');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(row.getByRole('cell', { name: 'Closed: E2E test closure' })).toBeVisible();
      await expect(edit).toBeFocused();
      await expect(page.getByText(`Saved ${label}.`)).toBeVisible();

      // The customer now sees that date unavailable, and why.
      await page.goto('/products/classic-red-roses');
      await page.getByRole('button', { name: 'Choose a delivery date' }).click();
      const cell = page.locator(`td[data-date="${date}"]`);
      await expect(cell).toHaveAttribute('aria-disabled', 'true');
      await expect(cell).toContainText(`${label}, we don't deliver that day`);
    } finally {
      // Leave the shared database as it was.
      const reopened = await request.patch(`/api/admin/days/${date}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        data: { day: { closed: false } },
      });
      expect(reopened.ok()).toBe(true);
    }
  });
});
