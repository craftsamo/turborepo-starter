# Release Drafter Workflow

**File**: `.github/workflows/release-drafter.yml`

## Prerequisites

- Pull requests must be **opened, reopened, or synchronized** against `main`
  branch
- Or pushes to `main` branch
- Pull requests must have labels matching the configuration in
  `.github/release-drafter.yml`
- Repository must have `contents: write` and `pull-requests: write` permissions

## How It Works

The workflow automatically creates and updates draft releases based on pull
requests and commits to the `main` branch using the
[release-drafter](https://github.com/release-drafter/release-drafter) action.

### Process

1. **Trigger**: PR opened/reopened/synchronized or push to `main`
2. **Analyze**: Review PR labels and branch naming patterns
3. **Categorize**: Group changes by category (Features, Enhancements, Bug Fixes,
   Documentation)
4. **Auto-label**: Apply labels based on branch naming or file changes
5. **Generate**: Create or update draft release notes
6. **Resolve Version**: Calculate version bump based on labels

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

Version bumps are determined by labels on pull requests:

| Version Type | Trigger Labels                                        |
| ------------ | ----------------------------------------------------- |
| Major        | `🌟major`                                             |
| Minor        | `🌱feature`                                           |
| Patch        | `📝documentation`, `⚒️enhancement`, `🐛bug`, `🐞hotfix` (default) |

### Auto-labeling Rules

Labels are automatically applied based on branch naming patterns or file
changes:

1. **Feature**: Branch name starts with `feat/`
2. **Enhancement**: Branch name starts with `enhance/`, `improve/`, or
   `refactor/`
3. **Bug Fix**: Branch name starts with `fix/`
4. **Hotfix**: Branch name starts with `hotfix/`
5. **Documentation**: Branch name starts with `docs/` or changes `.md` files
