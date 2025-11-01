---
description: Generate squash merge commit message for PR
agent: plan
---

## Goal

Analyze the current Pull Request and produce a concise, repository-consistent
squash-merge commit message that summarizes the PR and includes the full commit
history for traceability.

## Workflow

Follow these steps in order. Each step shows the command(s) to run and the
checks to perform.

### STEP 1: Verify PR context

**Command**:

```sh
gh pr view --json number,title,body,state,baseRefName,headRefName
```

**Check List**:

- Confirm a PR exists for the current branch.
- Confirm PR `state` is `OPEN`. If `MERGED`/`CLOSED`, ask the user before
  proceeding.
- Confirm `baseRefName` (target branch) is correct.

**Note**: If no PR is found, return: **"No pull request found for current
branch."** and stop.

### STEP 2: Determine language and commit conventions

**Command**:

```sh
git log origin/$(gh pr view --json baseRefName -q .baseRefName) -n 10 --oneline --no-decorate
```

**Check List**:

- Detect natural language used in recent commits (e.g., English, Japanese).
- Detect commit style (Conventional Commits, short messages, etc.).
- Detect common prefixes (`feat:`, `fix:`, `chore:`, etc.).
- Detect PR reference format (`(#123)`, `PR-123`, etc.).

**Rule**: Use the same language and style for the squash message.

### STEP 3: Check project commit rules

**Look For**:

- `@.cz-config.js` (commitizen)
- `@commitlint.config.js` or `.commitlintrc.*`

**Rule**: Follow these configurations if present.

### STEP 4: Gather PR commit list

**Command**:

```sh
git log $(gh pr view --json baseRefName -q .baseRefName)..$(git rev-parse --abbrev-ref HEAD) --reverse --pretty=format:"%h %an - %s"
```

**Check List**:

- Total commit count in the PR.
- Authors involved (for attribution).
- Any `WIP`, `fixup!`, or `squash!` commits.
- Logical groupings of commits (features, fixes, docs).

### STEP 5: Review diffs and scope

**Command**:

```sh
git diff $(gh pr view --json baseRefName -q .baseRefName)...HEAD --stat
```

**Check List**:

- Files and modules affected.
- Scale: number of files and approximate lines changed.
- Nature: feature, bugfix, refactor, docs, tests.

### STEP 6: Generate the squash commit message

Compose the message using repository conventions.

Subject (single line):

`<type>(<scope?>): <summary> (<pr-ref>)`

- Prefer <= 50 characters for the subject; allow up to ~72 if necessary.
- Use the `<type>` and `<scope>` patterns identified earlier.
- Append the PR reference using the repo's convention (e.g., `(#123)`).

Body sections (recommended):

1. Summary: 1–3 sentences describing intent and rationale.
2. Key changes: short bullet list of major points (optional).
3. Commit history: REQUIRED — full commit list between `---` delimiters.

Commit history rules:

- Surround the list with `---` on their own lines.
- Each entry: `<short-hash> <author> - <commit subject>`
- Order: oldest → newest.
- Include all commits unless the user explicitly asks to remove some.

Example:

```gitcommit
feat(auth): implement JWT authentication (#123)

Implements JWT-based authentication to replace session cookies and enable stateless auth.

Key changes:
- Add JWT generation and validation
- Add refresh token flow
- Update auth middleware and tests

---
a1b2c3d John Doe - feat: add JWT token generation
d4e5f6g Jane Smith - feat: add refresh token logic
h7i8j9k John Doe - test: add authentication tests
l0m1n2o Jane Smith - docs: update auth documentation
p3q4r5s John Doe - fix: handle token expiration edge case
---
```
