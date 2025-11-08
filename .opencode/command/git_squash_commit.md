---
description: Generate squash merge commit message for PR
agent: plan
---

Run `gh pr view --json number,title,body,state,baseRefName,headRefName` to
analyze the Pull Request and generate a consistent squash-merge commit message
according to the `commitlint.config.js` conventions.

The `subject` should be written in the imperative or present tense, without a
trailing period or exclamation mark, and must be no longer than **50 Unicode
codepoints**.

Separate the `body` from the `subject` with a blank line. Focus the `body` on
**why** the change was made and keep **how** it was done concise. Wrap lines at
**72 Unicode codepoints**.

Under `Histories`, format every commit included in the Pull Request without
omitting any, and enclose the list with `---`.

```gitcommit
<type>(<scope>): <subject> (#<pr_number>)

<body>

Histories:
---
<short-hash> <author> - <commit subject>
<...Include all commits>
---
```
