## Types Package Guidelines

For general rules and build commands, see @AGENTS.md.

### Stack

- **Type-only package.** No runtime values, no validation, no React/Next code.
- Built with `tsc` (emits declaration + JS to `dist/`). Ignore `dist/` when
  editing — it is build output.

### Layout

```
src/
  web/
    index.ts    # barrel
    page.ts     # PageProps, SearchParams
    layout.ts   # LayoutProps, Params, SingleParam, DinamicParams
```

### Exports (keep in sync with package.json `exports`)

- `@workspace/types/web` → `./src/web/*` (Next.js App Router helper types)
- `@workspace/types` → root (reserved for future cross-package types)

### Conventions

- Add a shared type **only when a real cross-package boundary exists**. Keep
  app-local types in `apps/web`.
- Prefer `interface` for object contracts, `type` alias for unions/mapped
  types.
- Next.js App Router page/layout props come from
  `@workspace/types/web` (`PageProps`, `LayoutProps`). `params` and
  `searchParams` are `Promise<...>` per React 19 / Next 16 conventions — do not
  make them synchronous.
- Export through the nearest barrel, then the higher-level one.
- Don't import runtime packages here. The package may depend on
  `@workspace/constants` for typing constants but nothing framework-specific.

### Build & verify

- `nps lint.packages.types`
- `nps typecheck.packages.types`
- `nps build.packages.types`
