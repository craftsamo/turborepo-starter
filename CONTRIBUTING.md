# Contributing to turborepo-starter

Thank you for helping. This guide covers how to propose a change, set up the repository, and get a pull request merged. The rules the code itself follows are in [AGENTS.md](AGENTS.md), which AI coding agents read too.

## Before you start

- Search the [issues](https://github.com/craftsamo/turborepo-starter/issues) and [pull requests](https://github.com/craftsamo/turborepo-starter/pulls?q=is%3Apr) first, closed ones included.
- Open an issue before starting a large change or a new feature, so it can be agreed first.
- A fix for a bug or a documentation error can go straight to a pull request.
- Report a vulnerability privately as [SECURITY.md](SECURITY.md) describes, not in an issue or pull request.

## Setup

You need Node.js `>=24`.

```sh
git clone https://github.com/craftsamo/turborepo-starter.git
cd turborepo-starter
corepack enable
pnpm add -g nps
pnpm install
```

## Checks

Run these before you push:

```sh
nps format
nps lint
nps typecheck
nps test
nps build
```

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`, in the imperative, such as `fix(parser): handle empty input`. Keep each commit to one change; the body says why, when the subject cannot.

## Pull requests

- Branch from the default branch and keep a pull request to one change.
- Describe what it changes and why, how you checked it, and the issue it closes.

Pull requests are automatically labeled from their branch name, changed files, and breaking-change checkbox. A maintainer can adjust the labels. The label decides how far the next version moves:

| Label             | Next version                  |
| ----------------- | ----------------------------- |
| `🌟major`         | major                         |
| `🌱feature`       | minor                         |
| `🐛bug`           | patch                         |
| `🐞hotfix`        | patch                         |
| `⚒️enhancement`   | patch                         |
| `📝documentation` | patch                         |
| `dependencies`    | patch                         |
| `🔧maintenance`   | patch                         |
| any other         | patch                         |
| `skip-changelog`  | left out of the release notes |

## License

By contributing, you agree that your contributions are licensed under the project's [license](LICENSE).
