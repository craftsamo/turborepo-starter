# AGENTS

This is a monorepo with TypeScript, Turbo, and pnpm workspaces.

## General Rules

1. **Session title**: begin with verb (e.g., `Add ...`, `Fix ...`), max 30 chars
2. **Language**: respond in user's language

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

Workspace apps participate by defining `test`, `test:ci`, and `test:e2e`
package scripts. E2E tasks run concurrently, so each app must isolate ports,
databases, temporary files, and external services. Keep side-effecting external
checks in an opt-in `test:live` script; never include live tests in default or
required CI commands.

## App- and Package-specific Guidelines

For app- and package-specific guidelines, see @apps/web/AGENTS.md and
@packages/\*/AGENTS.md.
