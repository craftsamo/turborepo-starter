# Playwright

This package provides the shared Playwright configuration and the
layout-regression test helpers for browser apps in the monorepo.

## Overview

- `config.ts` — `createPlaywrightConfig()` factory: the three standard viewport
  projects (`desktop` / `tablet` / `mobile`), the local `next start` web
  server, reporters/artifacts, and screenshot-comparison tolerances.
- `layout.ts` — geometry invariant assertions (`expectNoHorizontalOverflow`,
  `expectExactlyOneVisible`, `expectNoOverlap`, `expectScreenOwnsScroll`,
  `expectSectionsFillScreen`). jsdom cannot compute CSS layout and
  `toBeVisible()` passes on visually broken pages; these helpers assert the
  layout contracts directly from real browser geometry.
- `vrt.ts` — visual-regression helpers (`vrt`, `isVrtPlatform`,
  `hasVrtBaselines`, `isVrtUpdate`). Baselines are rendered on Linux (CI)
  only; other platforms skip.

## Usage

```ts
// playwright.config.ts
import { createPlaywrightConfig } from '@workspace/playwright';

export default createPlaywrightConfig();
```

```ts
// e2e/layout.spec.ts
import { test } from '@playwright/test';
import { expectNoHorizontalOverflow, expectScreenOwnsScroll } from '@workspace/playwright';

test('home keeps its layout invariants', async ({ page }) => {
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
  await expectScreenOwnsScroll(page);
});
```

New browser apps must pass a distinct `portEnvVar` / `defaultPort` so Turbo can
run E2E tasks concurrently. See the `add-e2e-test` skill for the full workflow,
including how VRT baselines are generated and updated.
