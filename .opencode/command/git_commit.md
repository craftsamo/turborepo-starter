---
description: Commit the currently staged files
agent: build
---

## Goal

Analyze the changes of the currently staged files and perform the commit.

## Workflow

### STEP 1: Verify files to be committed

**Staged Files**:

```txt
!`git diff --name-status --staged`
```

**Check List**:

- Files currently staged

**Note**:

If the command returns no output, run `git status --short` to group changes
logically, then prompt the user to stage files and terminate the process.

### STEP 2: Identify the natural language and style to use

**Commit Logs**:

```txt
!`git log -n 5 --oneline`
```

**Check List**:

- The language most frequently used in commits (e.g., English or Japanese)
- Commit style (format, context, tone, etc.)

### STEP 3: Review the changes to be committed

**Command**:

```sh
git diff --staged
```

**Check List**:

- Restrict the review to changes of the files currently staged

### STEP 4: Confirm commit rules

**Check List**:

- Presence of `@.cz-config.js` and its contents
- Presence of `@commitlint.config.js` and its contents

**Note**:

If neither file is found, follow the format below.

```gitcommit
<type>(<scope?>): <subject>

<body?>
```

### STEP 5: Execute the commit

**Command**:

```sh
git commit -m "<type>(<scope?>): <subject>" -m "<body1?>" -m "<body2?>"
```

**Check List**:

- Keep the `subject` within 50 characters.
- Wrap the `body` at 72 characters.
