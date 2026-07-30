import { expect, test, type Page } from '@playwright/test';
import {
  expectExactlyOneVisible,
  expectNoHorizontalOverflow,
  expectNoOverlap,
  expectScreenOwnsScroll,
  expectSectionsFillScreen,
} from '@workspace/playwright';

/**
 * Layout invariants — geometry contracts that must hold on every route at
 * every viewport project. Functional specs (see showcase.spec.ts) prove the
 * app works; these prove it is not visually broken. They run in real Chromium,
 * so breakpoint, overflow, scroll-ownership, and chrome-overlap regressions
 * fail here even though jsdom unit tests cannot see them.
 */

const routes = [
  { path: '/', heading: 'Build from a stronger starting point.' },
  { path: '/showcase', heading: 'Built to be touched.' },
  { path: '/showcase/streaming', heading: 'Watch the server arrive in stages.' },
] as const;

const toolbar = (page: Page) => page.locator('header[data-variant]');
const bottomNav = (page: Page) => page.locator('nav[data-variant]');
const screen = (page: Page) => page.locator('main[data-mode]');

for (const { path, heading } of routes) {
  test.describe(`layout invariants: ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });

    test('never overflows horizontally', async ({ page }) => {
      await expectNoHorizontalOverflow(page);
    });

    test('shows exactly one primary navigation for the viewport', async ({ page }) => {
      await expectExactlyOneVisible([toolbar(page), bottomNav(page)], 'Toolbar / BottomNav');
    });

    test('screen owns scrolling, not the window', async ({ page }) => {
      await expectScreenOwnsScroll(page);
    });

    test('chrome never covers content at either end of the scroll', async ({ page }) => {
      // Top: the (possibly floating) toolbar must not sit on the page heading.
      await expectNoOverlap(toolbar(page), page.getByRole('heading', { name: heading }), {
        label: 'Toolbar vs page heading',
      });

      // Bottom: after scrolling to the end, the (possibly floating) bottom nav
      // must not cover the footer — the Screen spacer must keep it clear.
      await screen(page).evaluate((el) => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      });
      await expectNoOverlap(bottomNav(page), page.locator('footer'), {
        label: 'BottomNav vs footer',
      });
    });
  });
}

test.describe('layout invariants: snap mode', () => {
  test('showcase snap sections each fill the screen', async ({ page }) => {
    await page.goto('/showcase');
    await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();
    await expectSectionsFillScreen(page);
  });
});
