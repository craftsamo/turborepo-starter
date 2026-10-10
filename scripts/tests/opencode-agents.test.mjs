// Guards the security model of the CI agents in .github/opencode/agents/.
// See docs/github-actions/run-ai-agent.md (Security) for why each rule exists.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { AGENTS } from "../ci/opencode/command.mts";
import { parseDefaultModels } from "../ci/opencode/models.mts";

const configDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.github/opencode",
);
const agentsDir = path.join(configDir, "agents");

// Rules are written one per line as YAML flow mappings.
function decode(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

function parseAgent(file) {
  const text = readFileSync(path.join(agentsDir, file), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  assert.ok(match, `${file}: missing frontmatter`);
  const [, frontmatter, body] = match;
  const rules = [];
  for (const line of frontmatter.split("\n")) {
    if (!/^\s*-\s*\{/.test(line)) continue;
    const fields = {};
    for (const [, key, value] of line.matchAll(
      /(\w+):\s*("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^,}]+)/g,
    )) {
      fields[key] = decode(value);
    }
    assert.ok(
      fields.action && fields.resource && fields.effect,
      `${file}: unparsed rule ${line.trim()}`,
    );
    rules.push(fields);
  }
  const mode = /^mode:\s*(\S+)/m.exec(frontmatter)?.[1];
  return { file, name: file.replace(/\.md$/, ""), mode, body, rules };
}

const agents = readdirSync(agentsDir)
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map(parseAgent);

const READ_ONLY_GIT = [
  "log",
  "show",
  "blame",
  "status",
  "ls-files",
  "ls-tree",
  "rev-parse",
  "merge-base",
  "diff",
];
const PR_DIFF = ["git diff refs/opencode/*", "git diff * refs/opencode/*"];
const OWN_EDITS_DIFF = ["git diff", "git diff --stat", "git diff -- *"];
const GIT_GUARDS = [
  "git *--out*",
  "git *--no-index*",
  "git *--con*",
  "git *--ext-diff*",
  "git *--textconv*",
  "git * /*",
  "git *=/*",
  "git *../*",
  "git * ~*",
  'git *"*',
  "git *'*",
  "git *$*",
];
const EDIT_GUARDS = [
  ".github/workflows/*",
  "*.git",
  "*.git/*",
  "*.env",
  "*.env.*",
];
const NEVER_ALLOWED = [
  "*",
  "execute",
  "browser",
  "webfetch",
  "websearch",
  "subagent",
  "external_directory",
];

const lastIndex = (rules, predicate) => rules.findLastIndex(predicate);
const firstIndex = (rules, predicate) => rules.findIndex(predicate);

describe("CI agents", () => {
  it("match the agents the /oc command accepts", () => {
    assert.deepEqual(
      agents.map((agent) => agent.name),
      [...AGENTS].sort(),
    );
  });

  for (const agent of agents) {
    describe(agent.name, () => {
      const { rules } = agent;
      const shellAllows = rules.filter(
        (rule) => rule.action === "shell" && rule.effect === "allow",
      );

      it("is a primary agent with a prompt", () => {
        assert.equal(agent.mode, "primary");
        assert.ok(agent.body.trim().length > 0);
      });

      it("starts by sending everything to ask", () => {
        assert.deepEqual(rules[0], {
          action: "*",
          resource: "*",
          effect: "ask",
        });
      });

      // The free tier rejects requests whose core tools were trimmed by deny
      // rules; only Code Mode and the desktop browser are removed.
      it("denies Code Mode and the browser and nothing else", () => {
        const denied = rules.filter((rule) => rule.effect === "deny");
        assert.deepEqual(
          denied.map((rule) => [rule.action, rule.resource]).sort(),
          [
            ["browser", "*"],
            ["execute", "*"],
          ],
        );
      });

      it("never allows network, subagents, or outside directories", () => {
        for (const rule of rules) {
          if (rule.effect !== "allow") continue;
          assert.ok(
            !NEVER_ALLOWED.includes(rule.action),
            `allows ${rule.action} ${rule.resource}`,
          );
        }
      });

      it("allows skills", () => {
        assert.ok(
          rules.some(
            (rule) =>
              rule.action === "skill" &&
              rule.resource === "*" &&
              rule.effect === "allow",
          ),
        );
      });

      it("only allows read-only git commands in the shell", () => {
        assert.ok(shellAllows.length > 0);
        for (const { resource } of shellAllows) {
          const subcommand = /^git ([\w-]+)/.exec(resource)?.[1];
          assert.ok(
            subcommand && READ_ONLY_GIT.includes(subcommand),
            `allows shell ${resource}`,
          );
          if (subcommand === "diff") {
            const forms =
              agent.name === "build"
                ? [...PR_DIFF, ...OWN_EDITS_DIFF]
                : PR_DIFF;
            assert.ok(forms.includes(resource), `allows shell ${resource}`);
          }
        }
      });

      it("keeps every git guard after the last shell allow", () => {
        const lastAllow = lastIndex(
          rules,
          (rule) => rule.action === "shell" && rule.effect === "allow",
        );
        for (const guard of GIT_GUARDS) {
          const index = firstIndex(
            rules,
            (rule) =>
              rule.action === "shell" &&
              rule.resource === guard &&
              rule.effect === "ask",
          );
          assert.ok(index !== -1, `missing guard ${guard}`);
          assert.ok(index > lastAllow, `guard ${guard} precedes an allow`);
        }
      });

      it("uses no backslashes in patterns", () => {
        for (const rule of rules) {
          assert.ok(!rule.resource.includes("\\"), `pattern ${rule.resource}`);
        }
      });

      const edits = rules.filter((rule) => rule.action === "edit");
      if (agent.name === "build") {
        it("edits files but keeps workflow, git, and env paths guarded", () => {
          const allow = lastIndex(
            edits,
            (rule) => rule.resource === "*" && rule.effect === "allow",
          );
          assert.ok(allow !== -1, "build cannot edit");
          for (const guard of EDIT_GUARDS) {
            const index = firstIndex(
              edits,
              (rule) => rule.resource === guard && rule.effect === "ask",
            );
            assert.ok(
              index > allow,
              `missing or misplaced edit guard ${guard}`,
            );
          }
        });
      } else {
        it("cannot edit files", () => {
          assert.ok(!edits.some((rule) => rule.effect === "allow"));
        });
      }
    });
  }
});

describe("default models", () => {
  it("parses the shipped models.json", () => {
    const models = parseDefaultModels(
      readFileSync(path.join(configDir, "models.json"), "utf8"),
    );
    assert.ok(models.candidates.length > 0);
    assert.ok(
      models.candidates.every((model) => model.startsWith("opencode/")),
    );
  });
});
