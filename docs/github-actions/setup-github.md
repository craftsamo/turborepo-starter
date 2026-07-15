# GitHub Repository Setup

**Command**: `nps setup.github`

## Prerequisites

- The repository has a `main` branch containing this starter
- [GitHub CLI](https://cli.github.com/) is installed and authenticated
- The authenticated account has repository administrator permission
- Organization policies allow repository-level Actions and Ruleset changes

## Interactive Setup

Run the setup wizard:

```sh
nps setup.github
```

The wizard reads the current GitHub configuration, asks for optional metadata
and AI variables, and displays every planned change before confirmation. A
cancelled run does not apply changes.

The setup manages:

- Repository features and merge methods
- Default commit title and body formats
- GitHub Actions permissions and selected-action allowlist
- Labels from `.github/labels.yml`
- A `Starter: protect main` Ruleset
- Optional repository description, homepage, topics, and AI variables

## Dry Run and Defaults

NPS requires the script and its arguments to be enclosed in quotes:

```sh
nps "setup.github --dry-run --defaults"
nps "setup.github --defaults --yes"
```

`--defaults` skips optional metadata and AI variable prompts. `--yes` skips the
final confirmation. Use `--repo owner/repository` to target a repository other
than the current Git remote.

Label synchronization prunes labels not declared in `.github/labels.yml`. The
dry run lists every label that would be created, updated, renamed, or deleted.

## Main Protection

The managed Ruleset requires pull requests and a successful `Required checks`
job against the latest `main`. It blocks branch deletion and force pushes while
allowing repository administrators to bypass the Ruleset.

Setup dispatches and waits for the Tests workflow before creating the Ruleset.
If Repository Rulesets are unavailable, setup applies equivalent classic branch
protection without weakening stricter existing protection.

## Actions Permissions

Setup enables Actions with a read-only default `GITHUB_TOKEN` and permits only
GitHub-owned actions plus the third-party actions used by this starter. It does
not enable Actions to create or approve pull requests.

If an existing repository requires actions to be pinned to full commit SHAs,
setup preserves that requirement and stops before applying changes because the
starter currently uses tag references.

## Secrets

Configure Copilot credentials as Repository secrets:

```sh
nps setup.github.secrets
```

Configure a custom Repository or Environment secret:

```sh
nps "setup.github.secrets --scope repository --name API_TOKEN"
nps "setup.github.secrets --environment production --name DATABASE_URL"
```

The command lists existing secret names but cannot read their values. Secret
values are entered directly through `gh secret set`; the Node.js setup process
does not receive or log them.

Existing Environments are offered as choices. A new Environment can be created
after confirmation. Environment protection rules such as reviewers, deployment
branches, and wait timers are outside this command's scope.

Jobs must declare an Environment to access its secrets:

```yaml
jobs:
  deploy:
    environment: production
```

## Known Limitation

The existing `/oc task` workflow mode requests a read-only contents token, so it
cannot push a branch or create a pull request. Repository setup intentionally
does not broaden that workflow permission.
