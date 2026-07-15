import { expect, test } from '@playwright/test';

test('navigates to the showcase and updates shared state', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Build from a stronger starting point.' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Explore showcase' }).click();

  await expect(page).toHaveURL(/\/showcase$/);
  await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();

  await page.getByRole('button', { name: 'Increment' }).click();

  await expect(page.getByLabel('Counter value')).toHaveText('1');
  await expect(page.getByText('Counter incremented', { exact: true })).toBeVisible();
});
