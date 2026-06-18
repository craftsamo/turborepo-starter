---
name: add-error-code
description: Use when adding a new ErrorCode to packages/constants, updating the ErrorMessage map, or adding a rate-limit tier. Covers the ErrorCode enum + ErrorMessage {log,notice} pairing rule, NodeErrorMessage, and rateLimitConfigs. Trigger keywords: "error code", "ErrorMessage", "rate limit config", "constants".
license: MIT
compatibility: opencode
metadata:
  category: implementation
  package: constants
  stack: tsup,typescript
---

<Goal>

Add a new runtime error contract or rate-limit tier to `packages/constants`
while keeping the package framework-free and every `ErrorCode` paired with its
`ErrorMessage`.

</Goal>

<Scope>

- Package: `packages/constants`
- Files:
  - `src/errors/code.ts` — `ErrorCode` numeric enum
  - `src/errors/message.ts` — `ErrorMessage` map + `NodeErrorMessage` map
  - `src/errors/index.ts` — barrel (re-exports `./code` + `./message`)
  - `src/ratelimitConfigs.ts` — `RateLimitConfig` interface + `rateLimitConfigs`
  - `src/index.ts` — root barrel (`export * from './errors'; export * from './ratelimitConfigs'`)
- Full conventions: see `packages/constants/AGENTS.md` (always loaded).

</Scope>

<Steps>

### Case A: New ErrorCode

1. **Append to the enum** in `src/errors/code.ts`. Numeric values are
   auto-assigned — **never renumber existing codes**; append at the end of the
   relevant domain group. Add a comment header for a new domain group:
   ```ts
   export enum ErrorCode {
     // General
     General = 0,
     InvalidBody,
     // Auth
     Unauthorized = 100,
     ...
   }
   ```
2. **Add the matching ErrorMessage** in `src/errors/message.ts`. An orphan
   code or message is a bug — `ErrorMessage: Record<ErrorCode, ErrorMessage>`
   must cover every code:
   ```ts
   const Unauthorized = {
     log: '...',
     notice: '...',
   } as const;

   export const ErrorMessage: Record<ErrorCode, ErrorMessage> = {
     ...,
     [ErrorCode.Unauthorized]: Unauthorized,
   } as const;
   ```
3. **`ErrorMessage` shape**: `{ log: string; notice: string } as const`.
   - `log` — diagnostic text for server logs (detailed, implementation-facing).
   - `notice` — user-safe text shown in the UI (generic, no internals).
4. The barrel `src/errors/index.ts` already re-exports `./code` + `./message`;
   no change needed unless you add a new file.

### Case B: Non-ErrorCode runtime error

- Add to `NodeErrorMessage: Record<'NodeError' | 'UnknownError', ErrorMessage>`
  in `src/errors/message.ts`. Keep it separate from `ErrorMessage` — it holds
  errors that aren't part of the `ErrorCode` enum (e.g. generic Node failures).

### Case C: New rate-limit tier

1. Add a named tier to `rateLimitConfigs` in `src/ratelimitConfigs.ts`:
   ```ts
   export const rateLimitConfigs = {
     strict: { windowMs: 60_000, maxRequests: 10 },
     ...,
     // new tier
     upload: { windowMs: 60_000, maxRequests: 5, skipSuccessfulRequests: true },
   } as const;
   ```
2. Each entry must match `RateLimitConfig { windowMs, maxRequests,
   skipSuccessfulRequests?, skipFailedRequests? }`. Use `as const` for narrow
   literal types.

### Case D: Export-only

- Export through the nearest barrel (`errors/index.ts`, then `src/index.ts`).
- Import from `@workspace/constants` (the root), not deep paths.
- Don't duplicate these constants in `apps/web`; import them.

</Steps>

<Verify>

- `nps lint.packages.constants` — ESLint `--max-warnings 0`
- `nps typecheck.packages.constants` — `tsc --noEmit`
- `nps build.packages.constants` — `tsup` build
- Cross-check: `Object.keys(ErrorMessage)` length === `Object.keys(ErrorCode)`
  length (no orphans).

</Verify>

<AntiPatterns>

- Do NOT renumber existing `ErrorCode` values — they are part of the wire
  contract; appending only.
- Do NOT add an `ErrorCode` without its `ErrorMessage` (or vice versa).
- Do NOT import React/Next/framework code here — runtime constants only.
- Do NOT duplicate these constants in `apps/web`.

</AntiPatterns>
