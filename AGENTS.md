# AGENTS

This is a monorepo with TypeScript, Turbo, and Yarn workspaces.

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
- **Test**: `nps test` (all), `nps test.web` (web app tests), `nps test.watch`
- **Single test**: `cd apps/web && yarn test -- path/to/test.test.tsx`

## Code Style

For detailed code style guidelines (TypeScript/React, naming conventions, error
handling) and three-tier component architecture, see
@docs/instructions/CODE_STYLE.md

## Language Localization

For language localization guidelines and how to preserve proper nouns and
technical identifiers, see
technical identifiers, see @docs/instructions/LANGUAGE_LOCALIZATION.md

## App-specific Guidelines

For Web app specific guidelines and testing locations, see @apps/web/AGENTS.md
