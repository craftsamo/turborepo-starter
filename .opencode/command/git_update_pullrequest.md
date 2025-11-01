---
description: Update a pull request
agent: build
---

## Goal

Update an existing Pull Request so its title, body, and branch reflect the
current changes and repository conventions. Use `gh pr edit` and `git push` when
necessary.

## Workflow

### STEP 1: Identify the current Pull Request and context

**Current PR**:

```txt
!`gh pr view --json number,url,baseRefName,headRefName --jq '.number, .url, .baseRefName, .headRefName'`
```

**Check List**:

- Confirm there is an open PR for the current branch; if none, instruct to
  create one instead.
- Note `base_branch` and `head_branch` from the PR metadata.
- Ensure local branch matches `headRefName`.

### STEP 2: Determine whether an update is needed

**Commit Logs**:

```txt
!`git log -n 5 --oneline`
```

**Latest PR List**:

```txt
!`gh pr list --state=closed --limit=3 --json number,title,body`
```

**Diff Check**:

```sh
git fetch origin <base_branch>
git diff --name-status origin/<base_branch>...HEAD
git diff --stat origin/<base_branch>...HEAD
```

**Check List**:

- If no code or doc changes relative to base, reply: "Pull Request reflects the
  latest and most accurate content!" and abort.
- Identify files that changed and any large/test/migration outputs that must be
  documented.

### STEP 3: Review current title and body for consistency

**Title**:

- Retrieve current title: `gh pr view --json title`.
- Title must begin with a verb and be <=50 characters; update if it doesn't
  summarize `git diff origin/<base_branch>...HEAD`.

**Body**:

- Retrieve current body: `gh pr view --json body`.
- Ensure the body accurately describes the changes, testing, and any migration
  steps.
- For long logs or verbose outputs (>20 lines), wrap them in a `<details>` block
  with a clear `<summary>` label.

### STEP 4: Prepare updated title and body

**Guidelines**:

- Follow repository PR template if present
  (`@.github/PULL_REQUEST_TEMPLATE.md`).
- Use the suggested structure when no template exists:

```text
<Short title (<=50 chars)>

Background:
- Why this change was needed.

Change:
- Summary of key changes and files affected.

Testing:
- How this was tested locally or in CI.

Migration / Notes:
- Any manual steps or backward-incompatible changes.

How to review:
- Areas reviewers should focus on.
```

- Wrap lines at ~72 characters and mention related issues (e.g., `Closes #123`).

### STEP 5: Push branch updates if necessary

**Commands**:

```sh
# If local commits need to be pushed
git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)
```

**Check List**:

- Ensure branch includes latest commits and is pushed to remote before editing
  PR metadata.

### STEP 6: Update the Pull Request

**Non-interactive**:

```sh
# Update title and body explicitly
gh pr edit <PR_NUMBER> --title "<NEW TITLE>" --body "<NEW BODY>"
```

**Interactive**:

- Use `gh pr edit <PR_NUMBER> --web` to open the PR edit form in the browser for
  manual adjustments when unsure.

**Additional flags**:

- Add reviewers/assignees/labels: `--add-reviewer user`, `--add-assignee user`,
  `--add-label "type: bug"`.

### STEP 7: Post-update verification

**Commands**:

```sh
gh pr view <PR_NUMBER> --json url,number,title,body,updatedAt --jq '.url, .number, .title, .updatedAt'
```

**Check List**:

- Return the updated PR URL and number to the user.
- Confirm title and body were updated as requested.
- Suggest next steps if CI fails (fix, rebase, or open follow-up PR).

## Quick Rules (Summary)

- If no update needed, reply: "Pull Request reflects the latest and most
  accurate content!" and abort.
- Title: verb-led, <=50 chars.
- Body: use PR template or the suggested structure; wrap at ~72 chars.
- Push branch before editing PR metadata.
- Use `gh pr edit` non-interactively for reproducibility; `--web` when manual
  edits are preferred.

## Example

```sh
# fetch base and inspect diff
git fetch origin main
git diff --stat origin/main...HEAD

# push commits, then update PR #42
git push origin feature-branch
gh pr edit 42 --title "Fix user auth timeout" --body "Background:\n- Fixes...\nTesting:\n- Ran unit tests...\n"
```
