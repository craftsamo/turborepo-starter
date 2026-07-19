import { expect, test, type Page } from '@playwright/test';
import { expectNoContrastViolations } from '@workspace/playwright';

/**
 * Text contrast — axe's WCAG AA `color-contrast` rule (and only that rule),
 * measured in real Chromium for every route × locale × color scheme at every
 * viewport project. jsdom computes no styles and pixel diffs cannot name a
 * ratio, so a theme color that drops below AA fails here with the measured
 * ratio. Both locales run because their chrome differs (the language switch
 * names the other language) and their copy wraps differently.
 */

/** The copy each route waits for, per locale. */
const copy = {
  en: {
    home: 'Build from a stronger starting point.',
    showcase: 'Built to be touched.',
    streaming: 'Watch the server arrive in stages.',
    payloads: ['Primary payload arrived', 'Secondary payload arrived'],
  },
  ja: {
    home: 'より強固な土台から始めよう。',
    showcase: '触れて確かめる基盤。',
    streaming: 'サーバーから段階的に届く様子を見る。',
    payloads: ['第1ペイロードが到着しました', '第2ペイロードが到着しました'],
  },
} as const;

const routes: ReadonlyArray<{
  path: string;
  ready: (page: Page, text: (typeof copy)[keyof typeof copy]) => Promise<void>;
}> = [
  {
    path: '',
    ready: async (page, text) => {
      await expect(page.getByRole('heading', { name: text.home })).toBeVisible();
    },
  },
  {
    path: '/showcase',
    ready: async (page, text) => {
      await expect(page.getByRole('heading', { name: text.showcase })).toBeVisible();
    },
  },
  {
    path: '/showcase/streaming',
    ready: async (page, text) => {
      await expect(page.getByRole('heading', { name: text.streaming })).toBeVisible();
      // Check the streamed content too: both Suspense payloads arrive after
      // 800ms / 1800ms.
      for (const payload of text.payloads) {
        await expect(page.getByText(payload)).toBeVisible();
      }
    },
  },
];

for (const locale of ['en', 'ja'] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    for (const { path, ready } of routes) {
      const url = `/${locale}${path}`;

      test(`${url} meets text contrast (${colorScheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(url);
        await ready(page, copy[locale]);
        // next-themes applies the class after hydration; axe must not read the
        // pre-hydration colors.
        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${colorScheme}\\b`));
        await expectNoContrastViolations(page);
      });
    }
  }
}
