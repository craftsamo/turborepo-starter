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

- Repository features and merge methods
- Default commit title and body formats
- GitHub Actions permissions, selected-action allowlist, artifact and log
  retention, and cache retention
- Secret scanning with push protection and Dependabot alerts
- Labels from `.github/labels.yml`
- A writable `Release version bump` deploy key and its `RELEASE_DEPLOY_KEY`
  secret, which Publish Release pushes the root version bump to `main` with
- A `Starter: protect main` Ruleset
- Optional repository description, homepage, topics, and OpenCode model
  variables (`OPENCODE_MODEL` and `OPENCODE_MODEL_<AGENT>`, checked in the
  format the workflow accepts)
- Optional Dependabot security updates, off unless you enable them

## Dry Run and Defaults

NPS requires the script and its arguments to be enclosed in quotes:

```sh
nps "setup.github --dry-run --defaults"
nps "setup.github --defaults --yes"
```

`--defaults` skips the optional metadata, model variable, and Dependabot
security update prompts, leaving security updates off. `--yes` skips the
final confirmation. Use `--repo owner/repository` to target a repository other
than the current Git remote.

Label synchronization prunes labels not declared in `.github/labels.yml`. The
dry run lists every label that would be created, updated, renamed, or deleted.

## Main Protection

The managed Ruleset requires pull requests and a successful `Required checks`
job against the latest `main`. It blocks branch deletion and force pushes while
allowing repository administrators and deploy keys to bypass the Ruleset.

The deploy key bypass is what lets Publish Release push the root version bump
to `main`. Setup creates a key pair locally with `ssh-keygen`, registers the
public half as the writable `Release version bump` deploy key, stores the
private half in the `RELEASE_DEPLOY_KEY` secret, and deletes the local copy. It
keeps an existing key whose secret is present, and replaces the pair when
either half is missing or the key is read-only; to rotate the key, delete it
under **Settings → Deploy keys** and run setup again. Any workflow of this
repository can read the secret and so push to `main`, so review workflow
changes with that in mind; a fork's workflow cannot read it. GitHub accepts
GitHub Actions itself as a bypass actor only on organization repositories,
which is why a deploy key is used.

Keep a pull request current by rebasing it onto `main` locally and
force-pushing the branch. Setup turns off GitHub's suggestion to update pull
request branches, whose default merges `main` into the branch. GitHub still
offers **Update branch** while a pull request is behind, because the Ruleset
requires the latest `main`; a local rebase and push clears it.

Setup dispatches and waits for the Tests workflow before creating the Ruleset.
If Repository Rulesets are unavailable, setup applies equivalent classic branch
protection without weakening stricter existing protection.

## Actions Permissions

Setup enables Actions with a read-only default `GITHUB_TOKEN` and permits only
GitHub-owned actions plus the third-party actions and reusable workflows that
the files in `.github/workflows` use, each at any ref. After adding one to a
workflow, run setup again before the workflow can use it.

It also allows Actions to create pull requests, which `/oc build` needs.
GitHub grants creating and approving pull requests through the same setting.
The OpenCode workflow only posts comment reviews and never approves, and the
managed Ruleset requires no approvals. If you require approvals, keep in mind
that a workflow could approve a pull request.

Artifacts and logs are kept for 30 days, or for the organization's maximum
when it is shorter. GitHub applies the same period to checks, workflow runs,
and commit statuses, so a shorter one would also drop the `Required checks`
result of a pull request left open longer. Artifact storage is kept down by
the `retention-days` each workflow sets on its uploads instead.

Actions caches are removed after 3 days without use, instead of GitHub's 7.
Caches of merged branches then leave the repository's 10 GB cache quota
sooner, rather than pushing out the ones `main` still uses. Setup keeps the
current value when an organization or enterprise policy caps it lower, and
never raises the 10 GB quota, which GitHub would bill.

Actions settings are applied before anything else. When an organization policy
overrides one of them, setup stops before changing other settings and names the
organization setting an owner must allow.

If an existing repository requires actions to be pinned to full commit SHAs,
setup preserves that requirement and stops before applying changes because the
starter currently uses tag references.

## Security Features

Setup enables Dependabot alerts, secret scanning, and secret scanning push
protection. Alerts only report vulnerable dependencies; they open no pull
requests.

Dependabot security updates open a pull request for each vulnerable
dependency that has a fixed version. The wizard asks whether to enable them and
defaults to no; answering no turns them off when they are on. This keeps
security fixes in pull requests you prepare yourself unless you opt in.

Secret scanning is free for public
repositories; private repositories need GitHub Secret Protection. When it is
unavailable, setup prints a warning and continues with the remaining settings.

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
