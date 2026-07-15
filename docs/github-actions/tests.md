# Tests Workflow

**File**: `.github/workflows/tests.yml`

## Prerequisites

- Push to `main` with application, package, workflow, or root toolchain changes
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
2. **Filter**: Detect application, package, workflow, and root toolchain changes
3. **Setup**: Install Node.js 24.x, cache dependencies, lint, and typecheck
4. **Prepare**: Prune monorepo and install dependencies (CI mode)
5. **Build**: Build the application
6. **Test**: Run test suite
7. **Required checks**: Aggregate required jobs into one Ruleset-compatible result

### Job Structure

| Job             | Purpose                                   | Conditions               |
| --------------- | ----------------------------------------- | ------------------------ |
| script-tests    | Test repository automation scripts        | Always runs              |
| changes         | Detect file changes in relevant paths     | Always runs              |
| setup           | Install, lint, and typecheck              | Runs if changes detected |
| test            | Build and test the application            | Runs if setup succeeds   |
| Required checks | Aggregate the required results for `main` | Always runs              |

### Change Detection

The workflow uses [dorny/paths-filter](https://github.com/dorny/paths-filter) to
detect changes:

| Target | Paths Monitored                                                                          |
| ------ | ---------------------------------------------------------------------------------------- |
| web    | `apps/web/**`, `packages/**`, `scripts/**`, the tests workflow, and root toolchain files |

Tests only run for a target if changes are detected in its monitored paths.
Manual dispatches run all targets so repository setup can verify the required
status check before protecting `main`.

### Commands Executed

The setup job runs `nps lint` and `nps typecheck` for the complete workspace.
For each affected application/package, the test job then runs:

1. **Prepare (CI)**: `nps prepare.ci.{target}`
   - Prunes monorepo to specific scope
   - Installs dependencies with frozen lockfile

2. **Build (CI)**: `nps build.ci.{target}`
   - Builds the target application/package

3. **Test (CI)**: `nps test.ci.{target}`
   - Runs test suite for the target

### Caching Strategy

- **Cache Key**: `${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`
- **Cache Path**: pnpm store directory from `pnpm store path`
- **Restore Keys**: Falls back to OS + pnpm prefix if exact match not found

This allows subsequent workflow runs to reuse cached dependencies when
`pnpm-lock.yaml` hasn't changed.
