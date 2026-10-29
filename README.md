# Welcome to the Turborepo Starter!

This project serves as a boilerplate for efficiently developing applications
using Turborepo, equipped with various best practices and carefully selected
configurations.

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Set Environment Variables](#-set-environment-variables)
- [Available Commands](#-available-commands)
- [GitHub Actions Workflows](#-github-actions-workflows)

## ✨ Features

- **Monorepo Setup**: Turborepo with pnpm workspaces for scalable project
  organization
- **TypeScript**: Native TypeScript 7 type checking with a TypeScript 6 API
  compatibility layer for ecosystem tooling
- **Next.js Integration**: Ready-to-use web app with App Router
- **Component Library**: Shared UI components built with Shadcn/ui and Tailwind
  CSS
- **Code Quality**: ESLint, Prettier, and Husky for consistent code standards
- **Testing**: Vitest setup for unit and integration tests
- **Git Workflow**: Commitizen and Commitlint for conventional commits
- **AI Agent Skills**: on-demand skills in `.opencode/skills/`, shared across
  Claude Code, Codex, Gemini CLI, Copilot, and Grok Build. On `pnpm install`,
  [repo-kit](https://github.com/craftsamo/repo-kit) adds its shared skills and
  subagents and links them for each tool (`.agents/skills/`, `.claude/skills/`,
  `.grok/agents/` and the like); per-package `AGENTS.md` is auto-loaded as
  instructions
- **Best Practices**: Optimized configurations and development guidelines

## 🛠 Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build) with pnpm Workspaces
- **Runtime**: Node.js 24+
- **Language**: TypeScript 7
- **Framework**: [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- **UI Library**: React with Shadcn/ui components
- **State**: Redux Toolkit + react-redux
- **Theming**: next-themes
- **Toasts**: sonner (via `@workspace/ui`)
- **Styling**: Tailwind CSS and PostCSS
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier
- **Git Hooks**: Husky with conventional commits

## 📁 Project Structure

```
turborepo-starter/
├── apps/
│   └── web/               # Next.js web application
├── packages/
│   ├── constants/         # Shared constants and error codes
│   ├── eslint/            # Shared ESLint configurations
│   ├── prettier/          # Shared Prettier configuration
│   ├── tsconfig/          # TypeScript configurations
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared UI components (Shadcn/ui)
│   └── vitest/            # Shared Vitest configuration
├── docs/
│   ├── github-actions/    # GitHub Actions workflow documentation
│   └── instructions/      # GitHub-workflow guidelines for AI agents (GENERAL/ISSUE/TASK/REVIEW)
├── .opencode/             # opencode skills and agent config
├── .github/               # GitHub Actions workflows
└── .husky/                # Git hooks configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 24.0 or higher (`.node-version` selects it in mise, fnm and nodenv)
- pnpm 11.5.3 or higher (via Corepack)
- GitHub CLI (`gh`), authenticated as a repository administrator

### Installation

1. **Clone the repository**

```sh
git clone https://github.com/craftsamo/turborepo-starter.git
cd turborepo-starter
```

2. **Install Dependencies**

```sh
corepack enable
pnpm install
pnpm add -g nps
```

3. **Initialize the project**

Replace the starter metadata and choose how the derived project is licensed:

```sh
nps setup.project
```

The default private/commercial profile marks the project as `UNLICENSED`,
replaces the root license with an all-rights-reserved notice, and preserves the
starter's MIT license under `LICENSES/`. See
[Project Setup](docs/setup-project.md) for dry-run and non-interactive usage.

4. **Configure GitHub**

Preview and apply the starter's repository settings, Actions permissions,
security features, labels, and `main` protection:

```sh
nps "setup.github --dry-run --defaults"
nps setup.github
```

See [GitHub Repository Setup](docs/github-actions/setup-github.md) for
non-interactive setup and secret management.

5. **Configure local environment**

Copy the example env file and fill in the values you need for local
development:

```sh
cp apps/web/.env.example apps/web/.env   # WEB_BASE_URL, LOG_LEVEL (optional)
```

6. **Run Development Server**

```sh
nps dev
```

## ⚙️ Set Environment Variables

### Local Development

The web app reads runtime configuration from `apps/web/.env`. See
`apps/web/.env.example` for the full list:

| Variable       | Purpose                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `WEB_BASE_URL` | Base URL used for absolute links, sitemap, robots, and API calls                                      |
| `LOG_LEVEL`    | Logger verbosity: `verbose` / `debug` / `info` / `log` / `warn` / `error` / `fatal` (default: `info`) |

An app-specific variable is prefixed with the app directory name, so each app
under `apps/` gets its own value (`WEB_BASE_URL`, and `<APP>_BASE_URL` for any
app added later). A variable whose value is meant to be shared across apps,
such as `LOG_LEVEL`, keeps its bare name.

### GitHub Actions Variables

The OpenCode workflow (`/oc` comments) runs on free models with no setup.
Configure these optional variables through `nps setup.github` or under
**Settings > Secrets and variables > Variables** to choose other models:

| Variable                | Default                |
| ----------------------- | ---------------------- |
| `OPENCODE_MODEL`        | repo-kit's free models |
| `OPENCODE_MODEL_PLAN`   | `OPENCODE_MODEL`       |
| `OPENCODE_MODEL_BUILD`  | `OPENCODE_MODEL`       |
| `OPENCODE_MODEL_REVIEW` | `OPENCODE_MODEL`       |
| `OPENCODE_MODEL_DEBUG`  | `OPENCODE_MODEL`       |

Values are `provider/model` or `provider/model#variant`, optionally
comma-separated, for example `anthropic/claude-sonnet-5-5#high`.

### GitHub Actions Secrets

To use a provider's models, run `nps setup.github.secrets` or add its API key
as a Repository secret under **Settings > Secrets and variables > Secrets**:

| Secret               | Provider                              |
| -------------------- | ------------------------------------- |
| `OPENCODE_API_KEY`   | OpenCode Zen (paid models) and Go     |
| `OPENAI_API_KEY`     | OpenAI                                |
| `ANTHROPIC_API_KEY`  | Anthropic (a key from Claude Console) |
| `OPENROUTER_API_KEY` | OpenRouter                            |

For details, see [Run AI Agent Workflow](docs/github-actions/run-ai-agent.md).

## 📦 Available Commands

Commands are run with [`nps`](https://github.com/seblepouls/nps)
(npm-script-runner). See [package-scripts.js](package-scripts.js) for the full
list.

| Command                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| `nps dev`                  | Start the web dev server (Turborepo dev)    |
| `nps build`                | Build all apps and packages                 |
| `nps build.web`            | Build only the web app                      |
| `nps build.packages`       | Build shared packages (constants, types)    |
| `nps lint`                 | Lint all apps and packages                  |
| `nps lint.web`             | Lint only the web app                       |
| `nps format`               | Format all apps and packages                |
| `nps typecheck`            | Type-check all apps and packages            |
| `nps test`                 | Run repository and workspace unit tests     |
| `nps test.web.unit`        | Run web unit/component tests                |
| `nps test.e2e`             | Run all workspace E2E tasks                 |
| `nps test.web.e2e.all`     | Run web E2E tests at every viewport         |
| `nps test.web.live`        | Run web E2E tests against an external URL   |
| `nps test.watch`           | Run web app tests in watch mode             |
| `nps setup.project`        | Initialize project metadata and licensing   |
| `nps setup.github`         | Configure GitHub repository settings        |
| `nps setup.github.secrets` | Configure Repository or Environment secrets |
| `nps release.draft`        | Draft the next release (`--dry-run` to see) |
| `nps release.publish`      | Publish the draft on its version commit     |
| `nps release.sync`         | Set the root version on main to the draft's |
| `nps docker.build.web`     | Build the web Docker image                  |
| `nps docker.start.web`     | Start the web container via docker-compose  |
| `nps start`                | Start the built web app in production mode  |

> Single test file: `cd apps/web && pnpm test -- path/to/test.test.tsx`

Workspace apps join the parallel test orchestration by defining `test` for
unit/component tests and `test:e2e` for E2E tests. Live tests are opt-in and
app-scoped because they may access external services. For example:

```sh
PLAYWRIGHT_BASE_URL=https://staging.example.com nps test.web.live
```

## 🔄 GitHub Actions Workflows

This project includes automated workflows for code quality, testing, and release
management. Each workflow is triggered by specific events and helps maintain
project standards.

### Available Workflows

| Workflow                 | Trigger              | Purpose                                                                |
| ------------------------ | -------------------- | ---------------------------------------------------------------------- |
| **Sync Labels**          | Manual dispatch      | Synchronizes repository labels with `.github/labels.yml` configuration |
| **Display Details**      | Manual dispatch      | Displays project, apps, and repository information                     |
| **Release Drafter**      | PR change / Tests ok | Labels pull requests by type and area and drafts categorized releases  |
| **Publish Release**      | Manual / published   | Sets the version on main and publishes the draft release               |
| **Tests**                | Push/PR to main      | Runs tests for affected apps and packages                              |
| **Update VRT baselines** | Manual dispatch      | Renders changed VRT baselines in CI for `nps vrt.accept`               |
| **Run AI Agent**         | Issue/PR comment     | Plans, builds, reviews, or debugs via `/oc` or `/opencode` commands    |

Sync Labels, Release Drafter, Publish Release, and Run AI Agent call the
reusable workflows of [repo-kit](https://github.com/craftsamo/repo-kit), pinned
to `v1`, so the starter and the repositories made from it share one copy.

### Documentation

For detailed information about each workflow, including prerequisites,
configuration, and usage, see:

- [sync-labels.md](docs/github-actions/sync-labels.md)
- [display-details.md](docs/github-actions/display-details.md)
- [release-drafter.md](docs/github-actions/release-drafter.md)
- [tests.md](docs/github-actions/tests.md)
- [run-ai-agent.md](docs/github-actions/run-ai-agent.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
