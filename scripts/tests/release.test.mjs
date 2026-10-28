import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bumpedManifest,
  bumpMessage,
  currentVersion,
  draftVersion,
  parseSyncArguments,
} from "../release/main.mts";

const release = (tag_name, draft) => ({
  id: 1,
  draft,
  tag_name,
  name: `${tag_name} 🚀`,
  html_url: `https://example.test/releases/${tag_name}`,
});

describe("draftVersion", () => {
  it("takes the version from the one draft's tag", () => {
    const releases = [release("v0.10.0", false), release("v0.11.0", true)];
    assert.deepEqual(draftVersion(releases), {
      version: "0.11.0",
      draft: releases[1],
    });
  });

  it("keeps a prerelease suffix", () => {
    assert.equal(
      draftVersion([release("v1.0.0-rc.1", true)]).version,
      "1.0.0-rc.1",
    );
  });

  it("refuses no draft, several drafts, or a tag of another shape", () => {
    assert.throws(() => draftVersion([release("v0.10.0", false)]), /No draft/);
    assert.throws(
      () => draftVersion([release("v0.11.0", true), release("v0.12.0", true)]),
      /Several draft releases \(v0\.11\.0, v0\.12\.0\)/,
    );
    assert.throws(() => draftVersion([release("0.11.0", true)]), /not v</);
    assert.throws(() => draftVersion([release("v0.11", true)]), /not v</);
  });
});

describe("bumpedManifest", () => {
  const manifest = [
    "{",
    '  "name": "turborepo-starter",',
    '  "version": "0.0.0",',
    '  "private": true,',
    '  "scripts": {',
    '    "version": "echo not this one"',
    "  }",
    "}",
    "",
  ].join("\n");

  it("rewrites the top-level version and nothing else", () => {
    const bumped = bumpedManifest(manifest, "0.11.0");
    assert.equal(bumped, manifest.replace('"0.0.0"', '"0.11.0"'));
    assert.equal(currentVersion(bumped), "0.11.0");
    assert.match(bumped, /"version": "echo not this one"/);
  });

  it("refuses a manifest without a top-level version", () => {
    assert.throws(
      () => bumpedManifest('{\n  "name": "x"\n}\n', "1.0.0"),
      /no top-level version field/,
    );
    assert.throws(
      () =>
        bumpedManifest(
          '{\n  "scripts": {\n    "version": "x"\n  }\n}\n',
          "1.0.0",
        ),
      /no top-level version field/,
    );
  });
});

describe("bumpMessage", () => {
  // The commit is made with hooks off, so these stand in for the commitlint
  // rules in commitlint.config.js that the message could break.
  it("keeps to the commit convention, even for a long prerelease", () => {
    for (const version of ["0.11.0", "10.20.30-beta.12"]) {
      const [subject, body] = bumpMessage(version);
      const header = /^chore\(release\): (.+)$/.exec(subject);
      assert.ok(header, subject);
      assert.ok(header[1].length <= 50, `subject too long: ${header[1]}`);
      assert.doesNotMatch(header[1], /^[A-Z]|\.$/);
      assert.match(body, new RegExp(`v${version.replaceAll(".", "\\.")}`));
      for (const line of body.split("\n")) {
        assert.ok(line.length <= 72, `body line too long: ${line}`);
      }
    }
  });
});

describe("parseSyncArguments", () => {
  it("takes a version or nothing", () => {
    assert.deepEqual(parseSyncArguments([]), {});
    assert.deepEqual(parseSyncArguments(["--version", "0.11.0"]), {
      version: "0.11.0",
    });
    assert.deepEqual(parseSyncArguments(["--version", "1.0.0-rc.1"]), {
      version: "1.0.0-rc.1",
    });
  });

  it("rejects a missing or malformed version, or another flag", () => {
    assert.throws(() => parseSyncArguments(["--version"]), /--version/);
    assert.throws(
      () => parseSyncArguments(["--version", "v0.11.0"]),
      /--version/,
    );
    assert.throws(() => parseSyncArguments(["--force"]), /Unknown argument/);
  });
});
