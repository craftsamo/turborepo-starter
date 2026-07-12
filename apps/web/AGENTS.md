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
    global-not-found.tsx    # 404 document (composes _components/NotFound)
    _components/            # route-local pieces (private folder, excluded from routing)
      index.ts              # barrel (Header, Section) — NotFound imported directly
      Header/               # component folder: index.tsx + parts (ToggleIcon, ...)
      Section.tsx
      NotFound/             # 404 pieces (BackHomeButton) + index.ts
  components/               # app-wide shared components (server-safe primitives + providers)
    index.ts                # barrel: Container, Heading, Text, Screen (server-safe only)
    Container.tsx           # page width + horizontal padding (single source)
    Heading.tsx             # canonical heading scale (as prop for semantics)
    Text.tsx                # body text tone variants (body/muted/lead)
    Screen.tsx              # full-height scroll region (scroll/smooth/hideScrollbar props)
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
- **Shared primitives**: import `Container` / `Heading` / `Text` / `Screen`
  from `@/components` (the root barrel is server-safe — never add a
  `'use client'` component to it; client providers stay under
  `@/components/Providers`). These own width, type scale, body tone, and
  scrolling so routes compose them instead of re-deriving Tailwind classes.
- **Scrolling**: every page (the 404 document excepted) roots its tree at
  `Screen` (`<main>`). The root layout locks `<body>` (`overflow-hidden`), so
  that `Screen` is the scroll container. Pick the mode with `scroll`
  (`auto` default / `none` / `snap`) and add `smooth` / `hideScrollbar`;
  sections carry their own `snap-start`. The shared `globals.css` intentionally
  does not own app-level scroll/snap rules.
- **Middleware**: compose with `chain([...factories])` in `proxy.ts`. Each
  factory is `(proxy: NextProxy) => NextProxy`. Add new middleware in
  `middlewares/`, export from `middlewares/index.ts`, then register in the
  `chain([...])` array (top-to-bottom execution order). `ratelimit` is
  available but commented out by default.
- **404**: `global-not-found.tsx` renders its own HTML document and composes its
  layout inline (`<main>` + `Container`) with the shared `Heading` / `Text`
  primitives from `@/components` and the `BackHomeButton` from
  `app/_components/NotFound`. Do not add a top-level `not-found.tsx`; extend the
  404 document or the `NotFound` pieces instead.
- **Route-local colocation**: keep route-specific pieces in `_components/`
  (Next.js private folder — the underscore excludes it from routing) next to the
  route that uses them: `app/_components/` for root-level pieces,
  `app/<route>/_components/` for nested routes. Export them through an
  `index.ts` barrel. Promote to `@workspace/ui` only when a second consumer
  appears.
- **Component folders**: a component with parts becomes a folder with a named
  entry (`Header/index.tsx`) plus its parts (`Header/ToggleIcon.tsx`); colocate
  a streaming `Skeleton.tsx`, a `'use server'` `actions.ts`, and a local
  `types.ts` in the same folder when the component needs them.
- **Non-component route helpers** (pagination, filtering, formatting) live in a
  route-local `_utils/` folder (also a private folder), exported via its own
  `index.ts` barrel.
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
