import { expect, test } from '@playwright/test';

// Placeholder until milestone 8 adds the order journey and axe checks.
test('home page loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Datewise/);
});
