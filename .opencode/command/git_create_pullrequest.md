---
description: Create a pull request ($ARGUMENTS is base branch name)
agent: build
---

## Goal

Create a clear, well-formatted Pull Request from the current branch to the base
branch given by `$ARGUMENTS`, using `gh pr create`. The PR title and body must
reflect the actual code changes and follow repository conventions.

## Workflow

### STEP 1: Verify inputs and environment

**Current branch**:

```txt
!`git rev-parse --abbrev-ref HEAD`
```

**Repository**:

```txt
!`gh repo view -q ".owner.login + \"/\" + .name" --json name,owner`
```

**Check List**:

- Ensure `$ARGUMENTS` (base branch) is provided; if not, reply with
  `$ARGUMENTS must be specified.` and abort.
- Ensure you are on the intended feature branch (not `main`/`master`/`develop`).
- Ensure local branch is pushed: `git push --set-upstream origin <branch>` if
  necessary.

**Note**:

If the current branch equals the base branch, abort and ask the user to switch
to the correct branch.

### STEP 2: Identify language and PR style from recent history

**Commit Logs**:

```txt
!`git log -n 5 --oneline`
```

**Latest PR List**:

```txt
!`gh pr list --state=closed --limit=3 --json number,title,body`
```

**Check List**:

- Infer the natural language used in commits and PRs (e.g., English or
  Japanese).
- Observe PR title style, body sections, and common labels or reviewers.

### STEP 3: Review the changes to be proposed

**Commands**:

```sh
git fetch origin $ARGUMENTS
git diff --name-status origin/$ARGUMENTS...HEAD
git diff --stat origin/$ARGUMENTS...HEAD
git diff origin/$ARGUMENTS...HEAD
```

**Check List**:

- List changed files and their types (A/M/D/R).
- Identify any large or risky changes that need special review notes.
- Note migration steps, DB changes, or required feature flags.

### STEP 4: Confirm repository PR rules and templates

`@.github/PULL_REQUEST_TEMPLATE.md` OR `@.github/pull_request_template.md`

**Check List**:

- If a PR template exists, use it as the basis for the PR body.
- Check for repository conventions: required labels, reviewers, or issue linking
  rules (e.g., "Closes #123").
- Check for commit message rules (`commitlint`, conventional commits) to reflect
  in PR title.

### STEP 5: Compose PR title and body

**Title Rules**:

- Start with a verb (e.g., `Add`, `Fix`, `Enable`).
- Summarize the main change as a short sentence within 50 characters.
- Prefer conventional-commit-like subject if the repository uses it.

**Body Guidelines**:

- Base the body on `git diff origin/$ARGUMENTS...HEAD` and the PR template when
  present.
- Include sections when relevant: `Background`, `Change`, `Testing`,
  `Migration / Notes`, `How to review`.
- Wrap lines at ~72 characters where possible.
- Mention related issues (e.g., `Closes #<issue>`).

**Suggested structure**:

```text
<Short title (<=50 chars)>

Background:
- Why this change is needed.

Change:
- Summary of key changes and files affected.

Testing:
- How this was tested locally or in CI.

Migration / Notes:
- Any manual steps or backward-incompatible changes.

How to review:
- Areas reviewers should focus on.
```

**Checks before creating**:

- Title <= 50 chars.
- Body present and explains testing and migration if applicable.
- Branch pushed to remote and up to date with base branch.

### STEP 6: Create the Pull Request

**Command (non-interactive)**:

```sh
gh pr create --base "$ARGUMENTS" --title "<TITLE>" --body "<BODY>" --fill
```

- Use `--fill` only when you want `gh` to auto-populate from the branch
  title/description; otherwise pass explicit `--title` and `--body`.
- Add reviewers or labels if repository expects them: `--reviewer user` or
  `--label "type: enhancement"`.

**Interactive alternative**:

- If unsure about title/body, run `gh pr create --base "$ARGUMENTS" --web` to
  open the PR form in the browser for manual adjustments.

### STEP 7: Post-create actions

**Commands**:

```txt
!`gh pr view --json url,number --jq '.url, .number'`
```

**Check List**:

- Return the PR URL to the user.
- Recommend adding reviewers or specific labels if not already set.
- If CI fails, suggest next steps (fix tests, rebase, or open follow-up PR).

## Quick Rules (Summary)

- Abort if `$ARGUMENTS` not provided and reply with
  `$ARGUMENTS must be specified.`
- Title: verb-led, <=50 chars.
- Body: use template or follow the suggested structure; wrap at ~72 chars.
- Use `gh pr create` with explicit title/body for reproducibility.

## Example

```sh
# create PR from current branch to "main"
gh pr create --base "main" --title "Add logging for user auth" --body "Background:\n- Adds logs...\n" --label "type: enhancement"
```
