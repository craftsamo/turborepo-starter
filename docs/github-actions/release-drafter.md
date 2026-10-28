# Release Drafter Workflow

**File**: `.github/workflows/release-drafter.yml`

## Prerequisites

- Pull requests must be **opened or reopened**, against any base branch
- Or pushes to `main` branch
- Pull requests must have labels matching the configuration in
  `.github/release-drafter.yml`
- The labeling job needs `pull-requests: write`; the drafting job needs
  `contents: write`

## How It Works

The workflow labels pull requests and keeps a draft release up to date with
the pull requests merged into `main`, using the
[release-drafter](https://github.com/release-drafter/release-drafter) action
(v7). Publishing the draft stays a manual step.

### Process

1. **Trigger**: PR opened/reopened (labels only) or push to `main` (draft only)
2. **Auto-label**: Apply labels based on branch naming or file changes
3. **Categorize**: Group the merged pull requests by label (Features,
   Enhancements, Bug Fixes, Documentation)
4. **Generate**: Create or update draft release notes
5. **Resolve Version**: Calculate the version bump from the labels

Release Drafter v7 ships labeling and drafting as two actions, so the workflow
runs one job per event: `label_pull_request` on a pull request and
`update_release_draft` on a push. A newer run for the same pull request or
branch cancels the one still in progress, since each run rebuilds the labels
or the draft from the current state.

Labels follow the branch name, which a later push does not change, so a push
to a pull request does not run the workflow. The `.md` rule below looks at the
files when the pull request is opened.

A pull request run only applies labels, whatever the base branch: a stack
opens each upper pull request on the branch below it and links it to the stack
only afterwards, so a `main` filter would miss it. Only pushes to `main`
redraft the release; a draft built from a pull request run would target the
pull request's merge ref instead of `main`.

### Release Naming

| Component    | Format               | Example              |
| ------------ | -------------------- | -------------------- |
| Release name | `v$RESOLVED_VERSION` | `v1.2.3 🚀`          |
| Git tag      | `v$RESOLVED_VERSION` | `v1.2.3`             |
| Change entry | PR title + author    | `Title @user (#123)` |

### Change Categories

Changes are organized into four categories based on PR labels:

| Category         | Labels              | Icon |
| ---------------- | ------------------- | ---- |
| 🚀 New Features  | `🌱feature`         | 🚀   |
| ⚒️ Enhancement   | `⚒️enhancement`     | ⚒️   |
| 🐛 Bug Fixes     | `🐛bug`, `🐞hotfix` | 🐛   |
| 📄 Documentation | `📝documentation`   | 📄   |

### Version Resolution

The highest bump among the merged pull requests wins:

| Version Type | Trigger Labels                     |
| ------------ | ---------------------------------- |
| Major        | `🌟major`                          |
| Minor        | `🌱feature`                        |
| Patch        | Every other pull request (default) |

### Auto-labeling Rules

Labels are automatically applied when a pull request is opened or reopened,
based on branch naming patterns or file changes:

1. **Feature**: Branch name starts with `feat/`
2. **Enhancement**: Branch name starts with `enhance/`, `improve/`, or
   `refactor/`
3. **Bug Fix**: Branch name starts with `fix/`
4. **Hotfix**: Branch name starts with `hotfix/`
5. **Documentation**: Branch name starts with `docs/` or changes `.md` files
