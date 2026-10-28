import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  api,
  getRepositoryName,
  repositoryRoot,
  runCommand,
} from "../setup/github/lib.mts";

export interface Release {
  id: number;
  draft: boolean;
  tag_name: string;
  name: string;
  html_url: string;
}

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * The version a draft release resolves to: its tag without the `v` prefix.
 * Release Drafter keeps one draft, so a second one is an error to resolve
 * before syncing, not a choice to make here.
 */
export function draftVersion(releases: Release[]): {
  version: string;
  draft: Release;
} {
  const drafts = releases.filter((release) => release.draft);
  if (drafts.length === 0) {
    throw new Error(
      "No draft release. Release Drafter creates one when a pull request merges into main.",
    );
  }
  if (drafts.length > 1) {
    throw new Error(
      `Several draft releases (${drafts.map((d) => d.tag_name).join(", ")}); delete the stale ones.`,
    );
  }
  const draft = drafts[0]!;
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(draft.tag_name);
  if (!match) {
    throw new Error(
      `The draft's tag "${draft.tag_name}" is not v<major>.<minor>.<patch>.`,
    );
  }
  return { version: match[1]!, draft };
}

/**
 * The package manifest with its version replaced and nothing else touched:
 * the field is rewritten in place so the file keeps its formatting. Only the
 * top-level field, at one level of indentation, counts; a nested "version"
 * key such as a script name is left alone.
 */
export function bumpedManifest(manifest: string, version: string): string {
  const pattern = /^( {2}"version"\s*:\s*")([^"]*)(")/m;
  if (!pattern.test(manifest)) {
    throw new Error("package.json has no top-level version field.");
  }
  return manifest.replace(pattern, `$1${version}$3`);
}

/**
 * The subject and body of the version bump commit. The commit is made with
 * hooks off, so the tests hold the message to the commitlint rules instead.
 */
export function bumpMessage(version: string): [string, string] {
  return [
    `chore(release): set the version to ${version}`,
    `Release Drafter resolved v${version} as the\n` +
      "next release. Publishing the draft tags main, so the tagged commit\n" +
      "names the version it releases.",
  ];
}

export function currentVersion(manifest: string): string {
  return (JSON.parse(manifest) as { version?: string }).version ?? "";
}

export function parseSyncArguments(argv: string[]): { version?: string } {
  const values = [...argv];
  let version: string | undefined;
  while (values.length > 0) {
    const value = values.shift();
    if (value === "--version") {
      version = values.shift();
      if (!version || !VERSION.test(version)) {
        throw new Error("--version requires <major>.<minor>.<patch>.");
      }
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return version === undefined ? {} : { version };
}

function git(args: string[], cwd: string = repositoryRoot): string {
  return runCommand("git", ["-C", cwd, ...args]);
}

/**
 * Set the root package version in the given checkout of main to `version`
 * and push the commit to main. Returns false when main already carries it.
 */
function bumpAndPush(workTree: string, version: string): boolean {
  const file = path.join(workTree, "package.json");
  const manifest = readFileSync(file, "utf8");
  if (currentVersion(manifest) === version) return false;
  writeFileSync(file, bumpedManifest(manifest, version));
  git(["add", "package.json"], workTree);
  // The checkout may have no node_modules, so the commit-msg hook's
  // commitlint cannot run there; bumpMessage follows the convention it
  // checks.
  const [subject, body] = bumpMessage(version);
  git(
    [
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      subject,
      "-m",
      body,
    ],
    workTree,
  );
  git(["push", "origin", "HEAD:refs/heads/main"], workTree);
  return true;
}

/**
 * Set the root package version on main to the draft release's. With
 * --version, the version is given (Release Drafter passes the one it just
 * resolved) and the current directory is the checkout of main to commit in.
 * Without it, the draft is read from GitHub and the commit is made in a
 * temporary worktree, so the checked-out branch is left alone.
 */
function sync(argv: string[]): void {
  const { version: given } = parseSyncArguments(argv);
  if (given !== undefined) {
    const pushed = bumpAndPush(process.cwd(), given);
    console.log(
      pushed
        ? `Set the version to ${given} on main.`
        : `main is already at ${given}.`,
    );
    return;
  }

  const repository = getRepositoryName();
  const releases = api<Release[]>(
    "GET",
    `/repos/${repository}/releases?per_page=30`,
  )!;
  const { version, draft } = draftVersion(releases);
  console.log(`Draft release: ${draft.name} (${draft.tag_name})`);

  git(["fetch", "origin", "main"]);
  const base = git(["rev-parse", "origin/main"]);
  const workTree = mkdtempSync(path.join(tmpdir(), "release-"));
  let pushed: boolean;
  try {
    git(["worktree", "add", "--detach", workTree, base]);
    pushed = bumpAndPush(workTree, version);
  } finally {
    try {
      git(["worktree", "remove", "--force", workTree]);
    } catch {
      rmSync(workTree, { recursive: true, force: true });
      git(["worktree", "prune"]);
    }
  }
  console.log(
    pushed
      ? `Set the version to ${version} on main. Publish the draft: ${draft.html_url}`
      : `main is already at ${version}; publish the draft: ${draft.html_url}`,
  );
}

const commands: Record<string, (argv: string[]) => void | Promise<void>> = {
  sync,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name = "", ...argv] = process.argv.slice(2);
  const command = commands[name];
  if (!command) {
    console.error(
      "Usage: node scripts/release/main.mts sync [--version X.Y.Z]",
    );
    process.exitCode = 2;
  } else {
    try {
      await command(argv);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
