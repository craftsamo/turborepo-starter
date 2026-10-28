import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import type { Interface } from "node:readline/promises";

import { parseModelList } from "../../ci/opencode/models.mts";
import {
  buildActionsSettings,
  buildBranchProtection,
  buildCacheRetentionSettings,
  buildDependabotSettings,
  buildMainRuleset,
  buildRepositorySettings,
  buildRetentionSettings,
  buildSecurityAndAnalysis,
  diffLabels,
  diffObject,
  MODEL_VARIABLES,
  parseArguments,
  parseLabels,
  planReleaseKey,
  RELEASE_KEY_SECRET,
  RELEASE_KEY_TITLE,
  REPOSITORY_RULESET_NAME,
  REQUIRED_CHECK,
} from "./policy.mts";
import type {
  ActionsPermissionsState,
  ActionsSettings,
  ActionsState,
  BranchProtectionInput,
  CacheRetentionSettings,
  CacheRetentionState,
  CurrentLabel,
  DependabotSettings,
  Label,
  LabelDiff,
  ObjectDiff,
  ReleaseKeyPlan,
  ReleaseKeyState,
  RepositoryMetadata,
  RetentionSettings,
  RetentionState,
  SecurityAndAnalysisSettings,
  SecurityAndAnalysisState,
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
import type { ApiRequest, RepositoryRestState } from "./lib.mts";

interface MetadataResult {
  metadata: RepositoryMetadata;
  topics: string[] | undefined;
  currentTopics: string[] | undefined;
}

interface ExistingVariable {
  name: string;
  value: string;
}

interface VariableChange extends ExistingVariable {
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

// Asks until the value is empty or a model list the workflow accepts, so a
// typo surfaces here instead of in a failed agent run.
async function askModelList(
  name: string,
  current: string,
  readline: Interface,
): Promise<string> {
  for (;;) {
    const value = await ask(name, current, readline);
    if (!value) return value;
    try {
      parseModelList(value, name);
      return value;
    } catch (error) {
      console.error((error as Error).message);
    }
  }
}

async function getModelVariableChanges(
  repository: string,
  readline: Interface,
): Promise<VariableChange[]> {
  const question =
    "Configure optional OpenCode model variables (provider/model#variant)";
  if (!(await confirm(question, false, readline))) return [];
  const existing = JSON.parse(
    runCommand("gh", [
      "variable",
      "list",
      "--repo",
      repository,
      "--json",
      "name,value",
    ]),
  ) as ExistingVariable[];
  const byName = new Map(
    existing.map((variable) => [variable.name, variable.value]),
  );
  const changes: VariableChange[] = [];

  for (const name of MODEL_VARIABLES) {
    const current = byName.get(name) ?? "";
    const value = await askModelList(name, current, readline);
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

const isHttpStatus = (error: unknown, ...statuses: number[]): boolean =>
  error instanceof CommandError && statuses.includes(error.httpStatus);

// GitHub answers 409 when an organization policy overrides a repository
// Actions setting. Name the organization setting to change instead.
const ORGANIZATION_ACTIONS_POLICY = {
  permissions:
    "enable GitHub Actions limited to selected actions. Allow it under Organization settings > Actions > General > Policies",
  "selected-actions":
    "choose its allowed actions. Allow it under Organization settings > Actions > General > Policies",
  workflow:
    "let GitHub Actions create pull requests. Enable 'Allow GitHub Actions to create and approve pull requests' under Organization settings > Actions > General > Workflow permissions",
} as const;

export function applyActionsSettings(
  repository: string,
  settings: ActionsSettings,
  request: ApiRequest = api,
): void {
  const steps = [
    ["permissions", "", settings.permissions],
    ["selected-actions", "/selected-actions", settings.selectedActions],
    ["workflow", "/workflow", settings.workflow],
  ] as const;
  for (const [step, suffix, body] of steps) {
    try {
      request("PUT", `/repos/${repository}/actions/permissions${suffix}`, body);
    } catch (error) {
      if (!isHttpStatus(error, 409)) throw error;
      throw new Error(
        `The organization does not allow ${repository} to ${ORGANIZATION_ACTIONS_POLICY[step]}, then run setup again.`,
        { cause: error },
      );
    }
  }
}

function getRetentionState(repository: string): RetentionState | undefined {
  try {
    return api<RetentionState>(
      "GET",
      `/repos/${repository}/actions/permissions/artifact-and-log-retention`,
    );
  } catch (error) {
    if (isHttpStatus(error, 404)) return undefined;
    throw error;
  }
}

function getDependabotState(repository: string): DependabotSettings {
  let vulnerabilityAlerts = true;
  try {
    // 204 when enabled, 404 when disabled.
    api("GET", `/repos/${repository}/vulnerability-alerts`);
  } catch (error) {
    if (!isHttpStatus(error, 404)) throw error;
    vulnerabilityAlerts = false;
  }
  let securityUpdates = false;
  try {
    securityUpdates = Boolean(
      api<{ enabled?: boolean }>(
        "GET",
        `/repos/${repository}/automated-security-fixes`,
      )?.enabled,
    );
  } catch (error) {
    if (!isHttpStatus(error, 404)) throw error;
  }
  return {
    vulnerability_alerts: vulnerabilityAlerts,
    security_updates: securityUpdates,
  };
}

function applyDependabot(
  repository: string,
  current: DependabotSettings,
  settings: DependabotSettings,
): void {
  // Security updates build on the alerts, so enable the alerts first.
  if (settings.vulnerability_alerts) {
    api("PUT", `/repos/${repository}/vulnerability-alerts`);
  }
  if (settings.security_updates) {
    api("PUT", `/repos/${repository}/automated-security-fixes`);
  } else if (current.security_updates) {
    api("DELETE", `/repos/${repository}/automated-security-fixes`);
  }
}

// Sent apart from the other repository settings: private repositories without
// GitHub Secret Protection reject it, which must not block the rest of setup.
function applySecurityAndAnalysis(
  repository: string,
  settings: SecurityAndAnalysisSettings,
): void {
  try {
    api("PATCH", `/repos/${repository}`, { security_and_analysis: settings });
  } catch (error) {
    if (!isHttpStatus(error, 403, 404, 422)) throw error;
    console.warn(
      "Secret scanning is unavailable for this repository (private repositories need GitHub Secret Protection); skipped.",
    );
  }
}

function applyRetention(repository: string, settings: RetentionSettings): void {
  api(
    "PUT",
    `/repos/${repository}/actions/permissions/artifact-and-log-retention`,
    settings,
  );
}

function getCacheRetentionState(
  repository: string,
): CacheRetentionState | undefined {
  try {
    return api<CacheRetentionState>(
      "GET",
      `/repos/${repository}/actions/cache/retention-limit`,
    );
  } catch (error) {
    if (isHttpStatus(error, 403, 404)) return undefined;
    throw error;
  }
}

// An organization or enterprise may cap cache retention below the starter's
// value; GitHub reports the cap only by rejecting the request, so keep the
// current value instead of stopping setup.
export function applyCacheRetention(
  repository: string,
  settings: CacheRetentionSettings,
  request: ApiRequest = api,
): void {
  try {
    request(
      "PUT",
      `/repos/${repository}/actions/cache/retention-limit`,
      settings,
    );
  } catch (error) {
    if (!isHttpStatus(error, 400, 403, 422)) throw error;
    console.warn(
      `Actions cache retention could not be set to ${settings.max_cache_retention_days} days; an organization or enterprise policy may cap it. Kept the current value.`,
    );
  }
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

// A ruleset the API rejects as invalid is a mistake in the desired ruleset,
// not a sign that Rulesets are unavailable, so it is not a reason to fall
// back to classic branch protection.
function isRulesetUnavailable(error: unknown): boolean {
  return (
    error instanceof CommandError &&
    [403, 404, 422].includes(error.httpStatus) &&
    !error.stderr.includes("Validation Failed")
  );
}

function getReleaseKeyState(repository: string): ReleaseKeyState {
  const keys = api<Array<{ id: number; title: string; read_only: boolean }>>(
    "GET",
    `/repos/${repository}/keys?per_page=100`,
  )!;
  const key = keys.find(({ title }) => title === RELEASE_KEY_TITLE);
  let secret = true;
  try {
    api("GET", `/repos/${repository}/actions/secrets/${RELEASE_KEY_SECRET}`);
  } catch (error) {
    if (!(error instanceof CommandError && error.httpStatus === 404)) {
      throw error;
    }
    secret = false;
  }
  return { key, secret };
}

function printReleaseKeyPlan(plan: ReleaseKeyPlan): void {
  console.log("\nRelease deploy key");
  if (plan === "keep") console.log("  No changes.");
  else if (plan === "create") {
    console.log(
      `  Create the writable deploy key "${RELEASE_KEY_TITLE}" and the ${RELEASE_KEY_SECRET} secret.`,
    );
  } else {
    console.log(
      `  Replace the deploy key "${RELEASE_KEY_TITLE}" and the ${RELEASE_KEY_SECRET} secret (one is missing or read-only).`,
    );
  }
}

/**
 * Create a new key pair, register its public half as a writable deploy key
 * and store its private half in the secret, then drop the key it replaces.
 * The private key only ever exists in a temporary directory and the secret.
 */
function applyReleaseKey(
  repository: string,
  plan: ReleaseKeyPlan,
  state: ReleaseKeyState,
): void {
  if (plan === "keep") return;
  const directory = mkdtempSync(path.join(tmpdir(), "release-key-"));
  try {
    const file = path.join(directory, "key");
    runCommand("ssh-keygen", [
      "-t",
      "ed25519",
      "-N",
      "",
      "-C",
      `${RELEASE_KEY_TITLE} (${repository})`,
      "-f",
      file,
      "-q",
    ]);
    api("POST", `/repos/${repository}/keys`, {
      title: RELEASE_KEY_TITLE,
      key: readFileSync(`${file}.pub`, "utf8").trim(),
      read_only: false,
    });
    runCommand(
      "gh",
      ["secret", "set", RELEASE_KEY_SECRET, "--repo", repository],
      { input: readFileSync(file, "utf8") },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  if (state.key) api("DELETE", `/repos/${repository}/keys/${state.key.id}`);
  console.log(`Applied release deploy key: ${RELEASE_KEY_TITLE}`);
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
    const modelVariables: VariableChange[] = args.defaults
      ? []
      : await getModelVariableChanges(repository, readline!);
    const securityUpdates = args.defaults
      ? false
      : await confirm(
          "Enable Dependabot security updates (Dependabot opens pull requests for vulnerable dependencies)",
          false,
          readline!,
        );
    const repositorySettings = buildRepositorySettings(metadataResult.metadata);
    const repositoryChanges = diffObject(state, repositorySettings);
    const actionsState = getActionsState(repository);
    const shaPinningRequired = Boolean(
      actionsState.permissions.sha_pinning_required,
    );
    const actionsSettings = buildActionsSettings({ shaPinningRequired });
    const retentionState = getRetentionState(repository);
    const retentionSettings =
      retentionState &&
      buildRetentionSettings(retentionState.maximum_allowed_days);
    const cacheRetentionState = getCacheRetentionState(repository);
    const cacheRetentionSettings =
      cacheRetentionState && buildCacheRetentionSettings();
    const securityState = (state.security_and_analysis ??
      {}) as SecurityAndAnalysisState;
    const securitySettings = buildSecurityAndAnalysis();
    const dependabotState = getDependabotState(repository);
    const dependabotSettings = buildDependabotSettings({ securityUpdates });
    const desiredLabels = parseLabels(
      readFileSync(path.join(repositoryRoot, ".github/labels.yml"), "utf8"),
    );
    const labelChanges = diffLabels(
      desiredLabels,
      getCurrentLabels(repository),
    );
    const releaseKeyState = getReleaseKeyState(repository);
    const releaseKeyPlan = planReleaseKey(releaseKeyState);

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
    if (retentionSettings) {
      printDiff(
        "Artifact and log retention",
        diffObject(retentionState, retentionSettings),
      );
    } else {
      console.warn(
        "\nArtifact and log retention cannot be read for this repository; skipped.",
      );
    }
    if (cacheRetentionSettings) {
      printDiff(
        "Actions cache retention",
        diffObject(cacheRetentionState, cacheRetentionSettings),
      );
    } else {
      console.warn(
        "\nActions cache retention cannot be read for this repository; skipped.",
      );
    }
    printDiff("Secret scanning", diffObject(securityState, securitySettings));
    printDiff("Dependabot", diffObject(dependabotState, dependabotSettings));
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
      "OpenCode model variables",
      modelVariables.map((variable) => ({
        key: variable.name,
        current: variable.current || undefined,
        desired: variable.value,
      })),
    );
    printLabelDiff(labelChanges);
    printReleaseKeyPlan(releaseKeyPlan);
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

    // Actions first: an organization policy conflict then stops setup before
    // any other setting changes.
    applyActionsSettings(repository, actionsSettings);
    if (retentionSettings) applyRetention(repository, retentionSettings);
    if (cacheRetentionSettings) {
      applyCacheRetention(repository, cacheRetentionSettings);
    }
    api("PATCH", `/repos/${repository}`, repositorySettings);
    applySecurityAndAnalysis(repository, securitySettings);
    applyDependabot(repository, dependabotState, dependabotSettings);
    if (metadataResult.topics) {
      api("PUT", `/repos/${repository}/topics`, {
        names: metadataResult.topics,
      });
    }
    for (const variable of modelVariables) {
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
    applyReleaseKey(repository, releaseKeyPlan, releaseKeyState);
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
