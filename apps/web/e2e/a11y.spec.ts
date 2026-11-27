import { expect, test, type Page } from '@playwright/test';
import { expectNoContrastViolations } from '@workspace/playwright';

/**
 * Text contrast — axe's WCAG AA `color-contrast` rule (and only that rule),
 * measured in real Chromium for every route × color scheme at every viewport
 * project. jsdom computes no styles and pixel diffs cannot name a ratio, so a
 * theme color that drops below AA fails here with the measured ratio.
 */

const routes: ReadonlyArray<{
  path: string;
  ready: (page: Page) => Promise<void>;
}> = [
  {
    path: '/',
    ready: async (page) => {
      await expect(
        page.getByRole('heading', { name: 'Build from a stronger starting point.' }),
      ).toBeVisible();
    },
  },
  {
    path: '/showcase',
    ready: async (page) => {
      await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();
    },
  },
  {
    path: '/showcase/streaming',
    ready: async (page) => {
      await expect(
        page.getByRole('heading', { name: 'Watch the server arrive in stages.' }),
      ).toBeVisible();
      // Check the streamed content too: both Suspense payloads arrive after
      // 800ms / 1800ms.
      await expect(page.getByText('Primary payload arrived')).toBeVisible();
      await expect(page.getByText('Secondary payload arrived')).toBeVisible();
    },
  },
];

for (const colorScheme of ['light', 'dark'] as const) {
  for (const { path, ready } of routes) {
    test(`${path} meets text contrast (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      await ready(page);
      // next-themes applies the class after hydration; axe must not read the
      // pre-hydration colors.
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${colorScheme}\\b`));
      await expectNoContrastViolations(page);
    });
  }
}
