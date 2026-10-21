import { Page, expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations, firstAvailableDate, focusedText, longDate } from './helpers';

// The spec's "done" test: the whole order journey with only a keyboard.
// No clicks: every step is a key press, and each step checks where focus is.

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Choose a delivery date' });
const focusedDate = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset['date']);

test('a customer can order a gift using only the keyboard', async ({ page, request }) => {
  const firstDate = await firstAvailableDate(request, 'classic-red-roses');

  // Gift list: skip link, then straight to the first gift.
  await page.goto('/');
  await expect(page.locator('ui-card').first()).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await focusedText(page)).toBe('Skip to main content');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await focusedText(page)).toBe('Classic Red Roses');

  // Product page: focus lands on the heading after navigating.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/products\/classic-red-roses$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Classic Red Roses' })).toBeFocused();
  await page.keyboard.press('Tab');
  const trigger = page.getByRole('button', { name: 'Choose a delivery date' });
  await expect(trigger).toBeFocused();

  // Opening the picker focuses the first date that can be booked.
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeVisible();
  expect(await focusedDate(page)).toBe(firstDate);

  // Escape on a date closes it and returns focus to the trigger.
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();

  // Escape on another control is handled by the native <dialog>.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  expect(await focusedText(page)).toBe('Close');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();

  // Tab never reaches anything behind the open dialog.
  await page.keyboard.press('Enter');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const outside = await page.evaluate(() => {
      const active = document.activeElement;
      const open = document.querySelector('dialog[open]');
      return !!active && active !== document.body && !open?.contains(active);
    });
    expect(outside, `Tab ${i + 1} left the dialog`).toBe(false);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();

  // Arrow keys and Page Up/Down move through dates and months.
  await page.keyboard.press('Enter');
  const month = dialog(page).locator('[id$="-month"]');
  const startMonth = await month.textContent();
  await page.keyboard.press('ArrowRight');
  expect(await focusedDate(page)).not.toBe(firstDate);
  await page.keyboard.press('ArrowLeft');
  expect(await focusedDate(page)).toBe(firstDate);
  await page.keyboard.press('PageDown');
  await expect(month).not.toHaveText(startMonth ?? '');
  await page.keyboard.press('PageUp');
  expect(await focusedDate(page)).toBe(firstDate);

  // Enter chooses the date and returns focus to the trigger.
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeHidden();
  const changeDate = page.getByRole('button', { name: 'Change date' });
  await expect(changeDate).toBeFocused();
  await expect(page.getByText(`Delivery date: ${longDate(firstDate)}`)).toBeVisible();

  // On to checkout.
  await page.keyboard.press('Tab');
  expect(await focusedText(page)).toBe('Continue to checkout');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/checkout\\?date=${firstDate}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeFocused();

  const name = page.getByLabel('Full name');
  for (let i = 0; i < 6 && !(await name.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(name).toBeFocused();

  // Submitting empty (Enter in a field) focuses the error summary.
  await page.keyboard.press('Enter');
  const summary = page.locator('.ui-error-summary');
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('link')).toHaveText([
    'Enter your full name',
    'Enter your email address',
    'Enter the delivery address',
  ]);

  // Its first link takes focus back to the name field.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(name).toBeFocused();

  await page.keyboard.type('Keyboard Tester');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email address')).toBeFocused();
  await page.keyboard.type('keyboard-tester@example.com');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Delivery address')).toBeFocused();
  await page.keyboard.type('1 Keyboard Lane');
  await page.keyboard.press('Enter');
  await page.keyboard.type('London N1 1AA');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Place order' })).toBeFocused();

  // Placing the order lands on the confirmation, with focus on its heading.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/orders\/confirmation$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Order placed' })).toBeFocused();
  await expect(page.locator('dl')).toContainText('Keyboard Tester');
  await expect(page.locator('dl')).toContainText(longDate(firstDate));
  await expect(page.locator('.address')).toHaveText('1 Keyboard Lane\nLondon N1 1AA');

  await expectNoSeriousA11yViolations(page);
});
