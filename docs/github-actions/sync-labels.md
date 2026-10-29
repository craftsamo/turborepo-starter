# Sync Labels Workflow

**File**: `.github/workflows/sync-labels.yml`

## Prerequisites

- Manual trigger via GitHub Actions UI (`workflow_dispatch`)
- Labels configuration file must exist (`.github/labels.yml`)

## How It Works

The workflow calls
[repo-kit's `labels-sync` workflow](https://github.com/craftsamo/repo-kit#labels-sync),
pinned to `v1`, which makes the repository's labels the ones
`.github/labels.yml` declares:

1. **Create** the labels the file declares and the repository lacks
2. **Update** the color and description of changed ones; a label whose name
   only changes case is renamed, keeping its issues and pull requests
3. **Prune** the labels the file does not declare

`nps setup.github` applies the same labels.

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
