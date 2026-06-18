## UI Package Guidelines

For general rules and build commands, see @AGENTS.md.

### Stack

- **shadcn "new-york"** style on **Radix primitives** + **class-variance-authority** + **Tailwind v4**.
- `lucide-react` icons, `next-themes` for theming, `sonner` for toasts, `framer-motion` for animation.
- Consumers: `apps/web` (Next.js 16, App Router, RSC-ready).

### Layout

```
src/
  components/   # shared React primitives (*.tsx)
  hooks/        # shared hooks (*.ts)
  lib/          # utilities (cn lives in lib/utils.ts)
  styles/       # globals.css (the single Tailwind v4 entry)
```

### Exports (subpath imports — keep these in sync with package.json `exports`)

- `@workspace/ui/components/*` → `./src/components/*.tsx`
- `@workspace/ui/hooks/*` → `./src/hooks/*.ts`
- `@workspace/ui/lib/*` → `./src/lib/*.ts`
- `@workspace/ui/globals.css` → `./src/styles/globals.css`
- `@workspace/ui/postcss.config` → `./postcss.config.mjs`

Always import via these subpaths; never deep-import via relative paths from
`apps/web`.

### Conventions

- Compose with `cn` from `@workspace/ui/lib/utils` (`twMerge` + `clsx`).
- Variants via `cva`; type them with `VariantProps<typeof variants>`.
- `asChild` + `Slot.Root` for polymorphic composition; add `data-slot` to the
  root element for styling hooks.
- `'use client'` only when the component needs browser APIs / context / hooks.
  Keep primitives server-component-safe by default.
- Accessibility: lean on Radix semantics, keyboard support, focus management,
  and `aria-*` where Radix doesn't cover it.
- Keep route-specific UI in `apps/web`; this package is for reusable primitives
  only. Don't pre-abstract — extract only when a second consumer appears.

### Build & verify

`@workspace/ui` has no `build` script (it is transpiled by `apps/web` via
`next-transpile-modules`). Verify with:

- `nps lint.packages.ui`
- `nps typecheck.packages.ui`
- `nps build.web` (transpiles the package end-to-end)
