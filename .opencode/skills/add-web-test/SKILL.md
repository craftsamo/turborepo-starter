---
name: add-web-test
description: Use when adding a Vitest test for apps/web (components, pages, slices, utils). Covers the customRender wrapper (RouterContext + ReduxToolProvider + ThemeProvider), vitest.setup.js global mocks, awaiting async server components before render, and test file placement under src/tests. Trigger keywords: "vitest test", "jsdom", "customRender", "testing library", "test web".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: web
  stack: vitest,jsdom,testing-library,react19
---

<Goal>

Add a Vitest + jsdom test for `apps/web` that renders components through the
project's `customRender` wrapper (so router, Redux, and theme context are all
present) and correctly handles async server components.

**Boundary**: this layer verifies semantics and behavior only. jsdom computes
no CSS layout — never assert layout, breakpoints, scrolling, or visual
correctness here; that belongs to the Playwright layers (`add-e2e-test`
skill: `e2e/layout.spec.ts` geometry invariants and `e2e/vrt.spec.ts` VRT).

</Goal>

<Scope>

- App: `apps/web`
- Test location: `src/tests/**/*.test.tsx` (mirror the path of the code under
  test, e.g. code at `src/app/page.tsx` → test at `src/tests/app/page.test.tsx`)
- Utilities:
  - `src/tests/testUtils.tsx` — `customRender` (re-exported as `render`)
  - `src/tests/vitest.setup.js` — global mocks (`matchMedia`,
    `IntersectionObserver`, `next/router`)
- Reference: `src/tests/app/page.test.tsx`.
- Full conventions: see `apps/web/AGENTS.md` (always loaded).

</Scope>

<Steps>

1. **Place the test** under `src/tests/`, mirroring the source path. Example:
   - Source: `src/components/MyComponent.tsx`
   - Test: `src/tests/components/MyComponent.test.tsx`

2. **Import `render` from `../testUtils`** (relative to the test file), NOT
   from raw `@testing-library/react`. `testUtils.tsx` re-exports
   `customRender` as `render` and also re-exports `@testing-library/react` and
   `@testing-library/user-event`:

   ```tsx
   import { render, act, waitFor, screen } from "../testUtils";
   ```

3. **For async server components**, `await` the component before rendering
   (they return a `Promise<ReactElement>`):

   ```tsx
   import MyPage from "../../app/page";

   it("renders", async () => {
     await act(async () => {
       render(await MyPage());
     });
     await waitFor(() => {
       expect(screen.getByText(/title/i)).toBeInTheDocument();
     });
   });
   ```

   See `src/tests/app/page.test.tsx:5-14` for the exact pattern.

4. **For client components** that use Redux, the wrapper already provides
   `ReduxToolProvider` with the real store. Dispatch via `useAppDispatch` inside
   the component under test, or pre-seed state by rendering a setup component
   that dispatches before your assertions.

5. **For router-dependent components**, `testUtils.tsx` injects a mock
   `NextRouter` via `RouterContext`. Override per-test by passing
   `{ router: { ...customRouter } }` as the second argument to `render`.

6. **Add global mocks** (browser APIs, `next/router`, etc.) to
   `src/tests/vitest.setup.js`, NOT per-test. `matchMedia`,
   `IntersectionObserver`, and `next/router` are already mocked there.

7. Use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, ...) — they
   are wired up in `vitest.setup.js`.

</Steps>

<WhatToAssert>

What belongs in a jsdom test, by subject. Everything visual belongs to the
Playwright layers (`add-e2e-test`) — jsdom computes no CSS layout, so a
layout assertion here tests nothing.

- **Component** (`_components/`, `@workspace/ui`): roles, ARIA attributes,
  accessible names; the *semantic* difference between variants (e.g. a
  `floating` nav renders `sr-only` labels, an active tab gets
  `aria-current`); handler wiring (click/submit fires, dispatches); controlled
  state transitions. DOM *order* is fine (`getAllByRole` sequence) — DOM
  *position* is not.
- **Page** (async server component): the `h1` and load-bearing copy; link
  `href`s; semantic attributes the E2E layer anchors on (`data-mode`,
  `data-slot`, `data-variant`); that awaited `params`/`searchParams` are
  reflected in output.
- **Slice / util / hook**: pure input→output — reducers, actions, selectors,
  formatting; no DOM at all.
- **Interaction** (form, counter, toast): the component-level behavior here
  (state updates, callbacks, a11y of error states); the real end-to-end
  wiring (route + store + toaster on a live page) belongs in the functional
  E2E spec.

</WhatToAssert>

<Verify>

- `cd apps/web && pnpm test -- path/to/test.test.tsx` — single file
- `nps test.web` / `nps test.web.unit` — all Vitest unit/component tests through Turbo
- `nps test.watch` — watch mode
- `nps lint.web` + `nps typecheck.web` — keep the test green with lint/types

</Verify>

<AntiPatterns>

- Do NOT import `render` from `@testing-library/react` directly — it bypasses
  the Router/Redux/Theme providers and breaks router/Redux-dependent
  components. Use `render` from `../testUtils`.
- Do NOT forget to `await` async server components before `render(...)` —
  `render(MyPage())` (no `await`) renders a Promise, not the tree.
- Do NOT add `matchMedia` / `IntersectionObserver` / `next/router` mocks
  per-test — they belong in `src/tests/vitest.setup.js`.
- Do NOT put tests outside `src/tests/` — that's the configured glob.
- Do NOT assert appearance or placement in jsdom: no `toHaveClass` for
  styling, no layout/breakpoint/alignment/column-count claims, no full-tree
  snapshots. Placement and looks are owned by `e2e/layout.spec.ts` (geometry)
  and `e2e/vrt.spec.ts` (pixels) — see the `add-e2e-test` skill.

</AntiPatterns>
