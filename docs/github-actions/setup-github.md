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
and OpenCode model variables, and displays every planned change before
confirmation. A cancelled run does not apply changes.

The setup manages:

- Repository features and merge methods, including the pull request
  **Update branch** button
- Default commit title and body formats
- GitHub Actions permissions, selected-action allowlist, and artifact and log
  retention
- Labels from `.github/labels.yml`
- A `Starter: protect main` Ruleset
- Optional repository description, homepage, topics, and OpenCode model
  variables (`OPENCODE_MODEL` and `OPENCODE_MODEL_<AGENT>`, checked in the
  format the workflow accepts)

## Dry Run and Defaults

NPS requires the script and its arguments to be enclosed in quotes:

```sh
nps "setup.github --dry-run --defaults"
nps "setup.github --defaults --yes"
```

`--defaults` skips optional metadata and model variable prompts. `--yes` skips the
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
GitHub-owned actions plus the third-party actions used by this starter. A test
fails when a workflow uses a third-party action missing from that allowlist.

It also allows Actions to create pull requests, which `/oc build` and the
Update VRT baselines workflow need. GitHub grants creating and approving pull
requests through the same setting. The OpenCode workflow only posts comment
reviews and never approves, and the managed Ruleset requires no approvals. If
you require approvals, keep in mind that a workflow could approve a pull
request.

Artifacts and logs are kept for 30 days, or for the organization's maximum
when it is shorter.

If an existing repository requires actions to be pinned to full commit SHAs,
setup preserves that requirement and stops before applying changes because the
starter currently uses tag references.

## Secrets

Configure AI provider API keys for the OpenCode workflow as Repository
secrets. The command asks for each of `OPENCODE_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, and `OPENROUTER_API_KEY`; set only the providers you use:

```sh
nps setup.github.secrets
```

Repositories set up before the OpenCode V2 workflow may still have the old
`AI_*` variables and `COPILOT_*` secrets. Nothing reads them anymore; remove
them with `gh variable delete <name>` and `gh secret delete <name>`.

Configure a custom Repository or Environment secret:

```sh
nps "setup.github.secrets --scope repository --name API_TOKEN"
nps "setup.github.secrets --environment production --name DATABASE_URL"
```

The command lists existing secret names but cannot read their values. Secret
values are entered directly through `gh secret set`; the Node.js setup process
does not receive or log them.

Existing Environments are offered as choices. A new Environment can be created
after confirmation. Setting protection rules is outside this command's scope,
but existing ones are preserved: an Environment that already exists is never
re-sent to the API, so reviewers, deployment branches, and wait timers
configured elsewhere survive a re-run.

Jobs must declare an Environment to access its secrets:

```yaml
jobs:
  deploy:
    environment: production
```
