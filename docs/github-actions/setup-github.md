# GitHub Repository Setup

**Command**: `nps setup.github`, which runs
[`repo-kit setup github`](https://github.com/craftsamo/repo-kit#setup-github)

## Prerequisites

- The repository has a `main` branch containing this starter
- [GitHub CLI](https://cli.github.com/) is installed and authenticated
- The authenticated account has repository administrator permission
- Organization policies allow repository-level Actions and Ruleset changes

## Run It

```sh
nps setup.github
```

Setup shows every change it would make and asks before applying them. NPS
needs the command and its options in quotes:

```sh
nps "setup.github --dry-run --defaults"
nps "setup.github --defaults --yes"
```

repo-kit's README lists everything setup manages and every option. In this
repository it applies:

- The labels of `.github/labels.yml`, pruning undeclared ones
- A `Protect main` Ruleset requiring the `Required checks` job of `tests.yml`,
  setup's defaults, so the starter passes no `--required-check` or
  `--ci-workflow`
- The `RELEASE_DEPLOY_KEY` deploy key, since the Publish Release workflow reads
  it to push the version bump to `main`, and the deploy-key bypass of the
  Ruleset that push needs
- An Actions allowlist of the reusable workflows and third-party actions the
  workflows use, so run setup again after adding one

Any workflow of this repository can read `RELEASE_DEPLOY_KEY` and so push to
`main`; review workflow changes with that in mind. A fork's workflow cannot
read it.

Earlier versions named the Ruleset `Starter: protect main`; setup leaves a
Ruleset of that name alone, so delete it under **Settings → Rules →
Rulesets** once `Protect main` is in place.

## Secrets

`nps setup.github.secrets` runs `repo-kit setup secrets`. Without options it
asks for the `/oc` provider keys; set only the providers you use. For another
secret:

```sh
nps "setup.github.secrets --scope repository --name API_TOKEN"
nps "setup.github.secrets --environment production --name DATABASE_URL"
```

Repositories set up before the OpenCode V2 workflow may still have the old
`AI_*` variables and `COPILOT_*` secrets. Nothing reads them anymore; remove
them with `gh variable delete <name>` and `gh secret delete <name>`.
