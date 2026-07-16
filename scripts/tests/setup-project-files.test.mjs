import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  applyFileTransaction,
  nodeFileOperations,
} from "../setup/project/files.mts";

describe("file transactions", () => {
  it("rolls back installed files when a later rename fails", (t) => {
    const root = mkdtempSync(path.join(tmpdir(), "setup-transaction-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(path.join(root, "first.txt"), "first before\n");
    writeFileSync(path.join(root, "second.txt"), "second before\n");
    let renameCount = 0;
    const operations = {
      ...nodeFileOperations,
      rename(from, to) {
        renameCount += 1;
        if (renameCount === 4) throw new Error("injected rename failure");
        nodeFileOperations.rename(from, to);
      },
    };

    assert.throws(
      () =>
        applyFileTransaction(
          root,
          [
            { path: "first.txt", content: "first after\n" },
            { path: "second.txt", content: "second after\n" },
          ],
          operations,
        ),
      /injected rename failure/,
    );
    assert.equal(readFileSync(path.join(root, "first.txt"), "utf8"), "first before\n");
    assert.equal(
      readFileSync(path.join(root, "second.txt"), "utf8"),
      "second before\n",
    );
  });

  it("keeps installed files when backup cleanup fails", (t) => {
    const root = mkdtempSync(path.join(tmpdir(), "setup-transaction-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(path.join(root, "project.txt"), "before\n");
    const warnings = [];
    const operations = {
      ...nodeFileOperations,
      remove(filePath) {
        if (filePath.endsWith(".backup")) {
          throw new Error("injected cleanup failure");
        }
        nodeFileOperations.remove(filePath);
      },
      warn(message) {
        warnings.push(message);
      },
    };

    applyFileTransaction(
      root,
      [{ path: "project.txt", content: "after\n" }],
      operations,
    );

    assert.equal(readFileSync(path.join(root, "project.txt"), "utf8"), "after\n");
    assert.match(warnings.join("\n"), /backup cleanup failed/);
  });
});
