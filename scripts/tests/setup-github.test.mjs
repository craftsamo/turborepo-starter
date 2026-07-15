import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildActionsSettings,
  buildBranchProtection,
  buildMainRuleset,
  buildRepositorySettings,
  diffLabels,
  diffObject,
  parseArguments,
  parseLabels,
} from "../setup/github/policy.mts";

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
      squash_merge_commit_title: "PR_TITLE",
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
  it("uses selected actions with a read-only default token", () => {
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
      "sst/opencode/github@*",
    ]);
    assert.deepEqual(settings.workflow, {
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: false,
    });
  });

  it("preserves an existing SHA pinning requirement", () => {
    assert.equal(
      buildActionsSettings({ shaPinningRequired: true }).permissions
        .sha_pinning_required,
      true,
    );
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
