import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countChangedLines,
  evaluateCommitSize,
  parseMaxChangedLines,
} from "../check-commit-size.mjs";

describe("countChangedLines", () => {
  it("counts additions and deletions", () => {
    const numstat = "12\t3\tsrc/example.ts\n4\t1\tsrc/other.ts\n";

    assert.equal(countChangedLines(numstat), 20);
  });

  it("excludes the generated pnpm lockfile", () => {
    const numstat = "600\t200\tpnpm-lock.yaml\n20\t5\tpackage.json\n";

    assert.equal(countChangedLines(numstat), 25);
  });

  it("does not count binary files as reviewable lines", () => {
    assert.equal(countChangedLines("-\t-\tpublic/image.png\n"), 0);
  });

  it("fails closed for malformed numstat output", () => {
    assert.throws(
      () => countChangedLines("not-numstat\n"),
      /Unexpected git numstat line/,
    );
  });
});

describe("evaluateCommitSize", () => {
  it("allows exactly 500 changed lines", () => {
    assert.deepEqual(evaluateCommitSize("300\t200\tsrc/example.ts\n"), {
      changedLines: 500,
      maxChangedLines: 500,
      passes: true,
    });
  });

  it("rejects 501 changed lines", () => {
    assert.deepEqual(evaluateCommitSize("301\t200\tsrc/example.ts\n"), {
      changedLines: 501,
      maxChangedLines: 500,
      passes: false,
    });
  });
});

describe("parseMaxChangedLines", () => {
  it("uses 500 by default", () => {
    assert.equal(parseMaxChangedLines(undefined), 500);
  });

  it("accepts a positive integer", () => {
    assert.equal(parseMaxChangedLines("750"), 750);
  });

  it("rejects partial and fractional numbers", () => {
    assert.throws(
      () => parseMaxChangedLines("500abc"),
      /must be a positive integer/,
    );
    assert.throws(
      () => parseMaxChangedLines("500.5"),
      /must be a positive integer/,
    );
  });
});
