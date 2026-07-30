import { expect, test, type Page } from '@playwright/test';
import { hasVrtBaselines, isVrtPlatform, isVrtUpdate, vrt } from '@workspace/playwright';

/**
 * Visual regression — pixel-level comparison against committed baselines for
 * every route × viewport project × color scheme. Catches what geometry
 * invariants cannot: colors, typography, spacing, borders, shadows, and
 * dark-mode rendering.
 *
 * Baselines live in `vrt.spec.ts-snapshots/` and are rendered on Linux (CI)
 * only — font rasterization differs per OS, so other platforms skip. To
 * create or refresh baselines, run the "Update VRT baselines" workflow
 * (workflow_dispatch), which opens a PR with the regenerated images.
 */

const shots: ReadonlyArray<{
  path: string;
  slug: string;
  ready: (page: Page) => Promise<void>;
}> = [
  {
    path: '/',
    slug: 'home',
    ready: async (page) => {
      await expect(
        page.getByRole('heading', { name: 'Build from a stronger starting point.' }),
      ).toBeVisible();
    },
  },
  {
    path: '/showcase',
    slug: 'showcase',
    ready: async (page) => {
      await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();
    },
  },
  {
    path: '/showcase/streaming',
    slug: 'streaming',
    ready: async (page) => {
      // Wait for both Suspense boundaries to resolve so the capture is
      // deterministic (the payloads stream in after 800ms / 1800ms).
      await expect(page.getByText('Primary payload arrived')).toBeVisible();
      await expect(page.getByText('Secondary payload arrived')).toBeVisible();
    },
  },
];

test.describe('visual regression', () => {
  test.skip(!isVrtPlatform, 'VRT baselines are rendered on Linux (CI); skipped elsewhere.');
  test.skip(
    isVrtPlatform && !isVrtUpdate && !hasVrtBaselines(__filename),
    'No committed VRT baselines yet — run the "Update VRT baselines" workflow.',
  );

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const { path, slug, ready } of shots) {
      test(`${slug} (${colorScheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await ready(page);
        await vrt(page, `${slug}-${colorScheme}.png`);
      });
    }
  }
});
