---
description: Create a pull request ($1:BaseBranchName)
agent: build
subtask: true
---

Create a pull request from the !`git rev-parse --abbrev-ref HEAD` (compare)
branch to the $1 (base) branch in the
!`gh repo view -q ".owner.login + \"/\" + .name" --json name,owner` repository.

If the base branch ($1) is not specified, respond with "❌ Please specify the
base branch in $1 (first argument)" and stop the task.

Analyze the changes between the base branch ($1) and the current branch with
`git diff $1...HEAD`.

Based on this analysis, determine which sections are relevant (UI changes,
database changes, breaking changes, etc.) and include only the necessary
sections in the pull request body.

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

## Note

<!--
  - Points to note for reviewers
  - Concerns in implementation
  - Additional tasks needed
  - Future issues
  etc., if any, please describe
-->
```
