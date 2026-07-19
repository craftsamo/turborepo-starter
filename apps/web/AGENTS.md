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
    global-not-found.tsx    # 404 document (self-contained: Container + Heading + Text + inline back link)
    [locale]/               # locale root — html lang + providers + localized metadata
      layout.tsx            # root document: Providers + Toaster + body lock
      (app)/                # main route group — owns page chrome (app shell)
        layout.tsx          # h-svh frame: Toolbar (sm+) + page-owned Screen + BottomNav (xs)
        page.tsx            # home page — composes Screen + Section(s) + Footer
  components/               # app-wide shared components (server-safe primitives + chrome)
    index.ts                # barrel: Center, Container, Heading, Screen, Section, Stack, Text (server-safe only)
    Container.tsx           # page width + horizontal padding (single source)
    Heading.tsx             # canonical heading scale (as prop for semantics)
    Text.tsx                # body text tone variants (body/muted/lead)
    Screen.tsx              # page scroll region (mode: flow/full/snap; smooth/hideScrollbar)
    Section.tsx             # semantic page section; follows parent Screen mode
    Center.tsx              # centering frame (axis + min: none/screen); asChild
    Stack.tsx               # flex stack primitive + VStack/HStack presets (gap/align/justify/wrap/collapse); asChild
    Navigation/             # responsive chrome: Toolbar (sm+) + BottomNav (xs); docked/floating variants
    Footer/                 # app footer (minimal, slim)
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
  (see `app/[locale]/layout.tsx`). `ThemeProvider` dynamically imports
  `next-themes`' `ThemeProvider` with `ssr: true`.
- **Shared primitives**: import `Center` / `Container` / `Heading` / `Screen` /
  `Section` / `Stack` (+ `VStack` / `HStack`) / `Text` from `@/components` (the
  root barrel is server-safe — never add a `'use client'` component to it;
  client providers stay under `@/components/Providers`, and the chrome
  (`Navigation` / `Footer`) is imported via `@/components/Navigation` /
  `@/components/Footer`). These
  own width, type scale, body tone, scrolling, centering, and stacking so routes
  compose them instead of re-deriving Tailwind classes.
- **Layout primitives**: reach for `VStack` / `HStack` (the `Stack` presets) for
  gapped columns/rows and `Center` for centering (a `flex-1` child fills the
  scroll region between the chrome). Drop to `Stack` directly only to drive
  `direction` yourself. They are cva wrappers with `asChild` (Radix `Slot`) —
  project the layout onto a semantic element (`<Center asChild><section>`,
  `<HStack asChild><nav>`) instead of adding a wrapper. Compose these instead
  of hand-writing `flex … gap-*`; `Container` still owns width and `Screen`
  scrolling.
- **App shell & scrolling**: page chrome lives in a route-group layout, not the
  locale root layout, as an app shell. The `[locale]/(app)` group's `layout.tsx` is a
  fixed-height flex column (`h-svh`, `overflow-hidden`) that never scrolls: the
  `Toolbar` (sm+) is pinned at the top and the `BottomNav` (mobile) at the
  bottom. Each page (or nested route-group layout) places a `Screen` (`<main>`,
  `flex-1`) between them, chooses `mode` (`flow` default / `full` / `snap`),
  composes one or more `Section` children, and places `Footer` explicitly when
  wanted. `Section` reads its parent Screen mode: `flow` keeps natural height,
  `full` fills the visible region, and `snap` also adds snap points. Because the
  chrome sits outside `Screen`, it stays put while only page content scrolls.
  The locale root layout locks `<body>` (`overflow-hidden`) and sets
  `viewport-fit=cover` for the bottom nav's safe-area inset. Add `smooth` /
  `hideScrollbar` to Screen as needed. The shared `globals.css` intentionally
  does not own app-level scroll/snap rules.
- **Navigation style**: `Toolbar` and `BottomNav` share a
  `NavigationVariant` (`docked` / `floating`). Set the variant once in the
  `(app)` layout and pass it to both components. `docked` is the edge-to-edge
  default; `floating` is an inset Liquid Glass treatment (translucent surface,
  strong blur, subtle border/shadow, rounded capsule). The floating mobile bar
  is a compact icon-only capsule; the docked bar keeps visible labels. Keep the
  two chrome surfaces on the same variant so the responsive switch feels
  coherent.
- **Middleware**: compose with `chain([...factories])` in `proxy.ts`. Each
  factory is `(proxy: NextProxy) => NextProxy`. Add new middleware in
  `middlewares/`, export from `middlewares/index.ts`, then register in the
  `chain([...])` array (top-to-bottom execution order). `ratelimit` is
  available but commented out by default.
- **404**: `global-not-found.tsx` renders its own HTML document and composes its
  layout inline (`<main>` + `Container`) with the shared `Heading` / `Text`
  primitives from `@/components` and an inline back-home `Button` + `Link`. Do
  not add a top-level `not-found.tsx`; extend the 404 document itself instead.
- **Locale switching**: `[locale]/layout.tsx` owns `<html>` + Providers so the
  pages statically generate (SSG); `useLocaleSwitch` switches with a full reload
  (`window.location.replace`). To switch to SPA soft navigation (no reload, no
  `next-themes` script warning) at the cost of dynamic rendering, follow the
  `locale-spa-switch` skill — do not hand-roll it.
- **Route-local colocation**: keep route-specific pieces in `_components/`
  (Next.js private folder — the underscore excludes it from routing) next to the
  route that uses them: `app/(app)/_components/` for the main group,
  `app/<route>/_components/` for nested routes. Export them through an
  `index.ts` barrel. Promote to `@workspace/ui` only when a second consumer
  appears.
- **Component folders**: a component with parts becomes a folder with a named
  entry (`index.tsx`) plus its sibling parts, or a barrel (`index.ts`) grouping
  related components (as `Navigation/` does with `Toolbar` + `BottomNav`);
  colocate a streaming `Skeleton.tsx`, a `'use server'` `actions.ts`, and a
  local `types.ts` in the same folder when the component needs them.
- **Non-component route helpers** (pagination, filtering, formatting) live in a
  route-local `_utils/` folder (also a private folder), exported via its own
  `index.ts` barrel.
- Import shared constants from `@workspace/constants` (e.g.
  `rateLimitConfigs`, `RateLimitConfig`); never duplicate them locally.

### Testing

Tests are located in `src/tests/**/*.test.tsx` using Vitest + jsdom.

Run tests with:

- `nps test.web` / `nps test.web.unit` - Run Vitest unit/component tests
- `nps test.web.e2e.desktop` - Run Playwright in desktop Chromium
- `nps test.web.e2e.tablet` - Run Playwright in tablet Chromium
- `nps test.web.e2e.mobile` - Run Playwright in mobile Chromium
- `nps test.web.e2e.all` - Run all Playwright viewport projects
- `PLAYWRIGHT_BASE_URL=https://staging.example.com nps test.web.live` - Run the
  same Playwright smoke test against an external deployment
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
- Local Playwright runs own `WEB_E2E_PORT` (3100 by default) and never reuse an
  existing server. `nps test.web.live` instead requires `PLAYWRIGHT_BASE_URL`
  and never starts a local server. Keep every future browser app on a distinct
  default port so Turbo can run E2E tasks concurrently.
