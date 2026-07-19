## Constants Package Guidelines

For general rules and build commands, see @AGENTS.md.

### Stack

- Runtime constants only. **No React, no Next.js, no framework deps.**
- Built with `tsup`; consumed by `apps/web` (and future packages).

### Layout

```
src/
  errors/
    code.ts        # ErrorCode enum (numeric, grouped by domain)
    message.ts     # ErrorMessage map + NodeErrorMessage map
    index.ts       # barrel
  ratelimitConfigs.ts
  index.ts         # root barrel
```

### Conventions

- **Every `ErrorCode` must be paired with an `ErrorMessage`** in
  `ErrorMessage: Record<ErrorCode, ErrorMessage>`. An orphan code or message is
  a bug.
- `ErrorMessage` shape: `{ log: Message; notice: Message } as const`, where
  `Message` is `Record<Language, string>`.
  - `log` — diagnostic text for server logs (detailed, implementation-facing).
  - `notice` — user-safe text shown in the UI (generic, no internals).
  - Select the active `Language` before passing either value to a logger or UI.
- `ErrorCode` is a numeric `enum`. **Never renumber existing codes**; append
  new ones at the end of their domain group. Group codes by domain with a
  comment header.
- `NodeErrorMessage` holds non-`ErrorCode` runtime errors
  (`'NodeError' | 'UnknownError'`); keep it separate from `ErrorMessage`.
- `rateLimitConfigs` is `as const` with named tiers
  (`strict` / `normal` / `loose` / `api`). Each entry matches
  `RateLimitConfig { windowMs, maxRequests, skipSuccessfulRequests?, skipFailedRequests? }`.
- Use `as const` for narrow literal types everywhere applicable.
- Export through the nearest barrel (`errors/index.ts`, then `src/index.ts`).
  Import from `@workspace/constants` (the root), not deep paths.
- Don't duplicate these constants in `apps/web`; import them.

### Build & verify

- `nps lint.packages.constants`
- `nps typecheck.packages.constants`
- `nps build.packages.constants`
