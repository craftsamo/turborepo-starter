import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildActionsSettings,
  buildBranchProtection,
  buildMainRuleset,
  buildRepositorySettings,
  diffLabels,
  diffObject,
  MODEL_VARIABLES,
  parseArguments,
  parseLabels,
  PROVIDER_SECRETS,
} from "../setup/github/policy.mts";
import {
  CommandError,
  ensureEnvironment,
  environmentExists,
  repositoryRoot,
} from "../setup/github/lib.mts";

describe("parseArguments", () => {
  it("uses interactive repository setup by default", () => {
    assert.deepEqual(parseArguments([]), {
      mode: "setup",
      dryRun: false,
      defaults: false,
      yes: false,
      repository: undefined,
      scope: undefined,
      environment: undefined,
      secretName: undefined,
    });
  });

  it("parses non-interactive setup flags", () => {
    assert.deepEqual(
      parseArguments([
        "--repo",
        "owner/repo",
        "--defaults",
        "--yes",
        "--dry-run",
      ]),
      {
        mode: "setup",
        dryRun: true,
        defaults: true,
        yes: true,
        repository: "owner/repo",
        scope: undefined,
        environment: undefined,
        secretName: undefined,
      },
    );
  });

  it("parses an environment secret target", () => {
    assert.deepEqual(
      parseArguments([
        "secrets",
        "--environment",
        "production",
        "--name",
        "DATABASE_URL",
      ]),
      {
        mode: "secrets",
        dryRun: false,
        defaults: false,
        yes: false,
        repository: undefined,
        scope: undefined,
        environment: "production",
        secretName: "DATABASE_URL",
      },
    );
  });

  it("rejects ambiguous and unsafe secret arguments", () => {
    assert.throws(
      () =>
        parseArguments([
          "secrets",
          "--scope",
          "repository",
          "--environment",
          "production",
          "--name",
          "TOKEN",
        ]),
      /either --scope or --environment/,
    );
    assert.throws(
      () => parseArguments(["secrets", "--environment", "production"]),
      /require --name/,
    );
    assert.throws(
      () => parseArguments(["secrets", "--defaults"]),
      /cannot be configured with --defaults/,
    );
  });
});

describe("repository settings", () => {
  it("builds the agreed merge and feature policy", () => {
    assert.deepEqual(buildRepositorySettings(), {
      default_branch: "main",
      has_issues: true,
      has_projects: true,
      has_wiki: false,
      has_discussions: false,
      allow_merge_commit: true,
      allow_squash_merge: true,
      allow_rebase_merge: false,
      allow_auto_merge: false,
      delete_branch_on_merge: true,
      merge_commit_title: "PR_TITLE",
      merge_commit_message: "BLANK",
      squash_merge_commit_title: "COMMIT_OR_PR_TITLE",
      squash_merge_commit_message: "COMMIT_MESSAGES",
    });
  });

  it("adds only explicitly supplied metadata", () => {
    assert.equal(
      buildRepositorySettings({ description: "Example" }).description,
      "Example",
    );
  });
});

describe("Actions settings", () => {
  it("uses selected actions with a read-only default token that can open PRs", () => {
    const settings = buildActionsSettings();

    assert.deepEqual(settings.permissions, {
      enabled: true,
      allowed_actions: "selected",
      sha_pinning_required: false,
    });
    assert.equal(settings.selectedActions.github_owned_allowed, true);
    assert.equal(settings.selectedActions.verified_allowed, false);
    assert.deepEqual(settings.selectedActions.patterns_allowed, [
      "dorny/paths-filter@*",
      "release-drafter/release-drafter@*",
      "micnncim/action-label-syncer@*",
      "peter-evans/create-pull-request@*",
    ]);
    assert.deepEqual(settings.workflow, {
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: true,
    });
  });

  it("allows every third-party action the workflows use", () => {
    const workflows = path.join(repositoryRoot, ".github/workflows");
    const { patterns_allowed } = buildActionsSettings().selectedActions;
    const allowed = patterns_allowed.map(
      (pattern) =>
        new RegExp(
          `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`,
        ),
    );
    const blocked = readdirSync(workflows)
      .filter((file) => /\.ya?ml$/.test(file))
      .flatMap((file) =>
        [
          ...readFileSync(path.join(workflows, file), "utf8").matchAll(
            /^\s*(?:-\s*)?uses:\s*["']?([^\s"'#]+)/gm,
          ),
        ].map((match) => `${file}: ${match[1]}`),
      )
      .filter((entry) => {
        const action = entry.split(": ")[1];
        if (action.startsWith("./") || action.startsWith("docker://")) {
          return false;
        }
        // GitHub-owned actions are allowed by github_owned_allowed.
        if (/^(actions|github)\//.test(action)) return false;
        return !allowed.some((pattern) => pattern.test(action));
      });

    assert.deepEqual(blocked, []);
  });

  it("preserves an existing SHA pinning requirement", () => {
    assert.equal(
      buildActionsSettings({ shaPinningRequired: true }).permissions
        .sha_pinning_required,
      true,
    );
  });
});

describe("OpenCode workflow settings", () => {
  it("offers the model variables the workflow reads", () => {
    assert.deepEqual(MODEL_VARIABLES, [
      "OPENCODE_MODEL",
      "OPENCODE_MODEL_PLAN",
      "OPENCODE_MODEL_BUILD",
      "OPENCODE_MODEL_REVIEW",
      "OPENCODE_MODEL_DEBUG",
    ]);
  });

  it("offers the provider key secrets the workflow passes on", () => {
    assert.deepEqual(PROVIDER_SECRETS, [
      "OPENCODE_API_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "OPENROUTER_API_KEY",
    ]);
  });
});

describe("main protection", () => {
  it("builds an active main ruleset with the required CI gate", () => {
    const ruleset = buildMainRuleset(15368);
    const pullRequestRule = ruleset.rules.find(
      (rule) => rule.type === "pull_request",
    );
    const statusRule = ruleset.rules.find(
      (rule) => rule.type === "required_status_checks",
    );

    assert.equal(ruleset.name, "Starter: protect main");
    assert.deepEqual(ruleset.conditions.ref_name.include, ["refs/heads/main"]);
    assert.equal(ruleset.bypass_actors[0].bypass_mode, "always");
    assert.equal(pullRequestRule.parameters.required_approving_review_count, 0);
    assert.equal(
      pullRequestRule.parameters.required_review_thread_resolution,
      true,
    );
    assert.deepEqual(pullRequestRule.parameters.allowed_merge_methods, [
      "merge",
      "squash",
    ]);
    assert.deepEqual(statusRule.parameters.required_status_checks, [
      { context: "Required checks", integration_id: 15368 },
    ]);
    assert.equal(
      statusRule.parameters.strict_required_status_checks_policy,
      true,
    );
  });

  it("preserves stricter classic protection while adding the required check", () => {
    const protection = buildBranchProtection(
      {
        required_status_checks: {
          contexts: ["security"],
          checks: [{ context: "security", app_id: 42 }],
        },
        enforce_admins: { enabled: true },
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          required_approving_review_count: 2,
          require_last_push_approval: true,
        },
        required_linear_history: { enabled: true },
      },
      15368,
    );

    assert.deepEqual(protection.required_status_checks, {
      strict: true,
      contexts: ["security", "Required checks"],
      checks: [
        { context: "security", app_id: 42 },
        { context: "Required checks", app_id: 15368 },
      ],
    });
    assert.equal(protection.enforce_admins, true);
    assert.equal(
      protection.required_pull_request_reviews.required_approving_review_count,
      2,
    );
    assert.equal(protection.required_linear_history, true);
    assert.equal(protection.allow_force_pushes, false);
    assert.equal(protection.allow_deletions, false);
  });
});

describe("labels", () => {
  const source = `
- name: "feature"
  description: "Feature addition"
  color: "0E8A16"
- name: 'question'
  description: 'General inquiries'
  color: 'D876E3'
`;

  it("parses the supported labels manifest", () => {
    assert.deepEqual(parseLabels(source), [
      {
        name: "feature",
        description: "Feature addition",
        color: "0E8A16",
      },
      {
        name: "question",
        description: "General inquiries",
        color: "D876E3",
      },
    ]);
  });

  it("fails closed for incomplete label definitions", () => {
    assert.throws(
      () => parseLabels('- name: "feature"\n  color: "0E8A16"\n'),
      /Incomplete label definition/,
    );
  });

  it("computes create, update, and delete operations", () => {
    const desired = parseLabels(source);
    const changes = diffLabels(desired, [
      { name: "feature", description: "Old", color: "ffffff" },
      { name: "obsolete", description: "Remove", color: "000000" },
    ]);

    assert.deepEqual(
      changes.create.map((label) => label.name),
      ["question"],
    );
    assert.deepEqual(
      changes.update.map(({ desired: label }) => label.name),
      ["feature"],
    );
    assert.deepEqual(
      changes.remove.map((label) => label.name),
      ["obsolete"],
    );
  });

  it("updates labels whose GitHub description is null", () => {
    const desired = [
      { name: "feature", description: "Feature addition", color: "0E8A16" },
    ];
    const changes = diffLabels(desired, [
      { name: "feature", description: null, color: "0E8A16" },
    ]);

    assert.equal(changes.update.length, 1);
    assert.equal(changes.update[0].desired.description, "Feature addition");
  });

  it("renames the legacy question label without deleting assignments", () => {
    const desired = [
      { name: "💬question", description: "Questions", color: "D876E3" },
    ];
    const changes = diffLabels(desired, [
      { name: "💬quesion", description: "Questions", color: "D876E3" },
    ]);

    assert.equal(changes.create.length, 0);
    assert.equal(changes.remove.length, 0);
    assert.deepEqual(changes.update, [
      {
        current: {
          name: "💬quesion",
          description: "Questions",
          color: "D876E3",
        },
        desired: {
          name: "💬question",
          description: "Questions",
          color: "D876E3",
        },
      },
    ]);
  });

  it("fails closed when both legacy and corrected labels exist", () => {
    const desired = [
      { name: "💬question", description: "Questions", color: "D876E3" },
    ];

    assert.throws(
      () =>
        diffLabels(desired, [
          { name: "💬quesion", description: "Questions", color: "D876E3" },
          { name: "💬question", description: "Questions", color: "D876E3" },
        ]),
      /Merge their assignments manually/,
    );
  });
});

describe("deployment environments", () => {
  const httpError = (status, message) =>
    new CommandError("gh api", { stderr: `gh: ${message} (HTTP ${status})` });

  const recorder = (respond) => {
    const calls = [];
    const request = (method, endpoint, body) => {
      calls.push({ method, endpoint, body });
      return respond(method);
    };
    return { calls, request };
  };

  it("creates a missing environment with a single upsert", () => {
    const { calls, request } = recorder((method) => {
      if (method === "GET") throw httpError(404, "Not Found");
      return undefined;
    });

    assert.equal(ensureEnvironment("owner/repo", "production", request), true);
    assert.deepEqual(calls, [
      {
        method: "GET",
        endpoint: "/repos/owner/repo/environments/production",
        body: undefined,
      },
      {
        method: "PUT",
        endpoint: "/repos/owner/repo/environments/production",
        body: {},
      },
    ]);
  });

  it("leaves an existing environment untouched so protection rules survive", () => {
    const { calls, request } = recorder(() => ({ name: "production" }));

    assert.equal(ensureEnvironment("owner/repo", "production", request), false);
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["GET"],
    );
  });

  it("propagates a non-404 lookup failure instead of overwriting", () => {
    const { calls, request } = recorder(() => {
      throw httpError(403, "Forbidden");
    });

    assert.throws(
      () => ensureEnvironment("owner/repo", "production", request),
      /Forbidden/,
    );
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["GET"],
    );
  });

  it("escapes the environment name in the endpoint path", () => {
    const { calls, request } = recorder(() => ({}));

    assert.equal(environmentExists("owner/repo", "staging/eu", request), true);
    assert.equal(
      calls[0].endpoint,
      "/repos/owner/repo/environments/staging%2Feu",
    );
  });
});

describe("diffObject", () => {
  it("returns only changed desired fields", () => {
    assert.deepEqual(
      diffObject(
        { enabled: true, mode: "all", untouched: 1 },
        {
          enabled: true,
          mode: "selected",
        },
      ),
      [{ key: "mode", current: "all", desired: "selected" }],
    );
  });
});
