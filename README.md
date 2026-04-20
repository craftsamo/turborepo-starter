# Welcome to the Turborepo Starter!

This project serves as a boilerplate for efficiently developing applications
using Turborepo, equipped with various best practices and carefully selected
configurations.

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Set Environment variables](#set-environment-variables)
- [Available Commands](#-available-commands)
- [GitHub Actions Workflows](#-github-actions-workflows)

## ✨ Features

- **Monorepo Setup**: Turborepo with Yarn workspaces for scalable project
  organization
- **TypeScript**: Strict type checking with TypeScript 5+
- **Next.js Integration**: Ready-to-use web app with App Router
- **Component Library**: Shared UI components built with Shadcn/ui and Tailwind
  CSS
- **Code Quality**: ESLint, Prettier, and Husky for consistent code standards
- **Testing**: Vitest setup for unit and integration tests
- **Git Workflow**: Commitizen and Commitlint for conventional commits
- **Best Practices**: Optimized configurations and development guidelines

## 🛠 Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build) with Yarn Workspaces
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Next.js with App Router
- **UI Library**: React with Shadcn/ui components
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
│   ├── github-actions/    #
│   └── instructions/      # Development guidelines for AI agents
├── .github/               # GitHub Actions workflows
└── .husky/                # Git hooks configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.0 or higher
- Yarn 1.22.17 or higher

### Installation

1. **Clone the repository**

```sh
git clone https://github.com/craftsamo/turborepo-starter.git
cd turborepo-starter
```

2. **Install Dependencies**

```sh
yarn install
yarn add -g nps
```

3. **Run Development Server**

```sh
nps dev
```

## Set Environment variables

### GitHub Actions Variables

Set the following variables in your GitHub repository settings under
**Settings > Secrets and variables > Variables**:

| Variable             | Default                    |
| -------------------- | -------------------------- |
| `AI_PROVIDER_ID`     | github-copilot             |
| `AI_MODEL_ID`        | gpt-5-mini                 |
| `AI_REVIEW_MODEL_ID` | `AI_MODEL_ID` → gpt-5-mini |
| `AI_ISSUE_MODEL_ID`  | `AI_MODEL_ID` → gpt-5-mini |
| `AI_TASK_MODEL_ID`   | `AI_MODEL_ID` → gpt-5-mini |

### GitHub Actions Secrets

For GitHub Copilot authentication, add the following secret under **Settings >
Secrets and variables > Secrets**:

| Secret                  | Default |
| ----------------------- | ------- |
| `COPILOT_ACCESS_TOKEN`  | ""      |
| `COPILOT_REFRESH_TOKEN` | ""      |

For details on how to set up GitHub Copilot authentication, see
[Run AI Agent Workflow](docs/github-actions/run-ai-agent.md).

## 📦 Available Commands

For all available commands, refer to [package-scripts.js](package-scripts.js)

## 🔄 GitHub Actions Workflows

This project includes automated workflows for code quality, testing, and release
management. Each workflow is triggered by specific events and helps maintain
project standards.

### Available Workflows

| Workflow            | Trigger                 | Purpose                                                                |
| ------------------- | ----------------------- | ---------------------------------------------------------------------- |
| **Assign Labels**   | PR opened               | Automatically assigns labels based on branch naming convention         |
| **Sync Labels**     | Manual dispatch         | Synchronizes repository labels with `.github/labels.yml` configuration |
| **Display Details** | Manual dispatch         | Displays project, apps, and repository information                     |
| **Release Drafter** | Push/PR to main         | Creates and updates draft releases with categorized changes            |
| **Tests**           | Push/PR to main/develop | Runs tests for affected apps and packages                              |
| **Run AI Agent**    | Issue/PR comment        | Executes AI-powered code tasks via `/oc` or `/opencode` commands       |

### Documentation

For detailed information about each workflow, including prerequisites,
configuration, and usage, see:

- [assign-labels.md](docs/github-actions/assign-labels.md)
- [sync-labels.md](docs/github-actions/sync-labels.md)
- [display-details.md](docs/github-actions/display-details.md)
- [release-drafter.md](docs/github-actions/release-drafter.md)
- [tests.md](docs/github-actions/tests.md)
- [run-ai-agent.md](docs/github-actions/run-ai-agent.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
