# AGENTS

This is a monorepo with TypeScript, Turbo, and pnpm workspaces.

## General Rules

1. **Session title**: begin with verb (e.g., `Add ...`, `Fix ...`), max 30 chars
2. **Language**: respond in user's language

## Build, Lint, Test Commands

Use `nps` (npm-script-runner) for all commands. See `package-scripts.js` for
full options.

- **Build**: `nps build` (all), `nps build.web` (web app), `nps build.packages`
- **Lint**: `nps lint` (all), `nps lint.web`, `nps lint.packages` (or
  `nps lint.packages.ui`)
- **Format**: `nps format` (all), `nps format.web`, `nps format.packages`
- **Typecheck**: `nps typecheck` (all), `nps typecheck.web`,
  `nps typecheck.packages` (or `nps typecheck.packages.ui`)
- **Test**: `nps test` (all), `nps test.web` (web app tests), `nps test.watch`
- **Dev**: `nps dev` (all), `nps dev.web`
- **Single test**: `cd apps/web && pnpm test -- path/to/test.test.tsx`

## App- and Package-specific Guidelines

For app- and package-specific guidelines, see @apps/web/AGENTS.md and
@packages/*/AGENTS.md.
