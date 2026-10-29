# Release Drafter Workflow

**File**: `.github/workflows/release-drafter.yml`

## How It Works

The workflow labels pull requests and keeps one draft release up to date with
the pull requests merged into `main`:

- **Labels**: when a pull request is opened, reopened, pushed to or edited,
  against any base branch, the autolabeler of
  [release-drafter](https://github.com/release-drafter/release-drafter) (v7)
  applies the rules of `.github/release-drafter.yml`.
- **Draft**: when the Tests workflow passes on `main`,
  [repo-kit's `release-draft` workflow](https://github.com/craftsamo/repo-kit#release-draft-release-publish-release-sync)
  rewrites the draft from the pull requests whose merge commit landed on
  `main` since the last release, so every layer of a stacked pull request is
  listed. The draft targets the commit Tests passed on; a `main` commit that
  fails its checks leaves the draft at the last state that passed.

```sh
nps "release.draft --dry-run"
```

prints the draft the next run would write, without writing it. Publishing the
draft stays a manual step; see [Publishing a Release](#publishing-a-release).

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

The rules live in `.github/release-drafter.yml`, and every rule that matches
adds its label.

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

Labeling never removes a label. One added by hand stays, and so does one whose
rule stops matching: a `🌟major` added by a ticked box stays after the box is
unticked, so remove it by hand, before the merge, or the next draft raises the
major version.

Dependabot's own pull requests are not labeled by the workflow: a run
Dependabot starts gets a read-only token. Dependabot labels them
`dependencies` itself.

## Publishing a Release

Changes collect in the draft until it is published. Publish once the draft
lists what you want to release:

```sh
nps "release.publish --dry-run"
nps release.publish
```

or run the **Publish Release** workflow (`.github/workflows/publish-release.yml`)
from the Actions tab. Either one sets the root `package.json` version on `main`
to the draft's with a `chore(release): set the version to <version>` commit,
then publishes the draft on that commit, so the `v<version>` tag names a
commit that carries its version. It refuses while `main` has commits the
draft does not list yet.

The workflow pushes the version commit with the `RELEASE_DEPLOY_KEY` deploy
key, which `nps setup.github` creates; see
[GitHub Repository Setup](setup-github.md). `nps release.publish` pushes under
your own account instead, as the Ruleset allows for repository
administrators. Classic branch protection, which setup falls back to where
Rulesets are unavailable, has no deploy key bypass: publish with the command
there.

A release published on the Releases page tags the commit the draft targets,
which still carries the previous version; the workflow then sets the version
on `main` to the release's. Prefer the command or the workflow.
`nps release.sync` sets the version on `main` to the draft's without
publishing.

Only the root `package.json` follows the release. `apps/*/package.json` keep
their own versions, which the `Get details` workflow reads for the deployment
of each app.

### Rolling Back

A published release is a tag and a page, not a deployment, so a mistake is
corrected forward: revert the offending pull request on `main` and publish the
next patch. Deleting a release and its tag leaves the version in the history of
everyone who fetched it, so only do that for a release published by accident
before anyone could have seen it.
