---
name: nextjs-rsc-streaming
description: Use when implementing React Server Component streaming in apps/web (Next.js 16 + React 19) — page-level Promise kickoff, Suspense boundaries with colocated *Skeleton fallbacks, use() in client components, redirect()/notFound() streamed through boundaries, and the loading.tsx-removal + top-loader pattern, plus streaming client sections that own mutating state (load more, pagination). FORESIGHT recipe: the starter does not currently use this; adopt when a page fetches data and you want progressive streaming. Trigger keywords: "RSC streaming", "Suspense", "use()", "Promise.all", "loading.tsx", "streaming", "React 19", "load more", "pagination".
license: MIT
compatibility: opencode
metadata:
  category: foresight
  package: web
  stack: nextjs-16,react-19,suspense,rsc-streaming
---

<Goal>

Stream a Next.js 16 page progressively: render the static frame immediately,
kick off data fetches as un-awaited Promises at the page level, and resolve
each inside its own `<Suspense>` boundary so the user sees content as soon as
each dependency settles — instead of waiting for the slowest request before
first paint.

</Goal>

<Context>

This skill is a **foresight recipe**. The starter (`apps/web`) does not
currently use RSC streaming — its data layer is client-side Redux Toolkit.
Adopt this pattern when a page needs to fetch server-side data (e.g. from an
API) and you want progressive rendering. It is fully compatible with the
existing Redux/Provider setup — streaming lives in server components, Redux
lives in client components.

The pattern is translated from a production Next 16 + React 19 codebase where
it is codified in `apps/web/AGENTS.md`.

</Context>

<Scope>

- App: `apps/web`, under `src/app/`
- Files touched: `page.tsx`, `layout.tsx`, route-local `components/*.tsx`,
  colocated `*Skeleton.tsx` fallbacks
- Server-component data fetches (Server Actions or async fetchers) live in
  `src/lib/` or `app/<route>/data.ts` — adapt to whatever data layer you add.

</Scope>

<Steps>

1. **At the page level, kick off fetches as Promises WITHOUT awaiting them.**
   Await only `params`, `searchParams`, and cheap per-request helpers
   (e.g. `getTranslations` if you add i18n):
   ```tsx
   export default async function Page({ params }: PageProps<{ slug: string }>) {
     const { slug } = await params;
     const dataPromise = loadData(slug);      // NOT awaited
     const metaPromise = loadMeta(slug);      // NOT awaited
     return (
       <PageContainer>
         <Suspense fallback={<DataSkeleton />}>
           <DataSection dataPromise={dataPromise} />
         </Suspense>
         <Suspense fallback={<MetaSkeleton />}>
           <MetaSection metaPromise={metaPromise} />
         </Suspense>
       </PageContainer>
     );
   }
   ```

2. **The consuming section (server component) awaits the promise INSIDE the
   boundary** — this is what makes it stream:
   ```tsx
   export async function DataSection({ dataPromise }: { dataPromise: Promise<Data> }) {
     const data = await dataPromise;
     if (!data) notFound();                   // streams through THIS boundary
     return <...>;
   }
   ```

3. **One `<Suspense>` per independent data dependency**, each with a colocated
   `*Skeleton` fallback. Keep static UI (card frames, headers, descriptions)
   OUTSIDE the boundary so it paints immediately; only the data-dependent body
   streams.

4. **Client components unwrap the SAME shared promise with React 19 `use()`**,
   inside their own `<Suspense>`:
   ```tsx
   'use client';
   import { use } from 'react';

   export function ClientSection({ promise }: { promise: Promise<X> }) {
     const x = use(promise);                  // suspends until resolved
     return <...>;
   }
   ```
   Wrap the consumer in `<Suspense fallback={<...Skeleton/>}>` at the call
   site. Never call `use()` conditionally — it must be at the top of the
   component.

5. **`redirect()` and `notFound()` fire INSIDE the consuming section**, not at
   the page level. This lets them stream through that boundary without aborting
   sibling boundaries.

6. **Chain promises to keep first paint fast.** Slow dependent fetches can be
   `.then()`-chained (still without page-level await):
   ```tsx
   const sectionsPromise = loadSections(slug);
   const lecturesPromise = sectionsPromise.then((s) => loadLectures(slug, s));
   ```
   Only the boundary that needs `lectures` waits on the chain.

7. **Drop `loading.tsx` and use a top loader instead.** Per-route
   `loading.tsx` files flash a full-page skeleton on every navigation. Replace
   with `nextjs-toploader` (nprogress-style bar) so the previous page stays on
   screen while the next RSC payload streams in:
   ```tsx
   // app/layout.tsx
   import NextTopLoader from 'nextjs-toploader';
   // ...
   <NextTopLoader />   // alongside <Toaster />
   ```
   Do NOT add `loading.tsx` files anywhere once you adopt this pattern.

8. **Session/auth streaming (only if you add auth).** Wrap the session lookup
   in React `cache()` for per-request dedupe, and split into a redirecting
   accessor (`requireSession()` that throws `redirect()`) and a non-redirecting
   one (`getSession()` that resolves to `null`). Layouts create the promise
   without awaiting and render a guard inside `<Suspense fallback={null}>` so
   the shell paints instantly and `redirect()` is delivered through the stream.
   (The starter has no auth today — skip until needed.)

9. **Graceful degradation.** Failed fetches should resolve to `null`/empty via
   a helper (e.g. `unwrapOrNull(promise)`) so one endpoint failure doesn't
   break the whole page — the affected boundary just renders its empty state.

10. **Stream client sections that also own mutating state.** When a streaming
    client component must also own mutating state (e.g. a "load more" button
    that appends rows, client-side pagination), split it into a **non-suspending
    shell** that holds the state and **suspending children** that call `use()`:
    ```tsx
    'use client';
    import { Suspense, use, useState } from 'react';

    export function ListShell({ dataPromise }: { dataPromise: Promise<Page<Item>> }) {
      const [extra, setExtra] = useState<Item[]>([]); // accumulation lives HERE
      return (
        <>
          <p>
            Showing{' '}
            <Suspense fallback={<CountChip />}>
              <Shown dataPromise={dataPromise} extra={extra} />
            </Suspense>{' '}
            items
          </p>
          <Suspense fallback={<TableSkeleton />}>
            <Table dataPromise={dataPromise} extra={extra} onAppend={setExtra} />
          </Suspense>
        </>
      );
    }

    function Shown({ dataPromise, extra }: { dataPromise: Promise<Page<Item>>; extra: Item[] }) {
      const first = use(dataPromise); // suspends until resolved
      return <>{first.data.length + extra.length}</>;
    }
    ```
    - The shell NEVER calls `use()` — it stays painted so labels and buttons
      remain visible while the children stream.
    - Multiple children MAY `use()` the SAME promise — React caches the result,
      so each child resolves together without re-fetching.
    - Hoist the mutating accumulation into the shell so the count and the list
      share one source of truth across mutations.
    - Each `<Suspense>` fallback should MIRROR the final layout (a count chip,
      a row skeleton) to avoid layout shift when the children resolve.

</Steps>

<Verify>

- `nps lint.web` + `nps typecheck.web`
- `nps build.web`
- `nps dev.web` — throttle the network in DevTools and confirm the static
  frame paints first, then each section fills in as its promise resolves
  (no full-page skeleton flash).
- Confirm `redirect()`/`notFound()` stream through the correct boundary
  without aborting siblings.
- For sections that own mutating state (load more, pagination), confirm the
  count and list stay in sync after a mutation — the accumulation must live in
  a non-suspending shell.

</Verify>

<AntiPatterns>

- Do NOT `await` data fetches at the page level — that blocks the whole page
  on the slowest request and defeats streaming.
- Do NOT put `notFound()`/`redirect()` at the page level — they belong inside
  the consuming section so they stream through that boundary.
- Do NOT add `loading.tsx` files alongside this pattern — they reintroduce the
  full-page skeleton flash. Use a top loader.
- Do NOT call `use()` conditionally or in loops — it's a hook-like primitive;
  call it unconditionally at the top of the client component.
- Do NOT create a `<Suspense>` without a colocated `*Skeleton` fallback —
  `fallback={null}` is acceptable only for invisible guards (e.g. session
  guards), not for user-visible content.
- Do NOT own mutating state (load-more accumulation, pagination) inside a client
  component that ALSO calls `use()` — it suspends and replaces the whole section
  (chrome included) with the fallback. Hoist the state into a non-suspending
  shell and push `use()` into children.

</AntiPatterns>
