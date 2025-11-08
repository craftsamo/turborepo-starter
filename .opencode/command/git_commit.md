---
description: Commit the currently staged files
agent: build
subtask: true
---

Review the currently staged changes with `git diff --staged`, and commit to Git
following the rules defined in `commitlint.config.js`.

The `subject` should be written in the imperative or present tense, without a
trailing period or exclamation mark, and must be no longer than **50 Unicode
codepoints**.

Separate the `body` from the `subject` with a blank line. Focus the `body` on
**why** the change was made and keep **how** it was done concise. Wrap lines at
**72 Unicode codepoints**.

Use the natural language (e.g., English or Japanese) that appears in the output
of `git log -n 1 --oneline`.

If `commitlint.config.js` is not present, run `git log -n 5` and follow the
conventions used in the project.
