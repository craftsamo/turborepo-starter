---
name: edit-middleware
description: |-
  Use when adding or editing Next.js middleware in apps/web (rate limiting, auth, proxy/rewrite). Covers the chain() composition in proxy.ts, the NextProxyFactory pattern, ratelimit.ts, the config matcher, and registering factories in top-to-bottom execution order. Trigger keywords: "middleware", "NextProxy", "chain", "proxy.ts", "rate limit", "ratelimit".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: web
  stack: nextjs-16,middleware,next-server
---

<Goal>

Add or modify a middleware in `apps/web` and wire it into the composed
`chain([...])` in `proxy.ts`, preserving the `(proxy: NextProxy) => NextProxy`
factory convention and top-to-bottom execution order.

</Goal>

<Scope>

- App: `apps/web`
- Files:
  - `src/middlewares/<name>.ts` — new middleware factory (create this)
  - `src/middlewares/index.ts` — barrel (`export * from './<name>'`)
  - `src/proxy.ts` — `chain([...])` registration + `config` matcher
- Reference: `src/middlewares/ratelimit.ts` (the canonical factory).
- Full conventions: see `apps/web/AGENTS.md` (always loaded).

</Scope>

<Steps>

1. **Create the middleware factory** in `src/middlewares/<name>.ts`. A factory
   is `(proxy: NextProxy) => NextProxy` — it wraps the next middleware and
   returns a new one. Mirror `ratelimit.ts:137-179`:
   ```ts
   import { type NextFetchEvent, type NextProxy, type NextRequest, NextResponse } from 'next/server';

   export function <name>(proxy: NextProxy, /* options */): NextProxy {
     return async (request: NextRequest, event: NextFetchEvent) => {
       // pre-processing
       const response = await proxy(request, event); // call next in chain
       // post-processing (e.g. set headers)
       return response;
     };
   }
   ```
2. **Export from the barrel** in `src/middlewares/index.ts`:
   ```ts
   export * from './<name>';
   ```
3. **Register in `proxy.ts`** `chain([...])` array. Order is top-to-bottom —
   the first factory is the outermost wrapper (runs first on the way in, last
   on the way out):
   ```ts
   import { ratelimit, <name> } from './middlewares';

   export default chain([
     ratelimit,
     <name>,
     // ...Add middleware here (executed in order from top to bottom)
   ]);
   ```
   `ratelimit` is commented out by default — uncomment when you actually want
   it.
4. **The `config.matcher`** in `proxy.ts:13-27` already excludes
   `_next/static`, `_next/image`, favicons, etc. Extend it only if your
   middleware needs a different match set.
5. **Import shared constants from `@workspace/constants`** (e.g.
   `rateLimitConfigs`, `RateLimitConfig`) — never duplicate them locally.
   `ratelimit.ts:3` shows the import.

</Steps>

<Verify>

- `nps lint.web` — ESLint `--max-warnings 0`
- `nps typecheck.web` — `tsc --noEmit`
- `nps build.web` — `next build`
- `nps dev.web` — exercise the route path in the browser; check headers (e.g.
  `X-RateLimit-Remaining`) and 429 behavior if rate-limiting.

</Verify>

<AntiPatterns>

- Do NOT write a raw `NextMiddleware` that ignores `chain()` — every
  middleware must be a `(proxy: NextProxy) => NextProxy` factory so composition
  works.
- Do NOT forget to `await proxy(request, event)` inside the factory — that's
  how the chain advances. Skipping it short-circuits downstream middleware.
- Do NOT duplicate `rateLimitConfigs` / `RateLimitConfig` in `apps/web` —
  import from `@workspace/constants`.
- Do NOT edit `config.matcher` casually — it already excludes static assets;
  wrong exclusions can break the app.

</AntiPatterns>
