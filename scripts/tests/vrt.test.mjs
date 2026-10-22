import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  ARTIFACT_NAME,
  baselineArtifacts,
  changedSnapshots,
  copySnapshots,
  isSnapshotPath,
  listSnapshots,
  ownRuns,
  parseAcceptArguments,
  parseUpdateArguments,
  playwrightImage,
} from "../vrt/main.mts";

const SNAPSHOTS = "apps/web/e2e/vrt.spec.ts-snapshots";

function write(root, file, content) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

describe("playwrightImage", () => {
  const lockfile = (...versions) =>
    [
      "packages:",
      "",
      "  '@playwright/test@1.61.1':",
      ...versions.flatMap((version) => [
        `  playwright@${version}:`,
        `    resolution: {integrity: sha512-x}`,
      ]),
      "",
      "snapshots:",
      "",
      ...versions.map((version) => `  playwright@${version}: {}`),
    ].join("\n");

  it("names the image of the resolved version", () => {
    assert.equal(
      playwrightImage(lockfile("1.61.1")),
      "mcr.microsoft.com/playwright:v1.61.1-noble",
    );
  });

  it("refuses zero or several versions", () => {
    assert.throws(() => playwrightImage(lockfile()), /found none/);
    assert.throws(
      () => playwrightImage(lockfile("1.61.1", "1.62.0")),
      /found 1\.61\.1, 1\.62\.0/,
    );
  });
});

describe("isSnapshotPath", () => {
  it("accepts a baseline next to a spec", () => {
    assert.ok(isSnapshotPath(`${SNAPSHOTS}/home-light-desktop-linux.png`));
    assert.ok(
      isSnapshotPath("packages/ui/tests/button.spec.ts-snapshots/a.png"),
    );
  });

  it("rejects anything else", () => {
    for (const file of [
      `${SNAPSHOTS}/home.txt`,
      "apps/web/src/home.png",
      "scripts/x.spec.ts-snapshots/a.png",
      `apps/web/../../.github/x.spec.ts-snapshots/a.png`,
      `apps/./web/e2e/vrt.spec.ts-snapshots/a.png`,
      `/apps/web/e2e/vrt.spec.ts-snapshots/a.png`,
    ]) {
      assert.equal(isSnapshotPath(file), false, file);
    }
  });
});

describe("snapshot trees", () => {
  let source;
  let repository;

  beforeEach(() => {
    source = mkdtempSync(path.join(tmpdir(), "vrt-source-"));
    repository = mkdtempSync(path.join(tmpdir(), "vrt-repository-"));
  });

  afterEach(() => {
    rmSync(source, { recursive: true, force: true });
    rmSync(repository, { recursive: true, force: true });
  });

  it("lists the baselines outside build and dependency folders", () => {
    write(source, `${SNAPSHOTS}/a.png`, "a");
    write(source, "apps/web/node_modules/x/y.spec.ts-snapshots/b.png", "b");
    write(source, "apps/web/test-results/x.spec.ts-snapshots/c.png", "c");
    write(source, "apps/web/e2e/notes.md", "d");
    assert.deepEqual(listSnapshots(source), [`${SNAPSHOTS}/a.png`]);
  });

  it("finds the new and changed baselines only", () => {
    write(source, `${SNAPSHOTS}/same.png`, "same");
    write(repository, `${SNAPSHOTS}/same.png`, "same");
    write(source, `${SNAPSHOTS}/changed.png`, "after");
    write(repository, `${SNAPSHOTS}/changed.png`, "before");
    write(source, `${SNAPSHOTS}/new.png`, "new");
    assert.deepEqual(changedSnapshots(source, repository), [
      `${SNAPSHOTS}/changed.png`,
      `${SNAPSHOTS}/new.png`,
    ]);
  });

  it("copies baselines into the same place", () => {
    write(source, `${SNAPSHOTS}/new.png`, "new");
    copySnapshots([`${SNAPSHOTS}/new.png`], source, repository);
    assert.equal(
      readFileSync(path.join(repository, SNAPSHOTS, "new.png"), "utf8"),
      "new",
    );
  });

  it("refuses to copy anything but a baseline", () => {
    write(source, ".github/workflows/x.yml", "x");
    assert.throws(
      () => copySnapshots([".github/workflows/x.yml"], source, repository),
      /not a VRT baseline/,
    );
    assert.equal(existsSync(path.join(repository, ".github")), false);
  });
});

describe("ownRuns", () => {
  const run = (id, createdAt, headRepository = 1) => ({
    id,
    created_at: createdAt,
    head_sha: "aaa",
    repository: { id: 1 },
    head_repository: headRepository === null ? null : { id: headRepository },
  });

  it("keeps this repository's runs, newest first", () => {
    assert.deepEqual(
      ownRuns([
        run(1, "2026-10-20T00:00:00Z"),
        run(2, "2026-10-22T00:00:00Z", 2),
        run(3, "2026-10-21T00:00:00Z"),
        run(4, "2026-10-23T00:00:00Z", null),
      ]).map(({ id }) => id),
      [3, 1],
    );
  });
});

describe("baselineArtifacts", () => {
  it("takes the unexpired baselines artifacts, one or one per job", () => {
    assert.deepEqual(
      baselineArtifacts([
        { name: ARTIFACT_NAME, expired: false },
        { name: `${ARTIFACT_NAME}-admin`, expired: false },
        { name: `${ARTIFACT_NAME}-old`, expired: true },
        { name: "web-playwright-artifacts", expired: false },
        { name: `${ARTIFACT_NAME}x`, expired: false },
      ]),
      [ARTIFACT_NAME, `${ARTIFACT_NAME}-admin`],
    );
  });
});

describe("parseAcceptArguments", () => {
  it("parses a run and force", () => {
    assert.deepEqual(parseAcceptArguments([]), { force: false });
    assert.deepEqual(parseAcceptArguments(["--run", "42", "--force"]), {
      runId: 42,
      force: true,
    });
  });

  it("rejects a bad run or flag", () => {
    assert.throws(() => parseAcceptArguments(["--run", "x"]), /--run requires/);
    assert.throws(() => parseAcceptArguments(["--yes"]), /Unknown argument/);
  });
});

describe("parseUpdateArguments", () => {
  it("renders the changed baselines unless asked for all", () => {
    assert.deepEqual(parseUpdateArguments([]), { all: false });
    assert.deepEqual(parseUpdateArguments(["--all"]), { all: true });
    assert.throws(() => parseUpdateArguments(["--yes"]), /Unknown argument/);
  });
});
