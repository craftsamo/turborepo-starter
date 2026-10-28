import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { repositoryRoot } from "../setup/github/lib.mts";
import { parseLabels } from "../setup/github/policy.mts";
import { parseNotesConfig } from "../release/notes.mts";

const read = (file) => readFileSync(path.join(repositoryRoot, file), "utf8");

const declared = new Set(
  parseLabels(read(".github/labels.yml")).map(({ name }) => name),
);
const autolabeler = read(".github/release-drafter.yml");
const notes = parseNotesConfig(read(".github/release-notes.json"));

// Each autolabeler rule names one label and lists its patterns, double-quoted
// one per line, below it up to the next rule.
const rules = autolabeler
  .replaceAll("\r\n", "\n")
  .split(/^\s*- label:/m)
  .slice(1)
  .map((rule) => ({
    label: JSON.parse(rule.slice(0, rule.indexOf("\n")).trim()),
    patterns: [...rule.matchAll(/^\s+- "(.+)"$/gm)].map(([, pattern]) =>
      JSON.parse(`"${pattern}"`),
    ),
  }));

describe("labels", () => {
  it("reads a pattern for every autolabeler rule", () => {
    assert.ok(rules.length > 0);
    for (const { label, patterns } of rules) {
      assert.ok(
        patterns.length > 0,
        `${label} lists no pattern this test reads`,
      );
    }
  });

  it("declares every label the autolabeler applies", () => {
    // Sync Labels prunes a label missing from labels.yml, and the autolabeler
    // would then create it again without its color and description.
    for (const { label } of rules) {
      assert.ok(declared.has(label), `${label} is not in labels.yml`);
    }
  });

  it("declares every label the release notes read", () => {
    const named = [
      ...notes.exclude,
      ...notes.major,
      ...notes.categories.flatMap(({ labels }) => labels ?? []),
    ];
    for (const label of named) {
      assert.ok(declared.has(label), `${label} is not in labels.yml`);
    }
  });

  it("gives every app and package its own area label", () => {
    for (const parent of ["apps", "packages"]) {
      const workspaces = readdirSync(path.join(repositoryRoot, parent), {
        withFileTypes: true,
      }).filter((entry) => entry.isDirectory());
      for (const { name } of workspaces) {
        const rule = rules.find(({ patterns }) =>
          patterns.includes(`/${parent}/${name}/`),
        );
        assert.ok(rule, `${parent}/${name} has no autolabeler rule`);
        assert.ok(
          rule.label.endsWith(`: ${name}`),
          `${parent}/${name} is labeled ${rule.label}`,
        );
      }
    }
  });
});
