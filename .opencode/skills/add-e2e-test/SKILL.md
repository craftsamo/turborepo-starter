---
name: add-e2e-test
description: Use when adding or updating Playwright E2E coverage for a browser app — functional flows, layout geometry invariants (overflow, chrome, scrolling, snap), or visual regression (VRT) baselines — and when wiring a new route or a new browser app into the E2E safety net. Covers the @workspace/playwright config factory and helpers, the layout.spec.ts / vrt.spec.ts patterns, Linux-only VRT baselines, and the "Update VRT baselines" workflow. Trigger keywords: "e2e", "playwright", "layout test", "geometry invariant", "VRT", "visual regression", "screenshot test", "baseline".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: web,playwright
  stack: playwright,chromium,next16
---

<Goal>

Add Playwright E2E coverage that actually catches layout and visual
regressions. Functional flows prove the app works; geometry invariants prove
it is not visually broken; VRT proves it still looks the same. Every route
must be covered by all three, at every viewport project.

</Goal>

<Background>

jsdom computes no CSS layout, and `toBeVisible()` passes on visually broken
pages. Layout regressions (overflow, wrong chrome per breakpoint, broken
scrolling, covered content, theme glitches) are only observable in a real
browser — that is what this layer is for. See "Test Layer Responsibilities" in
the root AGENTS.md.

</Background>

<Scope>

- Shared infra: `packages/playwright` (`@workspace/playwright`)
  - `createPlaywrightConfig()` — viewport projects (`desktop` / `tablet` /
    `mobile`), local `next start` server, VRT tolerances.
  - Geometry helpers: `expectNoHorizontalOverflow`, `expectExactlyOneVisible`,
    `expectNoOverlap`, `expectScreenOwnsScroll`, `expectSectionsFillScreen`.
  - VRT helpers: `vrt`, `isVrtPlatform`, `isVrtUpdate`, `hasVrtBaselines`.
- App specs: `apps/web/e2e/`
  - `showcase.spec.ts` — functional flows (navigation, interaction, state).
  - `layout.spec.ts` — geometry invariants per route x viewport.
  - `vrt.spec.ts` — screenshot comparison per route x viewport x color scheme.
- Baselines: `apps/web/e2e/vrt.spec.ts-snapshots/` (Linux-rendered, committed).
- Baseline refresh: `.github/workflows/update-vrt-baselines.yml`
  (workflow_dispatch → PR with regenerated images).

</Scope>

<Steps>

1. **New route?** Add it to BOTH route lists:
   - `layout.spec.ts` `routes` array (path + a stable `h1` heading text), and
   - `vrt.spec.ts` `shots` array (path, slug, and a `ready` function that
     waits until the page is deterministic — resolve all Suspense/streamed
     content before capturing).

2. **New layout contract?** Prefer an existing helper from
   `@workspace/playwright`; add a new helper there (not inline in the spec)
   when a second app could need it. Helpers assert real geometry
   (`boundingBox`, `scrollWidth`, `scrollTop` probes) — never class names.
   Gotchas encoded in the helpers: `scroll-smooth` makes `scrollTop` reads
   stale and `snap-mandatory` snaps small offsets back to 0, so probes must
   force `scroll-behavior: auto` / `scroll-snap-type: none` temporarily;
   `boundingBox()` throws on never-attached locators (guard with `count()`).

3. **VRT capture rules**: use the `vrt(page, name)` helper (waits for fonts
   and images); wait for streamed/async content in `ready` first; drive dark
   mode via `page.emulateMedia({ colorScheme: 'dark' })` (next-themes follows
   the system scheme). Never capture non-deterministic content — wait for it
   to settle or `mask` it.

4. **Baselines**: VRT compares only on Linux (`isVrtPlatform`) because font
   rasterization differs per OS; other platforms skip. After adding shots or
   landing an intentional visual change, run the **"Update VRT baselines"**
   workflow (Actions → workflow_dispatch) and merge the PR it opens. Until
   baselines exist for the spec, it skips (`hasVrtBaselines`) instead of
   failing.

5. **New browser app?** Call `createPlaywrightConfig()` from the app's
   `playwright.config.ts` with a distinct `portEnvVar` / `defaultPort` (Turbo
   runs E2E tasks concurrently), define `test:e2e` in its `package.json`, and
   create the same three spec files. Add `@workspace/playwright` to its
   `devDependencies` so `turbo prune` keeps it in CI.

</Steps>

<Verify>

- `nps test.web.e2e.all` — all viewport projects (VRT skips off-Linux).
- `npx turbo run test:e2e --filter=web -- e2e/layout.spec.ts` — single spec.
- CI: the `e2e` job in `.github/workflows/tests.yml` runs everything on Linux,
  including VRT once baselines are committed.

</Verify>

<AntiPatterns>

- Do NOT assert layout in Vitest/jsdom (class names, "should be visible"
  styling claims) — jsdom cannot see layout; put it in `layout.spec.ts`.
- Do NOT write screenshot assertions outside the `vrt` helper / tolerances —
  ad-hoc `toHaveScreenshot` calls without the fonts/images wait flake.
- Do NOT generate or commit VRT baselines from macOS/Windows — they will fail
  in CI; only the workflow (Linux) produces valid baselines.
- Do NOT add a route without extending BOTH `layout.spec.ts` and
  `vrt.spec.ts` — an uncovered route reintroduces the "tests pass but layout
  breaks" gap this layer exists to close.
- Do NOT hand-copy config between apps — extend `createPlaywrightConfig()`.

</AntiPatterns>
