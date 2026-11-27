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
const toolbarNav = (page: Page) => toolbar(page).getByRole('navigation');
const bottomNav = (page: Page) => page.locator('nav[data-variant]');
const bottomBar = (page: Page) => page.locator('[data-slot="bottom-bar"]');
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

    test('shows the top bar and exactly one primary navigation', async ({ page }) => {
      await expect(toolbar(page)).toBeVisible();
      await expectExactlyOneVisible([toolbarNav(page), bottomNav(page)], 'Toolbar nav / BottomNav');
    });

    test('screen owns scrolling, not the window', async ({ page }) => {
      await expectScreenOwnsScroll(page);
    });

    test('chrome never covers content at either end of the scroll', async ({ page }) => {
      // Top: the (possibly floating) toolbar must not sit on the page heading.
      await expectNoOverlap(toolbar(page), page.getByRole('heading', { name: heading }), {
        label: 'Toolbar vs page heading',
      });

      // Bottom: after scrolling to the end, the (possibly floating) bottom bar
      // must not cover the last content. A page ending in the shared Footer
      // lets the footer take the clearance itself; any other page relies on
      // the Screen spacer.
      await screen(page).evaluate((el) => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      });
      // The bar slides back in at the end of the page; measure it once its
      // transform transition has finished.
      await expect(bottomBar(page)).not.toHaveAttribute('data-hidden');
      await bottomBar(page).evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished)),
      );

      const footer = screen(page).locator(':scope > [data-slot="footer"]:last-child');
      if ((await footer.count()) > 0) {
        await expectNoOverlap(bottomBar(page), footer.locator(':scope > :first-child'), {
          label: 'Bottom bar vs footer row',
        });
        const [footerBox, screenBox] = await Promise.all([
          footer.boundingBox(),
          screen(page).boundingBox(),
        ]);
        const emptyBand = screenBox!.y + screenBox!.height - (footerBox!.y + footerBox!.height);
        expect(
          Math.abs(emptyBand),
          `footer must reach the end of the scroll region (${Math.round(emptyBand)}px empty band)`,
        ).toBeLessThanOrEqual(1);
      } else {
        await expectNoOverlap(bottomBar(page), screen(page).locator(':scope > :last-child'), {
          label: 'Bottom bar vs last content',
        });
      }
    });
  });
}

test.describe('layout invariants: bottom bar clearance', () => {
  test('is defined exactly while the floating bottom bar is shown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: routes[0].heading })).toBeVisible();
    const clearance = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue('--bottom-nav-clearance').trim(),
    );
    const bar = page.locator('[data-slot="bottom-bar"][data-variant="floating"]');
    const floating = await bar.isVisible();
    expect(clearance !== '', `--bottom-nav-clearance is "${clearance}"`).toBe(floating);
    if (!floating) return;

    // The bar sits at the top of the page, so wait for any transition to settle.
    await bar.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const labels = await bar.getAttribute('data-labels');
    const { px, footprint } = await bar.evaluate((el) => {
      const probe = document.createElement('div');
      probe.style.height = 'var(--bottom-nav-clearance, 0px)';
      document.body.append(probe);
      const px = probe.getBoundingClientRect().height;
      probe.remove();
      return { px, footprint: window.innerHeight - el.getBoundingClientRect().top };
    });
    expect(
      px,
      `clearance ${px}px must cover the bar (${footprint}px, data-labels=${labels})`,
    ).toBeGreaterThanOrEqual(footprint);
    expect(
      px - footprint,
      `clearance ${px}px leaves a small gap over the bar (${footprint}px, data-labels=${labels})`,
    ).toBeLessThanOrEqual(16);
  });
});

test.describe('layout invariants: snap mode', () => {
  test('showcase snap sections each fill the screen', async ({ page }) => {
    await page.goto('/showcase');
    await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();
    await expectSectionsFillScreen(page);
  });
});

test.describe('layout invariants: floating bottom bar', () => {
  test('stays on screen while focus is inside it', async ({ page }) => {
    // The showcase is long enough on mobile to scroll away from both ends.
    await page.goto('/showcase');
    await expect(page.getByRole('heading', { name: routes[1].heading })).toBeVisible();
    const bar = page.locator('[data-slot="bottom-bar"][data-variant="floating"]');
    test.skip(!(await bar.isVisible()), 'the floating bottom bar shows only below sm');

    // Step one snap section at a time.
    const scrollToSection = (index: number) =>
      screen(page).evaluate(
        (el, i) => el.scrollTo({ top: el.clientHeight * i, behavior: 'instant' }),
        index,
      );
    // Retry until hydration has attached the scroll listener.
    await expect(async () => {
      await scrollToSection(0);
      await scrollToSection(1);
      await expect(bar).toHaveAttribute('data-hidden', 'true', { timeout: 500 });
    }).toPass();

    // Focus reveals the bar; scrolling on must not move the focused tab away.
    await bar.getByRole('link').first().focus();
    await scrollToSection(2);
    await expect(bar).toHaveAttribute('data-hidden', 'true');
    await bar.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = await bar.boundingBox();
    expect(box!.y + box!.height, 'focused bar must stay inside the viewport').toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  });
});
