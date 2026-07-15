import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import type { Interface } from "node:readline/promises";

import {
  AI_VARIABLES,
  buildActionsSettings,
  buildBranchProtection,
  buildMainRuleset,
  buildRepositorySettings,
  diffLabels,
  diffObject,
  parseArguments,
  parseLabels,
  REPOSITORY_RULESET_NAME,
  REQUIRED_CHECK,
} from "./policy.mts";
import type {
  ActionsPermissionsState,
  ActionsSettings,
  ActionsState,
  BranchProtectionInput,
  CurrentLabel,
  Label,
  LabelDiff,
  ObjectDiff,
  RepositoryMetadata,
  SelectedActionsState,
  SetupArguments,
  WorkflowState,
} from "./policy.mts";
import {
  api,
  CommandError,
  preflight,
  repositoryRoot,
  runCommand,
} from "./lib.mts";
import type { RepositoryRestState } from "./lib.mts";

interface MetadataResult {
  metadata: RepositoryMetadata;
  topics: string[] | undefined;
  currentTopics: string[] | undefined;
}

interface ExistingAiVariable {
  name: string;
  value: string;
}

interface AiVariableChange extends ExistingAiVariable {
  current: string;
}

interface TopicsResponse {
  names?: string[];
}

interface GitRefResponse {
  object: {
    sha: string;
  };
}

interface WorkflowRunListEntry {
  databaseId: number;
}

interface WorkflowJob {
  name: string;
  conclusion: string | null;
}

interface WorkflowRun {
  headSha: string;
  conclusion: string | null;
  jobs: WorkflowJob[];
}

interface CheckRun {
  name: string;
  conclusion: string | null;
  app?: {
    id?: number | null;
    slug?: string;
  };
}

interface CheckRunsResponse {
  check_runs: CheckRun[];
}

interface RulesetResponse {
  id: number;
  name: string;
  source_type?: string;
}

async function ask(
  question: string,
  defaultValue: string,
  readline: Interface,
): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await readline.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue || "";
}

async function confirm(
  question: string,
  defaultValue: boolean,
  readline: Interface,
): Promise<boolean> {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await readline.question(`${question} [${hint}]: `))
    .trim()
    .toLowerCase();
  if (!answer) return defaultValue;
  return answer === "y" || answer === "yes";
}

async function collectMetadata(
  state: RepositoryRestState,
  readline: Interface,
): Promise<MetadataResult> {
  const description = await ask(
    "Repository description",
    state.description ?? "",
    readline,
  );
  const homepage = await ask("Homepage URL", state.homepage ?? "", readline);
  const currentTopics =
    api<TopicsResponse>("GET", `/repos/${state.full_name}/topics`)!.names ?? [];
  const topics = await ask(
    "Topics (comma separated)",
    currentTopics.join(","),
    readline,
  );
  return {
    metadata: {
      ...(description && description !== state.description
        ? { description }
        : {}),
      ...(homepage && homepage !== (state.homepage ?? "") ? { homepage } : {}),
    },
    topics: topics
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean),
    currentTopics,
  };
}

function printDiff(title: string, changes: ObjectDiff[]): void {
  console.log(`\n${title}`);
  if (changes.length === 0) {
    console.log("  No changes.");
    return;
  }
  for (const change of changes) {
    console.log(
      `  ${change.key}: ${JSON.stringify(change.current)} -> ${JSON.stringify(change.desired)}`,
    );
  }
}

function printLabelDiff(changes: LabelDiff): void {
  console.log("\nLabels");
  for (const label of changes.create) console.log(`  Create: ${label.name}`);
  for (const { current, desired } of changes.update) {
    console.log(`  Update: ${current.name} -> ${desired.name}`);
  }
  for (const label of changes.remove) console.log(`  Delete: ${label.name}`);
  if (
    !changes.create.length &&
    !changes.update.length &&
    !changes.remove.length
  ) {
    console.log("  No changes.");
  }
}

async function getAiVariableChanges(
  repository: string,
  readline: Interface,
): Promise<AiVariableChange[]> {
  if (!(await confirm("Configure optional AI variables", false, readline)))
    return [];
  const existing = JSON.parse(
    runCommand("gh", [
      "variable",
      "list",
      "--repo",
      repository,
      "--json",
      "name,value",
    ]),
  ) as ExistingAiVariable[];
  const byName = new Map(
    existing.map((variable) => [variable.name, variable.value]),
  );
  const changes: AiVariableChange[] = [];

  for (const name of AI_VARIABLES) {
    const current = byName.get(name) ?? "";
    const value = await ask(name, current, readline);
    if (value && value !== current) changes.push({ name, current, value });
  }
  return changes;
}

function getCurrentLabels(repository: string): CurrentLabel[] {
  const pages = api<CurrentLabel[]>(
    "GET",
    `/repos/${repository}/labels?per_page=100&page=1`,
  )!;
  // The starter manages fewer than 100 labels. Fail instead of silently pruning
  // when that assumption stops being true.
  if (pages.length === 100) {
    throw new Error(
      "Label count reached 100; pagination support is required before syncing.",
    );
  }
  return pages;
}

function applyLabels(repository: string, changes: LabelDiff): void {
  for (const label of changes.create) {
    api("POST", `/repos/${repository}/labels`, label);
  }
  for (const { current, desired } of changes.update) {
    api(
      "PATCH",
      `/repos/${repository}/labels/${encodeURIComponent(current.name)}`,
      {
        new_name: desired.name,
        color: desired.color,
        description: desired.description,
      },
    );
  }
  for (const label of changes.remove) {
    api(
      "DELETE",
      `/repos/${repository}/labels/${encodeURIComponent(label.name)}`,
    );
  }
}

function getActionsState(repository: string): ActionsState {
  const permissions = api<ActionsPermissionsState>(
    "GET",
    `/repos/${repository}/actions/permissions`,
  )!;
  const workflow = api<WorkflowState>(
    "GET",
    `/repos/${repository}/actions/permissions/workflow`,
  )!;
  let selectedActions: SelectedActionsState = {};
  try {
    selectedActions = api<SelectedActionsState>(
      "GET",
      `/repos/${repository}/actions/permissions/selected-actions`,
    )!;
  } catch {
    // The selected-actions endpoint is unavailable until selected mode is active.
  }
  return { permissions, selectedActions, workflow };
}

function applyActionsSettings(
  repository: string,
  settings: ActionsSettings,
): void {
  api("PUT", `/repos/${repository}/actions/permissions`, settings.permissions);
  api(
    "PUT",
    `/repos/${repository}/actions/permissions/selected-actions`,
    settings.selectedActions,
  );
  api(
    "PUT",
    `/repos/${repository}/actions/permissions/workflow`,
    settings.workflow,
  );
}

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function runRequiredChecks(repository: string): Promise<number> {
  const headSha = api<GitRefResponse>(
    "GET",
    `/repos/${repository}/git/ref/heads/main`,
  )!.object.sha;
  const existingRuns = JSON.parse(
    runCommand("gh", [
      "run",
      "list",
      "--repo",
      repository,
      "--workflow",
      "tests.yml",
      "--event",
      "workflow_dispatch",
      "--branch",
      "main",
      "--limit",
      "20",
      "--json",
      "databaseId",
    ]),
  ) as WorkflowRunListEntry[];
  const existingRunIds = new Set(
    existingRuns.map(({ databaseId }) => databaseId),
  );
  runCommand("gh", [
    "workflow",
    "run",
    "tests.yml",
    "--repo",
    repository,
    "--ref",
    "main",
  ]);

  let run: WorkflowRunListEntry | undefined;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await delay(2_000);
    const runs = JSON.parse(
      runCommand("gh", [
        "run",
        "list",
        "--repo",
        repository,
        "--workflow",
        "tests.yml",
        "--event",
        "workflow_dispatch",
        "--branch",
        "main",
        "--limit",
        "5",
        "--json",
        "databaseId",
      ]),
    ) as WorkflowRunListEntry[];
    run = runs.find(({ databaseId }) => !existingRunIds.has(databaseId));
    if (run) break;
  }

  if (!run)
    throw new Error("Could not find the dispatched Tests workflow run.");
  runCommand(
    "gh",
    [
      "run",
      "watch",
      String(run.databaseId),
      "--repo",
      repository,
      "--exit-status",
    ],
    { inherit: true },
  );
  const completedRun = JSON.parse(
    runCommand("gh", [
      "run",
      "view",
      String(run.databaseId),
      "--repo",
      repository,
      "--json",
      "headSha,conclusion,jobs",
    ]),
  ) as WorkflowRun;
  const requiredJob = completedRun.jobs.find(
    ({ name }) => name === REQUIRED_CHECK,
  );
  if (
    completedRun.headSha !== headSha ||
    completedRun.conclusion !== "success" ||
    requiredJob?.conclusion !== "success"
  ) {
    throw new Error(
      `Tests must report a successful '${REQUIRED_CHECK}' job for the current main commit.`,
    );
  }
  const checkRuns = api<CheckRunsResponse>(
    "GET",
    `/repos/${repository}/commits/${headSha}/check-runs?per_page=100`,
  )!.check_runs;
  const requiredCheck = checkRuns.find(
    (check) =>
      check.name === REQUIRED_CHECK &&
      check.conclusion === "success" &&
      check.app?.slug === "github-actions",
  );
  if (!requiredCheck?.app?.id) {
    throw new Error(
      `Could not resolve the GitHub Actions App for '${REQUIRED_CHECK}'.`,
    );
  }
  return requiredCheck.app.id;
}

function applyBranchProtection(
  repository: string,
  integrationId: number,
): void {
  let current: BranchProtectionInput = {};
  try {
    current = api<BranchProtectionInput>(
      "GET",
      `/repos/${repository}/branches/main/protection`,
    )!;
  } catch (error) {
    if (!(error instanceof CommandError) || error.httpStatus !== 404)
      throw error;
  }
  api(
    "PUT",
    `/repos/${repository}/branches/main/protection`,
    buildBranchProtection(current, integrationId),
  );
}

function isRulesetUnavailable(error: unknown): boolean {
  return (
    error instanceof CommandError && [403, 404, 422].includes(error.httpStatus)
  );
}

function applyMainProtection(repository: string, integrationId: number): void {
  const desired = buildMainRuleset(integrationId);
  try {
    const rulesets = api<RulesetResponse[]>(
      "GET",
      `/repos/${repository}/rulesets?includes_parents=false&targets=branch`,
    )!;
    const current = rulesets.find(
      (ruleset) =>
        ruleset.name === REPOSITORY_RULESET_NAME &&
        ruleset.source_type === "Repository",
    );
    if (current) {
      api("PUT", `/repos/${repository}/rulesets/${current.id}`, desired);
    } else {
      api("POST", `/repos/${repository}/rulesets`, desired);
    }
    console.log(`Applied ruleset: ${REPOSITORY_RULESET_NAME}`);
  } catch (error) {
    if (!isRulesetUnavailable(error)) throw error;
    console.warn(
      "Rulesets are unavailable; applying classic branch protection.",
    );
    applyBranchProtection(repository, integrationId);
  }
}

export async function setupRepository(args: SetupArguments): Promise<void> {
  const { repository, state } = preflight(args.repository);
  const needsReadline = !args.defaults || (!args.yes && !args.dryRun);
  const readline: Interface | undefined = needsReadline
    ? createInterface({ input: process.stdin, output: process.stdout })
    : undefined;

  try {
    console.log(`Target repository: ${repository}`);
    const metadataResult: MetadataResult = args.defaults
      ? { metadata: {}, topics: undefined, currentTopics: undefined }
      : await collectMetadata(state, readline!);
    const aiVariables: AiVariableChange[] = args.defaults
      ? []
      : await getAiVariableChanges(repository, readline!);
    const repositorySettings = buildRepositorySettings(metadataResult.metadata);
    const repositoryChanges = diffObject(state, repositorySettings);
    const actionsState = getActionsState(repository);
    const shaPinningRequired = Boolean(
      actionsState.permissions.sha_pinning_required,
    );
    const actionsSettings = buildActionsSettings({ shaPinningRequired });
    const desiredLabels = parseLabels(
      readFileSync(path.join(repositoryRoot, ".github/labels.yml"), "utf8"),
    );
    const labelChanges = diffLabels(
      desiredLabels,
      getCurrentLabels(repository),
    );

    printDiff("Repository settings", repositoryChanges);
    printDiff(
      "Actions permissions",
      diffObject(actionsState.permissions, actionsSettings.permissions),
    );
    printDiff(
      "Selected actions",
      diffObject(actionsState.selectedActions, actionsSettings.selectedActions),
    );
    printDiff(
      "Workflow token permissions",
      diffObject(actionsState.workflow, actionsSettings.workflow),
    );
    if (metadataResult.topics) {
      printDiff(
        "Repository topics",
        diffObject(
          { topics: metadataResult.currentTopics },
          { topics: metadataResult.topics },
        ),
      );
    }
    printDiff(
      "AI variables",
      aiVariables.map((variable) => ({
        key: variable.name,
        current: variable.current || undefined,
        desired: variable.value,
      })),
    );
    printLabelDiff(labelChanges);
    console.log(`\nMain protection: ${REPOSITORY_RULESET_NAME}`);
    console.log(`Required status check: ${REQUIRED_CHECK}`);
    if (shaPinningRequired) {
      console.warn(
        "Existing SHA pinning is enabled. Setup will not disable it, but the starter's tag-based actions must be pinned before workflows can run.",
      );
    }

    if (args.dryRun) {
      console.log("\nDry run complete. No changes were applied.");
      return;
    }
    if (
      !args.yes &&
      !(await confirm("Apply these changes", false, readline!))
    ) {
      console.log("Setup cancelled.");
      return;
    }
    if (shaPinningRequired) {
      throw new Error(
        "Cannot complete setup while SHA pinning is enabled and workflows use tag references.",
      );
    }

    api("PATCH", `/repos/${repository}`, repositorySettings);
    if (metadataResult.topics) {
      api("PUT", `/repos/${repository}/topics`, {
        names: metadataResult.topics,
      });
    }
    applyActionsSettings(repository, actionsSettings);
    for (const variable of aiVariables) {
      runCommand("gh", [
        "variable",
        "set",
        variable.name,
        "--repo",
        repository,
        "--body",
        variable.value,
      ]);
    }
    applyLabels(repository, labelChanges);
    const integrationId = await runRequiredChecks(repository);
    applyMainProtection(repository, integrationId);
    console.log("\nGitHub repository setup completed.");
  } finally {
    readline?.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupRepository(parseArguments(process.argv.slice(2))).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
