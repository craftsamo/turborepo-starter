---
description: Update a pull request
agent: build
subtask: true
---

Update the title and body of pull request
#!`gh pr view --json number --jq '.number'` in the
!`gh repo view -q ".owner.login + \"/\" + .name" --json name,owner` repository
to reflect the latest changes.

First, verify that the pull request exists. If not, respond with "❌ Pull
request does not exist." and stop the task.

Next, verify that all local commits are pushed to the remote branch. If there
are unpushed commits, push them first.

Then, analyze the changes between the base branch and the current branch: git
diff !`gh pr view --json baseRefName --jq '.baseRefName'`...HEAD

If no code or documentation changes exist, respond with "Pull request reflects
the latest and most accurate content!" and stop the task.

Based on this analysis, determine which sections are relevant to the actual
changes (UI changes, database changes, breaking changes, etc.) and update the PR
title and body to include only the necessary sections.

The title should be written in the imperative or present tense, without a
trailing period or exclamation mark, and must be no longer than **50 Unicode
codepoints**.

Use the natural language (e.g., English or Japanese) that appears in the output
of `git log -n 1 --oneline`.

The pull request body must fully comply with the structure defined in
@.github/PULL_REQUEST_TEMPLATE.md (@.github/pull_request_template.md) if it
exists.

If the template file does not exist, use the following structure as a guide, but
include ONLY the sections relevant to the actual changes:

```markdown
## Overview

<!-- Briefly describe the changes -->

## Changes

<!--
Describe the changes in the following format:

- ### Addition of XX feature
  - Detailed change 1
  - Detailed change 2

- ### Fix of YY feature
  - Explanation of the fix
  - Effect of the fix
-->

## Breaking Changes

- [ ] Yes
- [ ] No

## Impact Scope

- [ ] UI changes
- [ ] Database changes
- [ ] API changes
- [ ] Configuration changes
- [ ] Environment variable changes
- [ ] None (Code cleanup)

## Testing

<details>
  <summary>build</summary>
  <!-- 
    ... Build log 
  -->
</details>

<details>
  <summary>test</summary>
  <!-- 
    ... Test log 
  -->
</details>

## Screenshots

<!--
  If there are UI changes, share before/after using one of the following methods:

  1. Screenshots
  2. GIF, MP4
-->

## Notes

<!--
  - Points to note for reviewers
  - Concerns in implementation
  - Additional tasks needed
  - Future issues
  etc., if any, please describe
-->
```
