---
name: add-next-route
description: Use when adding a new Next.js App Router route or route group to apps/web (page.tsx, layout.tsx, loading.tsx, route groups). Covers async server components, PageProps/LayoutProps from @workspace/types/web, awaiting Promise params/searchParams, route-local _components/_utils, and the _components/NotFound 404 pieces. Trigger keywords: "new route", "page.tsx", "layout.tsx", "App Router", "route group", "Next 16".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: web
  stack: nextjs-16,react-19,rsc,app-router
---

<Goal>

Add a new route (or route group) to `apps/web` using the Next.js 16 App Router,
keeping server components as the default, awaiting `Promise<...>` params, and
co-locating route-specific components.

</Goal>

<Scope>

- App: `apps/web`, under `src/app/`
- Route file types: `page.tsx`, `layout.tsx`, `loading.tsx` (optional),
  `not-found.tsx` (do NOT add top-level — use the existing route group)
- Full conventions: see `apps/web/AGENTS.md` (always loaded).
- Reference routes: `src/app/page.tsx`, `src/app/layout.tsx`,
  `src/app/global-not-found.tsx` (composes `src/app/_components/NotFound`).

</Scope>

<Steps>

1. **Create the route folder** under `src/app/`. Route groups use parenthesised
   names: `src/app/(<group>)/...` (e.g. `(auth)`, `(member)`). Dynamic segments
   use `[<param>]`.

2. **Add `page.tsx`** as an async server component. Props come from
   `@workspace/types/web` (`PageProps`), and `params` / `searchParams` are
   `Promise<...>` — always `await` them:
   ```tsx
   import type { PageProps } from '@workspace/types/web';

   export default async function MyPage({
     params,
     searchParams,
   }: PageProps<{ slug: string }>) {
     const { slug } = await params;
     const sp = await searchParams;
     // ...
   }
   ```
   (If you need a custom params shape, see `SingleParam` / `DinamicParams` /
   `Params` in `packages/types/src/web/layout.ts`.)

   Page chrome lives in a route-group `layout.tsx`, not the page, as a fixed
   app-shell frame: `Toolbar` (sm+) at the top and `BottomNav` (mobile) at the
   bottom. Each page (or a nested route-group layout) owns the `Screen` between
   them so it can choose `mode` (`flow` default / `full` / `snap`) and place its
   `Footer` explicitly. `Section` follows the parent Screen mode automatically:
   natural height in `flow`, full visible height in `full`, and full height plus
   snap points in `snap`.
   ```tsx
   // app/(app)/layout.tsx
   import { BottomNav, Toolbar, type NavigationVariant } from '@/components/Navigation';

   const navigationVariant: NavigationVariant = 'floating';

   <div className='flex h-svh flex-col overflow-hidden'>
     <Toolbar variant={navigationVariant} />
     {children}
     <BottomNav variant={navigationVariant} />
   </div>
   ```

   ```tsx
   // app/(app)/page.tsx — omit mode for normal flow
   import { Screen, Section } from '@/components';
   import { Footer } from '@/components/Footer';

   <Screen mode='snap' smooth hideScrollbar>
     <Section>{/* page content */}</Section>
     <Footer />
   </Screen>
   ```

3. **Add `layout.tsx`** when the route needs shared UI or data. Props are
   `LayoutProps` from `@workspace/types/web`:
   ```tsx
   import type { LayoutProps } from '@workspace/types/web';

   export default async function MyLayout({ children, params }: LayoutProps) {
     const { slug } = await params;
     return <section>{children}</section>;
   }
   ```

4. **Keep server components the default.** Only mark `'use client'` when you
   need browser APIs, hooks, context, or providers (see
   `src/components/Providers/*.tsx`).

5. **Co-locate route-specific pieces** in a private `_components/` folder (the
   underscore opts the folder out of routing), exported via an `index.ts`
   barrel:
   - `src/app/(app)/_components/` for pieces local to the main route group, OR
   - `src/app/<route>/_components/` for pieces local to a nested route.
   A component with parts becomes a folder (`index.tsx` + its parts, or a
   barrel `index.ts` grouping related components as in `components/Navigation/`);
   colocate `Skeleton.tsx`, a `'use server'`
   `actions.ts`, and `types.ts` in the same folder when needed. Non-component
   helpers (pagination, filtering) go in a route-local `_utils/` folder with its
   own `index.ts` barrel. Promote to `@workspace/ui` only when a second package
   consumes them.
   For page content, compose the shared layout primitives (`Center` / `VStack` /
   `HStack` / `Container`) from `@/components` instead of hand-writing flex
   utilities.

6. **404 handling**: do NOT add a top-level `not-found.tsx`.
   `src/app/global-not-found.tsx` renders its own HTML document and composes its
   layout inline (`<main>` + `Container`) with the shared `Heading` / `Text`
   primitives from `@/components` and the `BackHomeButton` from
   `src/app/_components/NotFound`. Extend the 404 document or those pieces if you
   need route-specific not-found UI.

7. **Import UI via subpaths**: `@workspace/ui/components/<name>`,
   `@workspace/ui/lib/utils` (for `cn`). Never deep-import via relative paths.

</Steps>

<Verify>

- `nps lint.web` — ESLint `--max-warnings 0`
- `nps typecheck.web` — `tsc --noEmit`
- `nps build.web` — `next build` (validates the route compiles)
- `nps dev.web` — `next dev` to smoke-test in the browser
- Add a test under `src/tests/` for any non-trivial page (see the
  `add-web-test` skill).

</Verify>

<AntiPatterns>

- Do NOT make `params` / `searchParams` synchronous — Next 16 + React 19 pass
  them as `Promise<...>`. Always `await`.
- Do NOT add a top-level `not-found.tsx` — extend the `_components/NotFound`
  pieces composed by `global-not-found.tsx` instead.
- Do NOT default to `'use client'` for pages/layouts — server components are
  the default; add the directive only when needed.
- Do NOT deep-import UI via relative paths — use the `@workspace/ui/*`
  subpaths.

</AntiPatterns>
