import { existsSync } from 'node:fs';
import {
  expect,
  type Page,
  type PageAssertionsToHaveScreenshotOptions,
} from '@playwright/test';

/**
 * Visual-regression testing (VRT) helpers.
 *
 * Baselines are rendered on Linux (CI): font rasterization differs per OS, so
 * comparing a macOS render against a Linux baseline flakes. Specs must gate on
 * `isVrtPlatform` (and on committed baselines — see `hasVrtBaselines`) so
 * local runs on other platforms skip instead of failing.
 */

/** True where VRT baselines are rendered and compared (Linux, i.e. CI). */
export const isVrtPlatform = process.platform === 'linux';

/**
 * Whether committed baselines exist for a spec file (Playwright keeps them in
 * a sibling `<spec>-snapshots` directory). Before the first baseline PR lands,
 * specs skip instead of failing on "snapshot missing".
 */
export const hasVrtBaselines = (specFilePath: string) => existsSync(`${specFilePath}-snapshots`);

/**
 * True when the update-baselines workflow is running (`VRT_UPDATE=1`), which
 * must not skip on missing baselines — it creates them.
 */
export const isVrtUpdate = process.env.VRT_UPDATE === '1';

/**
 * Capture a stable screenshot and compare it against the committed baseline.
 * Waits for fonts and in-viewport images so the capture is deterministic;
 * tolerances and animation-freezing come from the shared config factory.
 *
 * Only images intersecting the viewport are awaited: shots are viewport-sized,
 * so off-screen images cannot affect them — and `loading="lazy"` images below
 * the fold (Next.js `<Image>` default) never fire `load` at all, which would
 * hang an unconditional wait (seen on the narrow mobile project). A hard cap
 * bounds the whole wait so no pathological asset can hold the capture until
 * the test timeout.
 */
export const vrt = async (
  page: Page,
  name: string,
  options?: PageAssertionsToHaveScreenshotOptions,
) => {
  await page.evaluate(async () => {
    const capMs = 5_000;
    const cap = new Promise((resolve) => {
      setTimeout(resolve, capMs);
    });
    const intersectsViewport = (img: HTMLImageElement) => {
      const rect = img.getBoundingClientRect();
      return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      );
    };
    const readiness = async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((img) => !img.complete && intersectsViewport(img))
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                // The image may finish between the filter and listener setup.
                if (img.complete) resolve(undefined);
              }),
          ),
      );
    };
    await Promise.race([readiness(), cap]);
  });
  await expect(page).toHaveScreenshot(name, options);
};
