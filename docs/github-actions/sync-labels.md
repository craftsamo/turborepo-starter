# Sync Labels Workflow

**File**: `.github/workflows/sync-labels.yml`

## Prerequisites

- Manual trigger via GitHub Actions UI (`workflow_dispatch`)
- Labels configuration file must exist (`.github/labels.yml`)
- Repository must have `pull-requests: write` permissions

## How It Works

The workflow automatically synchronizes repository labels with the configuration
defined in `.github/labels.yml` using the
[action-label-syncer](https://github.com/micnncim/action-label-syncer) action.

### Process

1. **Trigger**: Manual workflow dispatch from GitHub Actions UI
2. **Checkout**: Clone the repository to access `.github/labels.yml`
3. **Sync**: Compare repository labels with configuration file
4. **Apply**: Create, update, or delete labels as needed
5. **Prune**: Remove labels that are not defined in configuration

### Configuration

The sync operation uses the following settings:

| Setting | Value | Description                                        |
| ------- | ----- | -------------------------------------------------- |
| `prune` | true  | Delete labels that are not in `.github/labels.yml` |

### Labels Managed

The workflow manages all labels defined in `.github/labels.yml`:

- **Types**: `🌱feature`, `⚒️enhancement`, `🐛bug`, `🐞hotfix`,
  `📝documentation`
- **Questions/Issues**: `💬quesion`, `🔁duplicate`, `🚫wontfix`
- **Version**: `🌟major`
- **Apps**: `🌐app: web`
- **Packages**: `📦package: jest`, `📦package: vitest`, `📦package: eslint`,
  `📦package: prettier`, `📦package: tsconfig`, `📦package: ui`,
  `📦package: types`, `📦package: constants`
- **Workflows**: `🔄workflow: sync-labels`, `🔄workflow: release`,
  `🔄workflow: deployment`, `🔄workflow: get-details`,
  `🔄workflow: display-details`, `🔄workflow: tests`
