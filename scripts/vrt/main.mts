import { spawn } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  api,
  getRepositoryName,
  repositoryRoot,
  runCommand,
} from "../setup/github/lib.mts";

export const ARTIFACT_NAME = "vrt-baselines";

// Playwright keeps a spec's screenshots in a sibling `<spec>-snapshots`
// directory. Only such files are ever copied, so an artifact cannot write
// anywhere else in the repository.
const SNAPSHOT_PATH =
  /^(?:apps|packages)\/[\w.-]+\/(?:[\w.-]+\/)*[\w.-]+-snapshots\/[\w.-]+\.png$/;
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "playwright-report",
  "test-results",
]);

export interface ArtifactRun {
  id: number;
  head_branch: string | null;
  head_sha: string;
}

export interface Artifact {
  id: number;
  name: string;
  expired: boolean;
  created_at: string;
  workflow_run?: ArtifactRun | null;
}

export interface ArtifactQuery {
  branch: string;
  headSha: string;
  runId?: number | undefined;
  force?: boolean | undefined;
}

/**
 * The official Playwright image of the version the lockfile resolves. CI and
 * `nps vrt.update` render screenshots in it, so baselines match everywhere.
 */
export function playwrightImage(lockfile: string): string {
  const versions = new Set(
    [...lockfile.matchAll(/^ {2}playwright@(\d+\.\d+\.\d+):/gm)].map(
      ([, version]) => version,
    ),
  );
  const [version] = versions;
  if (versions.size !== 1 || !version) {
    throw new Error(
      `pnpm-lock.yaml must resolve exactly one playwright version; found ${[...versions].join(", ") || "none"}.`,
    );
  }
  return `mcr.microsoft.com/playwright:v${version}-noble`;
}

export function isSnapshotPath(file: string): boolean {
  return (
    SNAPSHOT_PATH.test(file) &&
    !file.split("/").some((segment) => segment === "." || segment === "..")
  );
}

/** Repository-relative paths of the snapshots under `root`'s apps and packages. */
export function listSnapshots(root: string): string[] {
  const found: string[] = [];
  const walk = (relative: string): void => {
    const directory = path.join(root, relative);
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(file);
      } else if (entry.isFile() && isSnapshotPath(file)) {
        found.push(file);
      }
    }
  };
  walk("apps");
  walk("packages");
  return found.sort();
}

/** Snapshots under `source` that are new or differ from the ones in `repository`. */
export function changedSnapshots(source: string, repository: string): string[] {
  return listSnapshots(source).filter((file) => {
    const committed = path.join(repository, file);
    return (
      !existsSync(committed) ||
      !readFileSync(committed).equals(readFileSync(path.join(source, file)))
    );
  });
}

export function copySnapshots(files: string[], from: string, to: string): void {
  for (const file of files) {
    if (!isSnapshotPath(file)) {
      throw new Error(`Refusing to copy ${file}: it is not a VRT baseline.`);
    }
    const target = path.join(to, file);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(from, file), target);
  }
}

/**
 * The newest unexpired baselines artifact for the branch. It must come from the
 * commit checked out locally, unless forced, so baselines rendered from another
 * state of the branch are not committed by mistake.
 */
export function pickArtifact(
  artifacts: Artifact[],
  { branch, headSha, runId, force = false }: ArtifactQuery,
): Artifact & { workflow_run: ArtifactRun } {
  const candidates = artifacts
    .filter(
      (artifact): artifact is Artifact & { workflow_run: ArtifactRun } =>
        artifact.name === ARTIFACT_NAME &&
        !artifact.expired &&
        artifact.workflow_run?.head_branch === branch &&
        (runId === undefined || artifact.workflow_run.id === runId),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const newest = candidates[0];
  if (!newest) {
    throw new Error(
      `No ${ARTIFACT_NAME} artifact for ${branch}${runId === undefined ? "" : ` in run ${runId}`}. ` +
        "A Tests run uploads one when screenshots change, and the Update VRT baselines workflow on demand; it expires after 7 days.",
    );
  }
  if (!force && newest.workflow_run.head_sha !== headSha) {
    throw new Error(
      `The newest baselines for ${branch} were rendered from ${newest.workflow_run.head_sha.slice(0, 7)}, but HEAD is ${headSha.slice(0, 7)}. ` +
        "Push HEAD and wait for its Tests run, or pass --force to take them anyway.",
    );
  }
  return newest;
}

export function parseAcceptArguments(argv: string[]): {
  runId?: number;
  force: boolean;
} {
  const values = [...argv];
  let runId: number | undefined;
  let force = false;
  while (values.length > 0) {
    const value = values.shift();
    if (value === "--force") force = true;
    else if (value === "--run") {
      runId = Number(values.shift());
      if (!Number.isInteger(runId) || runId <= 0) {
        throw new Error("--run requires a workflow run ID.");
      }
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return runId === undefined ? { force } : { runId, force };
}

function git(args: string[]): string {
  return runCommand("git", args);
}

function printAccepted(files: string[]): void {
  if (files.length === 0) {
    console.log("No baseline changed.");
    return;
  }
  console.log(`Copied ${files.length} baseline(s):`);
  for (const file of files) console.log(`  ${file}`);
  console.log(
    "\nReview the images, then commit them, for example:\n" +
      `  git add ${[...new Set(files.map((file) => path.posix.dirname(file)))].join(" ")}\n` +
      '  git commit -m "test(web): update VRT baselines"',
  );
}

/** Copy the baselines CI rendered for the checked-out commit into the tree. */
function accept(argv: string[]): void {
  const { runId, force } = parseAcceptArguments(argv);
  const repository = getRepositoryName();
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const headSha = git(["rev-parse", "HEAD"]);
  const { artifacts } = api<{ artifacts: Artifact[] }>(
    "GET",
    `/repos/${repository}/actions/artifacts?name=${ARTIFACT_NAME}&per_page=100`,
  )!;
  const artifact = pickArtifact(artifacts, { branch, headSha, runId, force });
  const download = mkdtempSync(path.join(tmpdir(), "vrt-"));
  try {
    runCommand("gh", [
      "run",
      "download",
      String(artifact.workflow_run.id),
      "--repo",
      repository,
      "--name",
      ARTIFACT_NAME,
      "--dir",
      download,
    ]);
    const files = listSnapshots(download);
    copySnapshots(files, download, repositoryRoot);
    printAccepted(files);
  } finally {
    rmSync(download, { recursive: true, force: true });
  }
}

/**
 * In CI: copy the snapshots under `source` that differ from the checkout into
 * `destination`, report whether any did, and list them in the job summary.
 */
function collect([source, destination]: string[]): void {
  if (!source || !destination) {
    throw new Error("Usage: collect <rendered tree> <artifact directory>");
  }
  const files = changedSnapshots(path.resolve(source), repositoryRoot);
  copySnapshots(files, source, destination);
  const { GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `changed=${files.length > 0}\n`);
  }
  if (GITHUB_STEP_SUMMARY && files.length > 0) {
    appendFileSync(
      GITHUB_STEP_SUMMARY,
      [
        "## VRT baselines changed",
        "",
        `${files.length} screenshot(s) no longer match the committed baselines. ` +
          "If the change is intended, run `nps vrt.accept` on this branch, review the images, and commit them.",
        "",
        ...files.map((file) => `- \`${file}\``),
        "",
      ].join("\n"),
    );
  }
  console.log(
    files.length > 0
      ? `Changed baselines:\n${files.map((file) => `  ${file}`).join("\n")}`
      : "No baseline changed.",
  );
}

function lockfileImage(): string {
  return playwrightImage(
    readFileSync(path.join(repositoryRoot, "pnpm-lock.yaml"), "utf8"),
  );
}

function image(): void {
  console.log(lockfileImage());
}

export function parseUpdateArguments(argv: string[]): { all: boolean } {
  let all = false;
  for (const value of argv) {
    if (value === "--all") all = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return { all };
}

// Mirrors the e2e job: prune and install the web app, build it, and render the
// VRT spec, then hand the snapshot directories back through /out.
const RENDER_SCRIPT = `set -euo pipefail
tar -xf - --warning=no-unknown-keyword
corepack enable
npx nps prepare.ci.web
npx nps build.ci.web
(cd out/apps/web && VRT_UPDATE=1 pnpm exec playwright test e2e/vrt.spec.ts --update-snapshots="$SNAPSHOT_MODE")
cd out
find apps packages -name node_modules -prune -o -path '*-snapshots/*.png' -exec cp --parents {} /out \\;
chown -R "$HOST_UID:$HOST_GID" /out`;

// `exit`, not `close`: tar's output stays open in this process while docker
// reads it, so tar's `close` never comes.
function exitCode(child: ReturnType<typeof spawn>): Promise<number | null> {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
}

/**
 * Render the VRT baselines in the Playwright image CI uses, from the files git
 * tracks or would track, and copy the new or changed ones into the tree.
 */
async function update(argv: string[]): Promise<void> {
  const { all } = parseUpdateArguments(argv);
  const playwright = lockfileImage();
  try {
    runCommand("docker", ["info", "--format", "{{.ServerVersion}}"]);
  } catch (error) {
    throw new Error("Docker is not running; start it and try again.", {
      cause: error,
    });
  }
  const files = git(["ls-files", "-z", "-co", "--exclude-standard"])
    .split("\0")
    .filter((file) => {
      const full = path.join(repositoryRoot, file);
      return file && existsSync(full) && statSync(full).isFile();
    });
  const output = mkdtempSync(path.join(tmpdir(), "vrt-update-"));
  try {
    console.log(`Rendering VRT baselines in ${playwright} (linux/amd64)...`);
    const tar = spawn(
      "tar",
      [
        ...(process.platform === "darwin" ? ["--no-mac-metadata"] : []),
        "-c",
        "-f",
        "-",
        "--null",
        "-T",
        "-",
      ],
      {
        cwd: repositoryRoot,
        env: { ...process.env, COPYFILE_DISABLE: "1" },
        stdio: ["pipe", "pipe", "inherit"],
      },
    );
    tar.stdin.end(`${files.join("\0")}\0`);
    const docker = spawn(
      "docker",
      [
        "run",
        "--rm",
        "-i",
        "--init",
        "--ipc=host",
        // CI renders on x86-64 runners; another architecture could round
        // differently.
        "--platform",
        "linux/amd64",
        "--workdir",
        "/work",
        "--volume",
        `${output}:/out`,
        // Keeps downloaded packages between runs.
        "--volume",
        "vrt-pnpm-store:/pnpm-store",
        "--env",
        "CI=1",
        "--env",
        "COREPACK_ENABLE_DOWNLOAD_PROMPT=0",
        "--env",
        "pnpm_config_store_dir=/pnpm-store",
        "--env",
        `SNAPSHOT_MODE=${all ? "all" : "changed"}`,
        "--env",
        `HOST_UID=${process.getuid?.() ?? 0}`,
        "--env",
        `HOST_GID=${process.getgid?.() ?? 0}`,
        playwright,
        "bash",
        "-c",
        RENDER_SCRIPT,
      ],
      { stdio: [tar.stdout, "inherit", "inherit"] },
    );
    // A failed render closes the pipe early, so its exit code explains more
    // than tar's.
    const [tarCode, dockerCode] = await Promise.all([
      exitCode(tar),
      exitCode(docker),
    ]);
    if (dockerCode !== 0) {
      throw new Error(
        `Rendering failed (exit code ${dockerCode}); see the output above.`,
      );
    }
    if (tarCode !== 0) {
      throw new Error(`Packing the files failed (exit code ${tarCode}).`);
    }
    const changed = changedSnapshots(output, repositoryRoot);
    copySnapshots(changed, output, repositoryRoot);
    printAccepted(changed);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}

const commands: Record<string, (argv: string[]) => void | Promise<void>> = {
  accept,
  collect,
  image,
  update,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name = "", ...argv] = process.argv.slice(2);
  const command = commands[name];
  if (!command) {
    console.error(
      "Usage: node scripts/vrt/main.mts accept|collect|image|update",
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
