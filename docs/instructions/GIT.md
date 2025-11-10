## Git Workflow Guidelines

This document outlines the Git workflow, branching strategy, commit conventions,
and pull request guidelines for this repository.

### Contents

- [Branch Strategy](#branch-strategy)
- [Commit Rules](#commit-rules)
- [Pull Request Guidelines](#pull-request-guidelines)

### Branch Strategy

This repository follows a **GitHub Flow-inspired** branching strategy.

#### Main Branches

| Branch | Purpose                         |
| ------ | ------------------------------- |
| `main` | Production-ready, always stable |

#### Working Branches

Feature, fix, and other work branches are created from `main` or other working
branches and follow the naming convention: `<type>/<description>`

**Valid Types:**

- `feat`: New feature
- `fix`: Bug fix
- `hotfix`: Critical fix for production
- `docs`: Documentation
- `enhance` or `enhancement`: Enhancement to existing feature
- `improve`: Improvement
- `refactor`: Code refactoring

**Examples:**

- `feat/user-authentication`
- `fix/navigation-bug`
- `docs/update-readme`

#### Merge Targets

- `type`/\* → merges into `main`
- `type`/_ → merges into other `type`/_ branches

For detailed branch strategy, naming conventions, merge methods, and rebase
guides, see @docs/branch-strategy.md

### Commit Rules

Commit messages follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification
enforced by @commitlint.config.js

#### Format

```gitcommit
<type>(<scope>): <subject>

<body>

<footer>
```

- **Type**: One of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, or `revert`
- **Scope**: Optional. Indicates the part of the codebase affected (e.g., `web`,
  `api`, `ui`)
- **Subject**: Describe the change using imperative mood (see examples below)

#### Subject

- Use **imperative mood** (e.g., `add`, `fix`, `refactor`)
- Match the language of recent commits (English, Japanese)

#### Body

- Explain **why** the change was made and **what** was changed
- Keep **how** it was implemented concise

#### Footer

Reference related Issues, Pull Requests, and Discussions:

```
Closes #123
Fixes #456
Relates to #789
Discussion: #999
```

For multiple references, use commas:

```
Closes #123, #456
```

### Pull Request Guidelines

#### Creating a Pull Request

**Title Format:**

- Use imperative mood (e.g., `Add`, `Fix`, `Update`)
- Summarize the main change concisely
- Keep within 50 characters (Unicode codepoints)
- Example: `Add about page in apps/web`

**Description:** Use the provided template (@github/PULL_REQUEST_TEMPLATE.md)
which includes:

- **Overview**: Briefly describe what this PR does at a high level
- **Changes**: Detail all changes made, organized by feature or fix:
  - ### Addition of XX feature
    - Detailed change 1
    - Detailed change 2
  - ### Fix of YY feature
    - Explanation of the fix
    - Effect of the fix
- **Breaking Changes**: Indicate whether breaking changes exist (Yes/No)
- **Impact Scope**: Select all affected areas (UI, Database, API, Configuration,
  Environment variables, or Code cleanup)
- **Testing**: Include logs for `nps docker.build` and `nps test`
- **Screenshots**: Provide before/after screenshots, GIF, or MP4 for UI changes
- **Notes**: Add points for reviewers, implementation concerns, or additional
  tasks

For the complete template structure, see @github/PULL_REQUEST_TEMPLATE.md

#### Update a Pull Request

When additional commits are pushed to address feedback or add new changes:

1. **Update the Description**
   - Revise the **Overview** if the scope of changes has shifted
   - Update **Changes** section to reflect all new/modified changes
   - Adjust **Impact Scope** if new areas are affected
   - Update **Testing** section with new test/build logs

2. **Keep Content Synchronized**
   - Ensure the PR description matches the current state of the branch
   - Append "**(Update)**" to changed items to highlight recent modifications
   - Remove or update any outdated information

3. **Maintain Clarity for Reviewers**
   - Help reviewers quickly understand what changed since the last review
   - Use "**(Update)**" suffix for sections that were modified
