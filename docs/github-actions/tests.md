# Tests Workflow

**File**: `.github/workflows/tests.yml`

## Prerequisites

- Push to `main` with application, package, script, workflow, or root toolchain
  changes other than Markdown under `apps/` and `packages/`
- Pull request against `main`
- Or manual trigger via GitHub Actions UI (`workflow_dispatch`)
- Node.js 24.x compatible environment
- pnpm 11.5.3 managed by Corepack with a lockfile present

## How It Works

The workflow always reports a `Required checks` result for pull requests while
using path filtering to skip expensive application checks when no relevant files
changed.

### Process

1. **Trigger**: Push/PR to `main` or manual dispatch
2. **Filter**: Detect script and web changes
3. **Script tests**: Typecheck and test the repository scripts
4. **Setup**: Install Node.js 24.x, cache dependencies, lint, and typecheck
5. **Prepare**: Prune monorepo and install dependencies (CI mode)
6. **Build**: Build the application for unit/component tests
7. **Test**: Run the unit/component test suite
8. **E2E**: Install Chromium, build through Turbo, and run Playwright
9. **Required checks**: Aggregate required jobs into one Ruleset-compatible result

### Job Structure

| Job             | Purpose                                   | Conditions              |
| --------------- | ----------------------------------------- | ----------------------- |
| changes         | Detect file changes in relevant paths     | Always runs             |
| script-tests    | Typecheck and test repository scripts     | Runs for script changes |
| setup           | Install, lint, and typecheck              | Runs for web changes    |
| test            | Build and test the application            | Runs if setup succeeds  |
| e2e             | Run Playwright against the built web app  | Runs for web changes    |
| Required checks | Aggregate the required results for `main` | Always runs             |

### Superseded Runs

A new push to a pull request cancels the run still in progress for it, since
that run no longer checks the pull request's head. Pushes to `main` are not
cancelled: they wait for the running check, and only the newest waiting run is
kept, so the latest `main` commit is always checked.

### Stacked Pull Requests

GitHub runs this workflow for every pull request in a stack, because each one
counts as targeting the stack base. A stack rebase pushes all of them at once,
so `script-tests`, `setup`, `test`, and `e2e` run only on two of them:

- **Lowest unmerged**: the pull request that targets the stack base directly
  and merges next.
- **Top**: the last pull request, which holds every change in the stack.

The `changes` job reports no changes for the pull requests in between, and
`Required checks` passes for them on `changes` alone. Once the pull requests
below one merge, GitHub rebases it onto the stack base and it runs the full
checks as the new lowest. Pull requests outside a stack always run the full
checks.

### Change Detection

The workflow uses [dorny/paths-filter](https://github.com/dorny/paths-filter) to
detect changes:

| Target  | Paths Monitored                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| scripts | `scripts/**` and the files their tests read: the workflows, the OpenCode agents and config, and `README.md` |
| web     | `apps/web/**`, `packages/**`, the tests workflow, and root toolchain files, except Markdown                 |

Both targets also watch `package.json` and `package-scripts.js`. Markdown under
the app and the packages is documentation, so it does not count as a web
change; remove the `!**/*.md` pattern if a build starts reading Markdown.

Tests only run for a target if changes are detected in its monitored paths.
Manual dispatches run all targets so repository setup can verify the required
status check before protecting `main`.

### Commands Executed

The script-tests job installs dependencies, then runs `nps typecheck.scripts`
and `nps test.ci.scripts`. The setup job runs `nps lint` and `nps typecheck`
for the complete workspace. For each affected application/package, the test
job then runs:

1. **Prepare (CI)**: `nps prepare.ci.{target}`
   - Prunes monorepo to specific scope
   - Installs dependencies with frozen lockfile

2. **Build (CI)**: `nps build.ci.{target}`
   - Builds the target application/package

3. **Test (CI)**: `nps test.ci.{target}`
   - Runs the unit/component test suite for the target

The E2E job runs in the official Playwright Docker image of the version that
`pnpm-lock.yaml` resolves (`node scripts/vrt/main.mts image`). The image ships
Chromium and its fonts, so screenshots render the same wherever it runs. The
job independently prunes the web workspace and runs
`nps test.ci.web.e2e.all`. Turbo builds the web app before Playwright and then
runs the desktop, tablet, and mobile Chromium projects. If E2E fails, the job
uploads `web-playwright-artifacts` containing the HTML report, screenshots,
videos, and traces that Playwright produced. They are kept for 3 days, since
they are large and count toward the account's shared artifact storage.

When E2E fails, the job also renders the VRT baselines again with
`--update-snapshots=changed`. If any screenshot is new or differs from the
committed baseline, it uploads those images as the `vrt-baselines` artifact
and lists them in the job summary. When the change is intended, run
`nps vrt.accept` on the branch: it copies the artifact of the newest run for
the checked-out commit into the tree, so you can review the images, commit
them, and push.

To render the baselines before pushing instead, run `nps vrt.update` with
Docker running. It packs the files git tracks or would track, prunes, installs
and builds the web app in the same Playwright image (as `linux/amd64`, like the
runners), and copies the new or changed baselines into the tree. Pass `--all`
(`nps "vrt.update --all"`) to rewrite every baseline.

The `Required checks` job requires `script-tests` to succeed when script paths
changed, and both the unit/component job and the E2E job to succeed when web
paths changed. Live tests against external deployments are opt-in and are
never part of this workflow.

### Caching Strategy

- **Cache Key**: `${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`
- **Cache Path**: `/tmp/pnpm-store` (`pnpm_config_store_dir`), the same path on
  the runner and in the Playwright container, so all jobs share one cache
- **Restore Keys**: Falls back to OS + pnpm prefix if exact match not found

This allows subsequent workflow runs to reuse cached dependencies when
`pnpm-lock.yaml` hasn't changed.
