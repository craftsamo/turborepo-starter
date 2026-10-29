import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { resolveRepositoryRoot } from "../repository-root.mts";

const repositoryRoot = resolveRepositoryRoot();
const read = (file) => readFileSync(path.join(repositoryRoot, file), "utf8");

// Every label is a `- name: "<label>"` entry, as repo-kit reads them.
const declared = new Set(
  [...read(".github/labels.yml").matchAll(/^- name: "(.+)"$/gm)].map(
    ([, name]) => JSON.parse(`"${name}"`),
  ),
);
const autolabeler = read(".github/release-drafter.yml");
const notes = JSON.parse(read(".github/release-notes.json"));

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
  it("reads every label of labels.yml", () => {
    const entries = read(".github/labels.yml").match(/^- name:/gm) ?? [];
    assert.ok(entries.length > 0);
    assert.equal(declared.size, entries.length);
  });

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

  it("labels a ticked Breaking Changes box as major", () => {
    const rule = rules.find(({ label }) => label === "🌟major");
    const source = rule.patterns[0];
    const regex = new RegExp(source.slice(1, source.lastIndexOf("/")));
    const template = read(".github/PULL_REQUEST_TEMPLATE.md");
    const tick = (answer) =>
      template.replace(`- [ ] ${answer}`, `- [x] ${answer}`);

    assert.ok(template.includes("## Breaking Changes"));
    assert.equal(regex.test(template), false);
    assert.equal(regex.test(tick("No")), false);
    assert.equal(regex.test(tick("Yes")), true);
    assert.equal(regex.test(tick("Yes").replaceAll("\n", "\r\n")), true);
  });
});
