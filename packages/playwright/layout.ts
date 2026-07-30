import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Geometry invariants for layout-regression E2E tests.
 *
 * jsdom unit tests cannot compute CSS layout, and plain `toBeVisible()` checks
 * pass even when the page is visually broken. These helpers assert the layout
 * contracts that keep a page usable — run them per route, per viewport
 * project, so breakpoint regressions surface in CI.
 */

/** The app must never overflow horizontally at any viewport. */
export const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, 'document must not overflow horizontally').toBeLessThanOrEqual(0);
};

/**
 * Exactly one of the given locators must be visible — e.g. the responsive
 * chrome contract: Toolbar (sm+) XOR BottomNav (mobile), never both or none.
 */
export const expectExactlyOneVisible = async (locators: Locator[], label = 'locators') => {
  const visibilities = await Promise.all(locators.map((locator) => locator.isVisible()));
  const visibleCount = visibilities.filter(Boolean).length;
  expect(visibleCount, `exactly one of ${label} must be visible (got ${visibleCount})`).toBe(1);
};

/**
 * Two elements must not overlap (e.g. floating chrome vs. content/CTAs).
 * Elements that are not rendered pass trivially. `tolerance` allows a few
 * pixels of intentional visual overlap (shadows, rounded corners).
 */
export const expectNoOverlap = async (
  a: Locator,
  b: Locator,
  { tolerance = 0, label = 'elements' }: { tolerance?: number; label?: string } = {},
) => {
  // Absent or hidden elements cannot overlap; `boundingBox()` alone would
  // throw on locators that never attach.
  const box = async (locator: Locator) =>
    (await locator.count()) === 0 ? null : await locator.boundingBox();
  const [boxA, boxB] = await Promise.all([box(a), box(b)]);
  if (!boxA || !boxB) return;

  const xOverlap = Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x);
  const yOverlap = Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y);
  const overlaps = xOverlap > tolerance && yOverlap > tolerance;
  expect(
    overlaps,
    `${label} must not overlap (x: ${Math.round(xOverlap)}px, y: ${Math.round(yOverlap)}px)`,
  ).toBe(false);
};

/**
 * The window/body must never scroll; the `Screen` region owns scrolling.
 * Catches lost `overflow-hidden` / `h-svh` / `min-h-0` on the app shell,
 * which shows up as double scrollbars or a chrome that scrolls away.
 */
export const expectScreenOwnsScroll = async (page: Page, screenSelector = 'main[data-mode]') => {
  const result = await page.evaluate((selector) => {
    window.scrollTo({ top: 120, behavior: 'instant' });
    const windowScrolled = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const screen = document.querySelector<HTMLElement>(selector);
    if (!screen) return { windowScrolled, screenFound: false, screenScrolls: null };

    // Only assert scrollability when there is actually overflowing content.
    if (screen.scrollHeight <= screen.clientHeight + 1) {
      return { windowScrolled, screenFound: true, screenScrolls: null };
    }
    // `scroll-smooth` screens report a stale scrollTop right after the
    // assignment, and `snap-mandatory` screens snap small offsets back to 0 —
    // neutralize both for the probe, then restore.
    const previousBehavior = screen.style.scrollBehavior;
    const previousSnapType = screen.style.scrollSnapType;
    screen.style.scrollBehavior = 'auto';
    screen.style.scrollSnapType = 'none';
    const before = screen.scrollTop;
    screen.scrollTop = 120;
    const screenScrolls = screen.scrollTop > 0;
    screen.scrollTop = before;
    screen.style.scrollBehavior = previousBehavior;
    screen.style.scrollSnapType = previousSnapType;
    return { windowScrolled, screenFound: true, screenScrolls };
  }, screenSelector);

  expect(result.screenFound, `Screen (${screenSelector}) must exist`).toBe(true);
  expect(result.windowScrolled, 'window/body must not scroll — Screen owns scrolling').toBe(0);
  if (result.screenScrolls !== null) {
    expect(result.screenScrolls, 'Screen must be able to scroll its overflowing content').toBe(
      true,
    );
  }
};

/**
 * In `full` / `snap` mode every `Section` must fill the visible scroll region.
 * Catches sections that stop filling the viewport after a flex/height change.
 */
export const expectSectionsFillScreen = async (
  page: Page,
  {
    screenSelector = 'main[data-mode]',
    sectionSelector = '[data-slot="section"]',
    tolerance = 1,
  }: { screenSelector?: string; sectionSelector?: string; tolerance?: number } = {},
) => {
  const result = await page.evaluate(
    ({ screenSelector, sectionSelector }) => {
      const screen = document.querySelector(screenSelector);
      if (!screen) return null;
      return {
        mode: screen.getAttribute('data-mode'),
        screenHeight: screen.clientHeight,
        sectionHeights: [...screen.querySelectorAll(sectionSelector)].map(
          (section) => section.getBoundingClientRect().height,
        ),
      };
    },
    { screenSelector, sectionSelector },
  );

  expect(result, `Screen (${screenSelector}) must exist`).not.toBeNull();
  expect(
    ['full', 'snap'],
    'expectSectionsFillScreen only applies to full/snap Screen modes',
  ).toContain(result!.mode);
  expect(result!.sectionHeights.length, 'Screen must contain sections').toBeGreaterThan(0);
  for (const [index, height] of result!.sectionHeights.entries()) {
    expect(
      height,
      `section #${index} must fill the ${result!.screenHeight}px screen (got ${Math.round(height)}px)`,
    ).toBeGreaterThanOrEqual(result!.screenHeight - tolerance);
  }
};
