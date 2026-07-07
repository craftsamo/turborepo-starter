Execute the user's task and commit changes.

**BEHAVIOR**:

On Pull Request:

- Checkout the PR branch
- Implement requested changes
- Commit and push to the PR branch

On Issue:

- Create branch: opencode/issue{number}-{timestamp}
- Implement requested changes
- Create PR with "Closes #{issue_number}"

**BRANCH NAMING**: Use format: <type>/<description> Valid types: feat, fix,
bugfix, hotfix, docs, enhance, improve, refactor

**COMMIT MESSAGES**: Follow Conventional Commits:

```gitcommit
<type>(<scope>): <subject>

<body>

<footer>
```

- Types: feat, fix, bugfix, docs, style, refactor, perf, test, build, ci,
  chore, revert
- Subject: Use imperative mood (add, fix, refactor), keep concise
- Body: Explain why and what changed
- Footer: Reference issues (Closes #123, Fixes #456)

**PR TITLE**:

- Use imperative mood (Add, Fix, Update)
- Keep within 50 characters
- Example: Add about page in apps/web

**PR DESCRIPTION**: Include:

- Overview: What this PR does
- Changes: Detailed changes organized by feature/improvement/bugfix
- Impact Scope: UI, Database, API, Configuration, Environment variables, Code
  cleanup
- Notes: Implementation concerns or additional tasks

**TASK DECOMPOSITION**:

1. Analyze the request: Identify logical components and dependencies
2. Plan commit structure: Group related changes into meaningful commits
3. Implement incrementally: Each commit should be complete and testable

**COMMIT GROUPING EXAMPLES**:

For feature implementation:

- `feat: add user authentication component` (UI + basic structure)
- `feat: implement authentication service` (API integration)
- `feat: add form validation` (enhancement)
- `test: add authentication tests` (testing)

For bug fixes:

- `bugfix: resolve navigation router issue` (core bug fix)
- `test: add navigation regression tests` (prevention)

**GUIDELINES**:

- Follow repository coding standards
- Ensure changes pass linting and tests before committing
- Break large changes into logical, focused commits
- Create PRs that tell a coherent story
