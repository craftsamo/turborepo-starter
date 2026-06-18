---
name: add-shared-type
description: Use when adding a cross-package type to packages/types (e.g. a new Next.js App Router helper type, or a shared contract consumed by both apps/web and a future package). Covers the type-only package rules, ./web subpath exports, and PageProps/LayoutProps conventions. Trigger keywords: "shared type", "PageProps", "LayoutProps", "SearchParams", "@workspace/types/web".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: types
  stack: typescript,tsc
---

<Goal>

Add a shared TypeScript type to `packages/types` that crosses a real package
boundary, while keeping the package type-only and free of runtime/framework
code.

</Goal>

<Scope>

- Package: `packages/types`
- Files:
  - `src/web/page.ts` — `PageProps`, `SearchParams`
  - `src/web/layout.ts` — `LayoutProps`, `Params`, `SingleParam`, `DinamicParams`
  - `src/web/index.ts` — barrel (`export * from './page'; export * from './layout'`)
- Exports (keep in sync with `package.json`):
  - `@workspace/types/web` → `./src/web/*`
  - `@workspace/types` → root (reserved for future cross-package types)
- Full conventions: see `packages/types/AGENTS.md` (always loaded).
- Keep **app-local** types in `apps/web/src/types/`. Promote here only when a
  real cross-package boundary exists.

</Scope>

<Steps>

1. **Decide if it belongs here.** Add a shared type ONLY when:
   - It is consumed by `apps/web` AND at least one other package, OR
   - It documents a Next.js App Router contract shared across packages.
   Otherwise keep it in `apps/web/src/types/`.

2. **Pick `interface` vs `type`**:
   - `interface` for object contracts (props, options, configs).
   - `type` alias for unions, mapped types, utility types.

3. **For a Next.js App Router page/layout helper** (the current surface),
   follow `src/web/page.ts` / `src/web/layout.ts`:
   - `params` and `searchParams` are `Promise<...>` per React 19 / Next 16 —
     do NOT make them synchronous.
   - `SearchParams = Promise<{ [key: string]: string | string[] | undefined }>`
   - `PageProps = Omit<LayoutProps, 'children'> & { searchParams: SearchParams }`
   - Use `import type` for any imports (this is a type-only package).

4. **Add the type** in the appropriate `src/web/<file>.ts`, then re-export via
   `src/web/index.ts` if not already covered by `export *`.

5. **Don't import runtime packages here.** The package may depend on
   `@workspace/constants` for typing constants but nothing framework-specific.

6. **Ignore `dist/`** — it is `tsc` build output. Edit source in `src/` only.

</Steps>

<Verify>

- `nps lint.packages.types` — ESLint `--ext .ts --max-warnings 0`
- `nps typecheck.packages.types` — `tsc --noEmit`
- `nps build.packages.types` — `tsc -p tsconfig.json` (emits `dist/`)
- Consume from `apps/web`: `import type { PageProps } from '@workspace/types/web'`

</Verify>

<AntiPatterns>

- Do NOT add runtime values, validation, or React/Next code — type-only.
- Do NOT make `params` / `searchParams` synchronous — Next 16 + React 19
  require `Promise<...>`.
- Do NOT add a type here that only `apps/web` uses — keep it app-local.
- Do NOT import framework packages here (React, Next, Radix, ...). Only
  `@workspace/constants` for constant typing is allowed.
- Do NOT edit `dist/` — it is build output.

</AntiPatterns>
