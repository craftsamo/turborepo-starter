# Welcome to the Turborepo Starter!

This project serves as a boilerplate for efficiently developing applications
using Turborepo, equipped with various best practices and carefully selected
configurations.

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)

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

