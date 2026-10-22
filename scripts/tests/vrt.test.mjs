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
  changedSnapshots,
  copySnapshots,
  isSnapshotPath,
  listSnapshots,
  parseAcceptArguments,
  pickArtifact,
} from "../vrt/main.mts";

const SNAPSHOTS = "apps/web/e2e/vrt.spec.ts-snapshots";

function write(root, file, content) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

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

describe("pickArtifact", () => {
  const artifact = (id, branch, sha, createdAt, extra = {}) => ({
    id,
    name: ARTIFACT_NAME,
    expired: false,
    created_at: createdAt,
    workflow_run: { id: id * 10, head_branch: branch, head_sha: sha },
    ...extra,
  });
  const artifacts = [
    artifact(1, "feat/a", "aaa", "2026-10-20T00:00:00Z"),
    artifact(2, "feat/a", "bbb", "2026-10-21T00:00:00Z"),
    artifact(3, "feat/a", "ccc", "2026-10-22T00:00:00Z", { expired: true }),
    artifact(4, "feat/b", "bbb", "2026-10-23T00:00:00Z"),
    artifact(5, "feat/a", "bbb", "2026-10-24T00:00:00Z", { name: "other" }),
  ];

  it("takes the newest unexpired artifact of the branch", () => {
    assert.equal(
      pickArtifact(artifacts, { branch: "feat/a", headSha: "bbb" }).id,
      2,
    );
  });

  it("takes the artifact of a given run", () => {
    assert.equal(
      pickArtifact(artifacts, {
        branch: "feat/a",
        headSha: "aaa",
        runId: 10,
      }).id,
      1,
    );
  });

  it("refuses baselines rendered from another commit unless forced", () => {
    assert.throws(
      () => pickArtifact(artifacts, { branch: "feat/a", headSha: "ddd" }),
      /rendered from bbb, but HEAD is ddd/,
    );
    assert.equal(
      pickArtifact(artifacts, { branch: "feat/a", headSha: "ddd", force: true })
        .id,
      2,
    );
  });

  it("explains where baselines come from when there are none", () => {
    assert.throws(
      () => pickArtifact(artifacts, { branch: "feat/c", headSha: "aaa" }),
      /No vrt-baselines artifact for feat\/c/,
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
