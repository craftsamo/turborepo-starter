---
name: add-ui-component
description: Use when adding a new shared React primitive (component, hook, or utility) to packages/ui. Covers shadcn "new-york" style, Radix primitives, CVA variants, Tailwind v4, and subpath exports. Trigger keywords: "add component", "new ui primitive", "shadcn add", "Radix", "CVA variant".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: ui
  stack: shadcn,radix,cva,tailwind-v4,lucide,next-themes,sonner
---

<Goal>

Add a reusable React primitive to `packages/ui` that `apps/web` (and future
packages) can import via subpath exports. The result must be RSC-safe by
default, follow shadcn "new-york" conventions, and export through the existing
subpath scheme.

</Goal>

<Scope>

- Package: `packages/ui`
- Files touched: `src/components/<name>.tsx`, `src/hooks/<name>.ts`, or
  `src/lib/<name>.ts`
- DO NOT add route-specific UI here — keep that in `apps/web`. Promote to this
  package only when a second consumer appears.
- Full conventions: see `packages/ui/AGENTS.md` (always loaded).

</Scope>

<Steps>

1. **Pick the right folder** by kind:
   - Visual primitive (Button, Dialog, ...) → `src/components/<name>.tsx`
   - Hook (`useIsMobile`, ...) → `src/hooks/<name>.ts`
   - Pure utility (`cn`, formatters) → `src/lib/<name>.ts`

2. **Prefer the shadcn CLI** when the component exists in the registry:
   ```
   cd apps/web && pnpm dlx shadcn@latest add <component>
   ```
   This writes the file into `packages/ui/src/components/` (per
   `apps/web/components.json`) and wires the subpath export automatically.

3. **For a hand-written primitive**, mirror the existing pattern in
   `src/components/button.tsx`:
   - `import { cva, type VariantProps } from 'class-variance-authority'`
   - `import { Slot } from '@radix-ui/react-slot'` when polymorphism is needed
   - `import { cn } from '@workspace/ui/lib/utils'`
   - Define `const <name>Variants = cva(...)` with `variants` + `defaultVariants`
   - Type props as `React.ComponentProps<'tag'> & VariantProps<typeof <name>Variants> & { asChild?: boolean }`
   - Add `data-slot='<name>'` to the root element
   - Use `const Comp = asChild ? Slot : 'tag'`
   - `export { <Name>, <name>Variants }` (named exports, matching `button.tsx`)

4. **Mark `'use client'` only when the component** needs browser APIs, React
   context, hooks, or `next-themes`/`sonner` (see `src/components/sonner.tsx`
   for the client pattern). Keep primitives server-component-safe by default.

5. **No barrel update needed** — subpath exports use file globs:
   - `@workspace/ui/components/*` → `./src/components/*.tsx`
   - `@workspace/ui/hooks/*` → `./src/hooks/*.ts`
   - `@workspace/ui/lib/*` → `./src/lib/*.ts`
   Just create the file; the export resolves automatically.

6. **Accessibility**: lean on Radix semantics, keyboard support, focus
   management, and `aria-*` where Radix doesn't cover it.

</Steps>

<Verify>

- `nps lint.packages.ui` — ESLint with `--max-warnings 0`
- `nps typecheck.packages.ui` — `tsc --noEmit`
- `nps build.web` — end-to-end transpile via `next-transpile-modules`
  (this package has no `build` script of its own)
- Consume it from `apps/web`: `import { <Name> } from '@workspace/ui/components/<name>'`

</Verify>

<AntiPatterns>

- Do NOT deep-import via relative paths from `apps/web` (e.g.
  `../../packages/ui/src/components/button`). Always use the subpath.
- Do NOT add `'use client'` to primitives that don't need it — it forces the
  whole subtree into the client bundle.
- Do NOT pre-abstract a component that has only one consumer. Keep it in
  `apps/web` until a second package needs it.
- Do NOT add comments unless the logic is non-obvious (repo convention).

</AntiPatterns>
