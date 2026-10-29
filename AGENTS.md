# AGENTS

This is a monorepo with TypeScript, Turbo, and pnpm workspaces.

## General Rules

1. **Session title**: begin with verb (e.g., `Add ...`, `Fix ...`), max 30 chars
2. **Language**: respond in user's language

## Instruction Files

`AGENTS.md` is the only instruction source. OpenCode V2 loads the root file
at session start and each nested `AGENTS.md` (`apps/web`, `packages/*`) when a
file under that directory is read. Do not add an `instructions` array to
`opencode.jsonc`: V2 accepts it but does not resolve it, and a glob such as
`packages/**/AGENTS.md` would also traverse workspace symlinks under
`packages/*/node_modules/@workspace/*` in tools that do resolve it.

Do not add a `CLAUDE.md` or `CLAUDE.local.md`. Claude Code (v2.1.277+) reads
`AGENTS.md` directly, but only while no `CLAUDE.md` exists in the working
directory or any parent.

## Skill Routing

When asked to update this fork from the repository configured as the `upstream`
Git remote, load and follow the `sync-upstream` skill before running Git
commands. Match the user's intent, including requests to incorporate the parent
repository's latest changes, bring the fork up to date, rebase the fork onto
`upstream/main`, or resolve conflicts caused by that operation.

Do not use `sync-upstream` for ordinary feature-branch rebases, unrelated merge
conflicts, or deciding which fork layer should own a change. Use
`fork-layer-placement` for the ownership decision. The words "rebase", "merge
conflict", or "fork" alone are not sufficient to trigger `sync-upstream`.

## Agent Routing

`pnpm install` runs `repo-kit agents sync`, which installs repo-kit's shared
subagents in `.opencode/agents/` and their tool-native definitions (Claude
Code, Codex CLI, Gemini CLI, Copilot CLI, Grok Build), along with its shared
skills. The generated files are not committed; a file of the same name without
repo-kit's generated marker replaces the shared one.

Use `reviewer` for a broad read-only scan of a change before commit or PR:
project conventions, AGENTS.md violations, obvious bugs, missing tests, and
low-cost regressions. Use `reviewer-deep` only on the high-risk areas that
`reviewer` (or you) flag — system assumptions, responsibility ownership,
runtime regressions, subtle edge cases — never as the first pass over a whole
diff.

Use `verifier` to run tests, typechecks, lint, format checks, and builds, and
to summarize failure logs into the first actionable errors.

All three agents are read-only. Do not use them to edit files, design fixes,
or make decisions — apply fixes yourself after they report. Do not route
root-cause debugging to `verifier`; it only runs checks and summarizes.

## Build, Lint, Test Commands

Use `nps` (npm-script-runner) for all commands. See `package-scripts.js` for
full options.

- **Build**: `nps build` (all), `nps build.web` (web app), `nps build.packages`
- **Lint**: `nps lint` (all), `nps lint.web`, `nps lint.packages` (or
  `nps lint.packages.ui`)
- **Format**: `nps format` (all), `nps format.web`, `nps format.packages`
- **Typecheck**: `nps typecheck` (all), `nps typecheck.web`,
  `nps typecheck.packages` (or `nps typecheck.packages.ui`)
- **Test**: `nps test` (parallel workspace unit/component),
  `nps test.web.unit`, `nps test.e2e` (parallel workspace E2E),
  `nps test.web.e2e.[desktop|tablet|mobile|all]`, `nps test.web.live`,
  `nps test.watch`
- **Dev**: `nps dev` (all), `nps dev.web`
- **Single test**: `cd apps/web && pnpm test -- path/to/test.test.tsx`
- **VRT baselines**: `nps vrt.accept` (copy the ones CI rendered for this
  commit), `nps vrt.update` (render them locally in Docker)
- **Release**: the Release Drafter workflow drafts the next release with
  repo-kit, and changes collect in the draft until it is published;
  `nps "release.draft --dry-run"` previews the draft. Publishing stays a
  manual step: `nps release.publish` (or the Publish Release workflow) sets
  the root version on `main` to the draft's and publishes the draft on that
  commit; `nps release.sync` sets the version alone. See
  `docs/github-actions/release-drafter.md`

Workspace apps participate by defining `test`, `test:ci`, and `test:e2e`
package scripts. E2E tasks run concurrently, so each app must isolate ports,
databases, temporary files, and external services. Keep side-effecting external
checks in an opt-in `test:live` script; never include live tests in default or
required CI commands.

## Test Layer Responsibilities

Each test layer owns a distinct failure class; put every assertion in the layer
that can actually observe the failure it guards against:

- **Vitest (jsdom)** — semantics and behavior only: roles, ARIA, copy,
  interactions, reducers. jsdom computes no CSS layout, so these tests must
  never claim layout or visual correctness.
- **Playwright geometry invariants** (`e2e/layout.spec.ts` + the
  `@workspace/playwright` helpers) — layout contracts measured in real
  Chromium: no horizontal overflow, exactly one primary nav per viewport,
  Screen-owned scrolling, chrome never covering content, full/snap sections
  filling the screen.
- **Playwright VRT** (`e2e/vrt.spec.ts`) — pixel comparison against committed
  baselines per route x viewport x color scheme. Baselines render on Linux
  (CI) only; when screenshots change, CI uploads the new ones and
  `nps vrt.accept` copies them into the branch for review. `nps vrt.update`
  renders them locally in the same Playwright Docker image instead.

**Definition of done**: a change touching layout, chrome, breakpoints, or
theming is not covered until a geometry invariant and/or VRT shot exercises
it — passing functional tests alone prove nothing about layout. Follow the
`add-e2e-test` skill when adding routes or browser apps. Per-subject
assertion placement (component / page / slice / flow → which layer asserts
what) is detailed in the `add-web-test` and `add-e2e-test` skills.

## App- and Package-specific Guidelines

For app- and package-specific guidelines, see @apps/web/AGENTS.md and
@packages/\*/AGENTS.md.
