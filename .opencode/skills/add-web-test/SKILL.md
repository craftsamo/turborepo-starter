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

</AntiPatterns>
