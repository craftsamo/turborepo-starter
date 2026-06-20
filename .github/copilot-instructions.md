# Copilot instructions

The authoritative, always-on guidance for this repository lives in `AGENTS.md`
files (the open agent-instructions standard). Read and follow the closest one to
the code you are changing before making edits.

## What to read

- **Root**: `AGENTS.md` — monorepo overview, build/lint/test commands (run via
  `nps`), and general rules.
- **App / package scoped** (apply the closest one to the files you edit):
  - `apps/web/AGENTS.md`
  - `packages/ui/AGENTS.md`
  - `packages/types/AGENTS.md`
  - `packages/constants/AGENTS.md`
- **Workflows / processes**: `docs/instructions/**/*.md`.

Nested `AGENTS.md` files refine the root — the closer the file, the higher its
priority.

## Agent skills

Reusable, on-demand workflows are shared under `.agents/skills/` (and mirrored to
`.claude/skills/`). They are symlinks to the canonical `.opencode/skills/`. Use
the relevant `SKILL.md` when your task matches its description.
