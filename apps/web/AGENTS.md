## Web App Guidelines

For general rules and code style guidelines, see @AGENTS.md.

### Stack

- **Next.js 16** App Router + **React 19** + **Redux Toolkit** + **react-redux**.
- `next-themes` for theming, `sonner` for toasts (via `@workspace/ui`).
- UI primitives from `@workspace/ui/components/*`; shared types from
  `@workspace/types/web`.

### Layout

```
src/
  app/
    layout.tsx              # root layout (async, LayoutProps from @workspace/types/web)
    page.tsx                # root page (async server component)
    components/             # route-local components (Header, Section, ...)
    (global-not-found)/     # 404 route group
      index.tsx             # GlobalNotFoundContent (server component)
      components/
  components/
    Providers/              # client providers (ReduxTool, NextTheme) — 'use client'
  store/
    index.ts                # configureStore + typed hooks (useAppDispatch/useAppSelector)
    slices/                 # createSlice reducers (default-exported)
  middlewares/
    index.ts                # barrel
    ratelimit.ts            # ratelimit() NextProxy wrapper (uses @workspace/constants)
  proxy.ts                  # chain() + config matcher + default export
  tests/                    # Vitest + jsdom (see Testing below)
  types/                    # app-local types (cross-package types go in @workspace/types)
```

### Conventions

- **Server Components by default.** Mark `'use client'` only for components
  that need browser APIs, hooks, context, or providers. See
  `components/Providers/*.tsx` for the pattern.
- Page/layout props come from `@workspace/types/web` (`PageProps`,
  `LayoutProps`). `params` and `searchParams` are `Promise<...>` — always
  `await` them in server components.
- Import UI via subpaths: `@workspace/ui/components/<name>`,
  `@workspace/ui/lib/utils` (for `cn`), `@workspace/ui/hooks/<name>`. Never
  deep-import via relative paths.
- **Redux Toolkit**: create slices in `store/slices/<name>.ts` with
  `createSlice`, default-export the reducer, named-export the actions. Register
  the reducer in `store/index.ts`. Use the typed hooks
  `useAppDispatch` / `useAppSelector` from `@/store` — never raw
  `useDispatch`/`useSelector`.
- **Providers**: wrap the app in `ReduxToolProvider` then `ThemeProvider`
  (see `app/layout.tsx`). `ThemeProvider` dynamically imports
  `next-themes`' `ThemeProvider` with `ssr: true`.
- **Middleware**: compose with `chain([...factories])` in `proxy.ts`. Each
  factory is `(proxy: NextProxy) => NextProxy`. Add new middleware in
  `middlewares/`, export from `middlewares/index.ts`, then register in the
  `chain([...])` array (top-to-bottom execution order). `ratelimit` is
  available but commented out by default.
- **404**: the `(global-not-found)` route group renders `GlobalNotFoundContent`.
  Do not add a top-level `not-found.tsx`; extend this group instead.
- Keep route-specific components in `app/components/` or
  `app/<route>/components/`. Promote to `@workspace/ui` only when a second
  consumer appears.
- Import shared constants from `@workspace/constants` (e.g.
  `rateLimitConfigs`, `RateLimitConfig`); never duplicate them locally.

### Testing

Tests are located in `src/tests/**/*.test.tsx` using Vitest + jsdom.

Run tests with:

- `nps test.web` - Run all web app tests
- `nps test.watch` - Watch mode
- `cd apps/web && pnpm test -- path/to/test.test.tsx` - Single test file

Test utilities:

- `src/tests/testUtils.tsx` exports `customRender` (re-exported as `render`)
  that wraps components in `RouterContext` + `ReduxToolProvider` +
  `ThemeProvider`. Use it instead of raw `@testing-library/react` `render`.
- `src/tests/vitest.setup.js` mocks `matchMedia`, `IntersectionObserver`, and
  `next/router`. Add global mocks here.
- Server components are async — `await` the component before rendering:
  `render(await RootPage())`, wrapped in `act`/`waitFor` as needed.
