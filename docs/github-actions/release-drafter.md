# Release Drafter Workflow

**File**: `.github/workflows/release-drafter.yml`

## Prerequisites

- Pull requests must be **opened or reopened**, against any base branch
- Or the Tests workflow completes successfully on `main`
- Pull requests must have labels matching `.github/release-drafter.yml`
  (labeling) and `.github/release-notes.json` (notes and version)
- The labeling job needs `pull-requests: write`; the drafting job needs
  `contents: write`

## How It Works

The workflow labels pull requests and keeps a draft release up to date with
the pull requests merged into `main`. Labeling uses the autolabeler of
[release-drafter](https://github.com/release-drafter/release-drafter) (v7);
the draft is written by `scripts/release`. Publishing the draft stays a manual
step.

### Process

1. **Trigger**: PR opened/reopened (labels only) or a successful Tests run
   on `main` (draft only)
2. **Auto-label**: Apply labels based on the branch name, the changed files
   and the description
3. **Collect**: Find the pull requests whose merge commit landed on `main`
   since the last published release
4. **Categorize**: Group them by label (Features, Bug Fixes, Enhancements,
   Documentation, Dependencies, Maintenance, Other Changes)
5. **Resolve Version**: Calculate the version bump from the labels
6. **Generate**: Create or update the one draft release

The workflow runs one job per event: `label_pull_request` on a pull request
and `update_release_draft` after a Tests run. A newer run for the same pull
request or branch cancels the one still in progress, since each run rebuilds
the labels or the draft from the current state.

Labels follow the branch name, which a later push does not change, so a push
to a pull request does not run the workflow.

A pull request run only applies labels, whatever the base branch: a stack
opens each upper pull request on the branch below it and links it to the stack
only afterwards, so a `main` filter would miss it. Only `main` redrafts the
release; a draft built from a pull request run would target the pull request's
merge ref instead of `main`.

### Stacked Pull Requests

A stack merged in one go lands every layer on `main` with one merge commit,
but only its lowest pull request targeted `main`; the upper ones merged into
the branch below them. Release Drafter's own drafting finds a pull request
through the commits it brought to `main`'s history, which only counts pull
requests that targeted `main`, so it would leave the upper layers out of the
notes and their labels out of the version.

`scripts/release` instead searches the pull requests merged since the last
release, in any branch, and keeps those whose merge commit is in the range of
the release. Every layer of a stack records the same merge commit, so every
layer is listed, however many there are. A pull request merged into another
long-lived branch is left out, since its merge commit is not in the range.

```sh
nps "release.draft --dry-run"
```

prints the draft the next run would write, without writing it.

### Drafting After Tests

The draft follows `main` through the Tests workflow rather than the push
itself: `update_release_draft` runs on `workflow_run` when Tests completes on
`main`, and only when it succeeded on a push or a manual run (never on a pull
request, whose head branch a fork may also call `main`). The draft targets the
commit Tests passed on, so publishing it tags exactly what was checked. A
`main` commit that fails its checks leaves the draft at the last state that
passed, and the next successful run catches the draft up. Tests runs on every
push to `main`, including one that only touches documentation, so every `main`
commit reaches this trigger. Re-running a failed Tests run, or dispatching it
manually on `main`, redrafts once it passes.

With nothing to release since the last release (no pull request, or only
`skip-changelog` ones), the run leaves the draft and the version alone.

### Release Naming

| Component    | Format            | Example              |
| ------------ | ----------------- | -------------------- |
| Release name | `v<version> 🚀`   | `v1.2.3 🚀`          |
| Git tag      | `v<version>`      | `v1.2.3`             |
| Change entry | PR title + author | `Title @user (#123)` |

`name` and `tagPrefix` in `.github/release-notes.json` set the first two.

### Change Categories

Each merged pull request appears once, under the first category whose label it
carries. A pull request with none of these labels lands under Other Changes,
and one labeled `skip-changelog` is left out of the notes altogether. The
categories live in `.github/release-notes.json`.

| Category         | Labels              |
| ---------------- | ------------------- |
| 🚀 New Features  | `🌱feature`         |
| 🐛 Bug Fixes     | `🐛bug`, `🐞hotfix` |
| ⚒️ Enhancement   | `⚒️enhancement`     |
| 📄 Documentation | `📝documentation`   |
| ⬆️ Dependencies  | `dependencies`      |
| 🔧 Maintenance   | `🔧maintenance`     |
| 🧰 Other Changes | (none of the above) |

Area labels such as `🌐app: web` do not pick a category.

### Version Resolution

The highest bump among the merged pull requests wins, counted from the last
published release that is not a prerelease (`0.0.0` before the first):

| Version Type | Trigger Labels                     |
| ------------ | ---------------------------------- |
| Major        | `🌟major`                          |
| Minor        | `🌱feature`                        |
| Patch        | Every other pull request (default) |

### Auto-labeling Rules

Labels are applied when a pull request is opened or reopened. The rules live
in `.github/release-drafter.yml`, and every rule that matches adds its label.

**Type** follows the branch name, whose prefix is the commit type of the
change (`/` or `-` after it). It picks the release notes category.

| Branch prefix                                     | Label             |
| ------------------------------------------------- | ----------------- |
| `feat`                                            | `🌱feature`       |
| `enhance`, `improve`, `refactor`, `perf`          | `⚒️enhancement`   |
| `fix`                                             | `🐛bug`           |
| `hotfix`                                          | `🐞hotfix`        |
| `docs`                                            | `📝documentation` |
| `ci`, `build`, `chore`, `test`, `style`, `revert` | `🔧maintenance`   |
| `deps`, `dependabot`                              | `dependencies`    |

The type never follows the changed files: most pull requests touch Markdown
such as `AGENTS.md` or `docs/` alongside the code, so a `*.md` rule would mark
nearly everything as documentation.

**Breaking change**: a ticked `Yes` under Breaking Changes in the description,
as the pull request template asks, adds `🌟major`.

**Area** follows the changed files, compared with the pull request's base, so
each layer of a stack gets the areas it changes itself. Areas do not affect
the release notes or the version.

| Changed files under | Label               |
| ------------------- | ------------------- |
| `apps/web/`         | `🌐app: web`        |
| `packages/<name>/`  | `📦package: <name>` |
| `.github/`          | `🔄workflows`       |
| `scripts/`          | `🛠️scripts`         |

A new app or package needs a rule in `.github/release-drafter.yml` and its
label in `.github/labels.yml`; `scripts/tests/labels.test.mjs` fails until
both exist.

### Version on `main`

After redrafting, the same job sets the root `package.json` version on `main`
to the draft's version, when it differs, with a
`chore(release): set the version to <version>` commit by `github-actions[bot]`.
So `main` always names the release it is heading for, and the commit a release
tags carries its version.

The push uses the release deploy key, whose private half is the
`RELEASE_DEPLOY_KEY` secret. `nps setup.github` creates the key and the secret,
and adds deploy keys as a bypass actor of the `Starter: protect main` Ruleset,
so the push goes straight to `main`. GitHub accepts GitHub Actions itself as a
bypass actor only on organization repositories, which is why a key is used:
it works on personal repositories as well. Any workflow of this repository can
read the secret and so push to `main`; a fork's workflow cannot read it.

Unlike a push with `GITHUB_TOKEN`, a push with the key starts workflows: Tests
runs on the bump commit, and the redraft that follows targets it, finds the
version already set and pushes nothing, so it cannot loop. If `main` moves
between the checkout and the push, the push is rejected and the job fails; the
Tests run of that new commit redrafts and bumps again, so nothing needs doing.
Without the secret, the job warns and leaves the version alone. Classic branch
protection, which the setup falls back to where Rulesets are unavailable, has
no such bypass: there the bump fails and the manual command below is the way.

```sh
nps release.sync
```

`release.sync` does the same by hand, for when Actions cannot run: it reads the
one draft release, takes the version from its tag, commits the bump in a
temporary worktree so the checked-out branch is left alone, and pushes it to
`main` under your own account, which the Ruleset allows for repository
administrators. When `main` already carries the version, it says so and
changes nothing.

Only the root `package.json` follows the release. `apps/*/package.json` keep
their own versions, which the `Get details` workflow reads for the deployment
of each app.

## Publishing a Release

Open the draft under Releases, read the notes, and publish it. GitHub creates
the `v<version>` tag on the commit the draft targets. Publish once the run that
follows the version bump has redrafted: the draft then targets the bump commit,
which carries the version.

A pull request that merges before publishing can move the draft to another
version: a feature raises the minor, a `🌟major` label the major. The workflow
follows it on the next successful Tests run, and sets the new version on
`main` the same way.

### Rolling Back

A published release is a tag and a page, not a deployment, so a mistake is
corrected forward: revert the offending pull request on `main` and publish the
next patch. Deleting a release and its tag leaves the version in the history of
everyone who fetched it, so only do that for a release published by accident
before anyone could have seen it.
