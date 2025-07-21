<div align="center">
  <h1>Welcome to the Turborepo Starter!</h1>
</div>

This project serves as a boilerplate for efficiently developing applications
using Turborepo, equipped with various best practices and carefully selected
configurations.

## Contents

- [Branches](#branches)
- [Getting Started](#installation)
- [Internal Packages](#internal-packages)
- [Commit Rules](#commit-rules)
- [Branch Strategy](#branch-strategy)
- [Sync Label](#sync-labels)
- [Releases](#releases)

## Branches

- **main**: A stable branch equipped with minimal features.

- **with-cloudrun**: A branch integrated with features to deploy applications on
  [Google Cloud](https://cloud.google.com).

- **with-cloudrun-proxy**: A branch equipped with a foundation for a full-stack
  application where `apps/web` and `apps/api` are reverse-proxied.

- **with-cloudrun-proxy-and-discordbot**: DiscordAuth and DiscordBot are
  integrated into `apps/api` built on `with-cloudrun-proxy`.

## Getting Started

1. **Clone the repository**

```sh
- [Logger Usage](#logger-usage)
git clone https://github.com/itou-rui/turborepo-starter.git

```

To clone a specific branch, use:

```sh
git clone -b with-cloudrun https://github.com/itou-rui/turborepo-starter.git
```

2. **Install Dependencies**

```sh
yarn install
```

3. **Run Project**

```sh
nps dev
```

For other available commands, please refer to [here](package-scripts.js).

## Internal Packages

This repository contains several internal packages tailored for specific
purposes:

| Package name                              | Description                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| [tsconfig](packages/tsconfig/README.md)   | Shared TypeScript configurations.                      |
| [eslint](packages/eslint/README.md)       | Linting configurations for various frameworks.         |
| [prettier](packages/prettier/README.md)   | Formatting rules for consistent code style.            |
| [jest](packages/jest/README.md)           | Testing configurations for unit and integration tests. |
| [vitest](packages/vitest/README.md)       | Testing configurations for unit and integration tests. |
| [ui](packages/ui/README.md)               | Common UI package.                                     |
| [types](packages/types/README.md)         | Common types package.                                  |
| [constants](packages/constants/README.md) | Common constants package.                              |
| [logger](packages/logger/README.md)       | Common logger package.                                 |

These packages can be added as dependencies in `apps/**` and `packages/**` to
utilize them.

## Commit Rules

Settings to ensure clarity and traceability of commit messages have already been
incorporated. For detailed rules, please check [here](docs/commit-rules.md).

## Branch Strategy

By operating branches based on the rules outlined
[here](/docs/branch-strategy.md), you can enjoy the following benefits:

- Labels are automatically added to Pull Requests.
- Contents are automatically appended to release notes.

## Sync Labels

A workflow has been prepared to automatically synchronize the contents defined
in [.github/labels.yml](/.github/labels.yml).

For more details, please refer to [here](/docs/sync-labels.md).

## Releases

When merged into the `main` branch, a convenient workflow automatically creates
(updates) release notes in Draft state.

For details, please check [here](/docs/releases.md).
