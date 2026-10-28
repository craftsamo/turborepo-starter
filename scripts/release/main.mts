import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  api,
  CommandError,
  getRepositoryName,
  repositoryRoot,
  runCommand,
} from "../setup/github/lib.mts";
import {
  nextVersion,
  parseNotesConfig,
  pullRequestsInRange,
  releaseChanges,
  renderNotes,
  versionOfTag,
} from "./notes.mts";
import type { NotesConfig, PullRequest } from "./notes.mts";

const NOTES_CONFIG = ".github/release-notes.json";
// The search for merged pull requests starts this long before the commit the
// last release tagged. A pull request merged into another branch earlier,
// whose merge commit only reached main later, is still found within it.
const SEARCH_MARGIN_DAYS = 30;
// GitHub's search returns at most this many results for one query.
const SEARCH_LIMIT = 1000;

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
      "No draft release. The Release Drafter workflow creates one when a pull request merges into main.",
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
    `The draft release names v${version} as the\n` +
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

export function parseDraftArguments(argv: string[]): {
  target?: string;
  dryRun: boolean;
} {
  const values = [...argv];
  let target: string | undefined;
  let dryRun = false;
  while (values.length > 0) {
    const value = values.shift();
    if (value === "--dry-run") dryRun = true;
    else if (value === "--target") {
      target = values.shift();
      if (!target || !/^[0-9a-f]{7,40}$/.test(target)) {
        throw new Error("--target requires a commit SHA.");
      }
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return target === undefined ? { dryRun } : { target, dryRun };
}

const SEARCH_QUERY = `query($search: String!, $cursor: String) {
  search(query: $search, type: ISSUE, first: 100, after: $cursor) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number
        title
        mergedAt
        author { login }
        labels(first: 100) { nodes { name } }
        mergeCommit { oid }
      }
    }
  }
}`;

interface SearchPage {
  data: {
    search: {
      issueCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{
        number?: number;
        title?: string;
        mergedAt?: string | null;
        author?: { login: string } | null;
        labels?: { nodes: Array<{ name: string }> };
        mergeCommit?: { oid: string } | null;
      }>;
    };
  };
}

/** Every pull request merged into any branch of the repository since `since`. */
function mergedPullRequests(
  repository: string,
  since: string | undefined,
): PullRequest[] {
  const search = `repo:${repository} is:pr is:merged${since ? ` merged:>=${since}` : ""}`;
  const pullRequests: PullRequest[] = [];
  let cursor: string | null = null;
  do {
    const args = [
      "api",
      "graphql",
      "-f",
      `query=${SEARCH_QUERY}`,
      "-f",
      `search=${search}`,
    ];
    if (cursor) args.push("-f", `cursor=${cursor}`);
    const page = (JSON.parse(runCommand("gh", args)) as SearchPage).data.search;
    if (page.issueCount > SEARCH_LIMIT) {
      throw new Error(
        `${page.issueCount} pull requests merged since the last release, more than GitHub's search returns; publish a release to start a new range.`,
      );
    }
    for (const node of page.nodes) {
      if (!node.number || !node.mergeCommit || !node.mergedAt) continue;
      pullRequests.push({
        number: node.number,
        title: node.title ?? "",
        // A deleted account shows as ghost, as it does on GitHub.
        author: node.author?.login ?? "ghost",
        labels: (node.labels?.nodes ?? []).map(({ name }) => name),
        mergedAt: node.mergedAt,
        mergeCommit: node.mergeCommit.oid,
      });
    }
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return pullRequests;
}

function latestReleaseTag(repository: string): string | undefined {
  try {
    return api<{ tag_name: string }>(
      "GET",
      `/repos/${repository}/releases/latest`,
    )!.tag_name;
  } catch (error) {
    if (error instanceof CommandError && error.httpStatus === 404) {
      return undefined;
    }
    throw error;
  }
}

function sinceDate(tag: string): string {
  const committed = new Date(git(["log", "-1", "--format=%cI", tag]));
  committed.setUTCDate(committed.getUTCDate() - SEARCH_MARGIN_DAYS);
  return committed.toISOString().slice(0, 10);
}

/**
 * Point the one draft release at `target` with the given tag, name and notes,
 * creating it when there is none.
 */
function writeDraft(
  repository: string,
  release: { tag_name: string; name: string; body: string },
  target: string,
): string {
  const drafts = api<Release[]>(
    "GET",
    `/repos/${repository}/releases?per_page=100`,
  )!.filter((candidate) => candidate.draft);
  if (drafts.length > 1) {
    throw new Error(
      `Several draft releases (${drafts.map((d) => d.tag_name).join(", ")}); delete the stale ones.`,
    );
  }
  const payload = { ...release, target_commitish: target, draft: true };
  const written = drafts[0]
    ? api<Release>(
        "PATCH",
        `/repos/${repository}/releases/${drafts[0].id}`,
        payload,
      )
    : api<Release>("POST", `/repos/${repository}/releases`, payload);
  return written!.html_url;
}

/**
 * Draft the next release from the pull requests whose merge commit landed on
 * main since the last release, up to `--target` (the head of main by
 * default). It prints the version and, in a workflow, sets the `version`
 * output for the step that sets it on main. With nothing to release it
 * leaves the draft alone and sets no output. --dry-run prints the draft
 * without writing it.
 */
function draft(argv: string[]): void {
  const { target: given, dryRun } = parseDraftArguments(argv);
  const repository = process.env.GITHUB_REPOSITORY ?? getRepositoryName();
  const config: NotesConfig = parseNotesConfig(
    readFileSync(path.join(repositoryRoot, NOTES_CONFIG), "utf8"),
  );

  git(["fetch", "--quiet", "--tags", "origin", "main"]);
  const target = given ?? git(["rev-parse", "origin/main"]);
  const lastTag = latestReleaseTag(repository);
  const lastVersion = lastTag ? versionOfTag(lastTag, config) : "0.0.0";
  if (lastVersion === undefined) {
    throw new Error(
      `The latest release's tag "${lastTag}" is not ${config.tagPrefix}<major>.<minor>.<patch>.`,
    );
  }

  const range = lastTag ? `${lastTag}..${target}` : target;
  const commits = new Set(git(["rev-list", range]).split("\n").filter(Boolean));
  const pullRequests = pullRequestsInRange(
    mergedPullRequests(repository, lastTag ? sinceDate(lastTag) : undefined),
    commits,
  );
  const changes = releaseChanges(pullRequests, config);
  if (!changes) {
    console.log(
      `Nothing to release since ${lastTag ?? "the start of the history"}.`,
    );
    return;
  }

  const version = nextVersion(lastVersion, changes.increment);
  const release = {
    tag_name: `${config.tagPrefix}${version}`,
    name: config.name.replaceAll("{version}", version),
    body: renderNotes(changes.sections, config),
  };
  console.log(
    `${release.name}: ${pullRequests.length} pull request(s) since ${lastTag ?? "the start of the history"}, ${changes.increment} increment, target ${target.slice(0, 7)}.`,
  );
  if (dryRun) {
    console.log(`\n${release.body}`);
    return;
  }
  console.log(`Drafted ${writeDraft(repository, release, target)}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  }
}

const commands: Record<string, (argv: string[]) => void | Promise<void>> = {
  draft,
  sync,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name = "", ...argv] = process.argv.slice(2);
  const command = commands[name];
  if (!command) {
    console.error(
      "Usage: node scripts/release/main.mts draft [--target SHA] [--dry-run] | sync [--version X.Y.Z]",
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
