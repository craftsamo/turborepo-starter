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
  `📝documentation`, `🔧maintenance`, `dependencies`
- **Questions/Issues**: `💬question`, `🔁duplicate`, `🚫wontfix`
- **Version**: `🌟major`
- **Release notes**: `skip-changelog`
- **Apps**: `🌐app: web`
- **Packages**: `📦package: vitest`, `📦package: eslint`,
  `📦package: prettier`, `📦package: tsconfig`, `📦package: ui`,
  `📦package: types`, `📦package: constants`, `📦package: playwright`
- **Repository**: `🔄workflows`, `🛠️scripts`

Release Drafter applies the type, version and area labels to pull requests;
see [release-drafter.md](release-drafter.md#auto-labeling-rules). Every label
it applies must be declared here, or a sync would delete it.
`dependencies` carries no emoji because Dependabot applies that exact name.
