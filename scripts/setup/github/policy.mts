export type SetupMode = "setup" | "secrets";

export interface SetupArguments {
  mode: SetupMode;
  dryRun: boolean;
  defaults: boolean;
  yes: boolean;
  repository?: string | undefined;
  scope?: "repository" | undefined;
  environment?: string | undefined;
  secretName?: string | undefined;
}

export interface Label {
  name: string;
  description: string;
  color: string;
}

export interface CurrentLabel {
  name: string;
  description: string | null;
  color: string;
}

export interface LabelUpdate {
  current: CurrentLabel;
  desired: Label;
}

export interface LabelDiff {
  create: Label[];
  update: LabelUpdate[];
  remove: CurrentLabel[];
}

export interface ObjectDiff {
  key: string;
  current: unknown;
  desired: unknown;
}

export interface RepositoryMetadata {
  description?: string;
  homepage?: string;
}

export interface RepositorySettings extends RepositoryMetadata {
  default_branch: string;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_discussions: boolean;
  allow_merge_commit: boolean;
  allow_squash_merge: boolean;
  allow_rebase_merge: boolean;
  allow_auto_merge: boolean;
  delete_branch_on_merge: boolean;
  merge_commit_title: string;
  merge_commit_message: string;
  squash_merge_commit_title: string;
  squash_merge_commit_message: string;
}

export interface ActionsPermissionsSettings {
  enabled: boolean;
  allowed_actions: "selected";
  sha_pinning_required: boolean;
}

export interface SelectedActionsSettings {
  github_owned_allowed: boolean;
  verified_allowed: boolean;
  patterns_allowed: string[];
}

export interface WorkflowSettings {
  default_workflow_permissions: "read";
  can_approve_pull_request_reviews: boolean;
}

export interface ActionsSettings {
  permissions: ActionsPermissionsSettings;
  selectedActions: SelectedActionsSettings;
  workflow: WorkflowSettings;
}

export interface ActionsPermissionsState {
  enabled?: boolean;
  allowed_actions?: string;
  sha_pinning_required?: boolean;
}

export interface SelectedActionsState {
  github_owned_allowed?: boolean;
  verified_allowed?: boolean;
  patterns_allowed?: string[];
}

export interface WorkflowState {
  default_workflow_permissions?: string;
  can_approve_pull_request_reviews?: boolean;
}

export interface ActionsState {
  permissions: ActionsPermissionsState;
  selectedActions: SelectedActionsState;
  workflow: WorkflowState;
}

export interface RestrictionUser {
  login?: string;
}

export interface RestrictionTeam {
  slug?: string;
}

export interface RestrictionApp {
  slug?: string;
}

export interface RestrictionsInput {
  users?: Array<string | RestrictionUser>;
  teams?: Array<string | RestrictionTeam>;
  apps?: Array<string | RestrictionApp>;
}

export interface RestrictionsOutput {
  users: Array<string | RestrictionUser>;
  teams: Array<string | RestrictionTeam>;
  apps: Array<string | RestrictionApp>;
}

export interface BranchStatusCheck {
  context: string;
  app_id?: number | null;
}

export interface BranchProtectionInput {
  required_status_checks?: {
    contexts?: string[];
    checks?: BranchStatusCheck[];
  };
  enforce_admins?: { enabled?: boolean };
  required_pull_request_reviews?: {
    dismissal_restrictions?: RestrictionsInput | null;
    dismiss_stale_reviews?: boolean;
    require_code_owner_reviews?: boolean;
    required_approving_review_count?: number;
    require_last_push_approval?: boolean;
  };
  restrictions?: RestrictionsInput | null;
  required_linear_history?: { enabled?: boolean };
  block_creations?: { enabled?: boolean };
  lock_branch?: { enabled?: boolean };
  allow_fork_syncing?: { enabled?: boolean };
}

export interface BranchProtectionOutput {
  required_status_checks: {
    strict: boolean;
    contexts: string[];
    checks?: BranchStatusCheck[];
  };
  enforce_admins: boolean;
  required_pull_request_reviews: {
    dismissal_restrictions?: RestrictionsOutput;
    dismiss_stale_reviews: boolean;
    require_code_owner_reviews: boolean;
    required_approving_review_count: number;
    require_last_push_approval: boolean;
  };
  restrictions: RestrictionsOutput | null;
  required_conversation_resolution: boolean;
  required_linear_history: boolean;
  allow_force_pushes: boolean;
  allow_deletions: boolean;
  block_creations: boolean;
  lock_branch: boolean;
  allow_fork_syncing: boolean;
}

export interface RulesetStatusCheck {
  context: string;
  integration_id?: number;
}

export interface RulesetInput {
  name: string;
  target: "branch";
  enforcement: "active";
  bypass_actors: Array<{
    actor_id: number;
    actor_type: "RepositoryRole";
    bypass_mode: "always";
  }>;
  conditions: {
    ref_name: {
      include: string[];
      exclude: string[];
    };
  };
  rules: Array<
    | { type: "deletion" }
    | { type: "non_fast_forward" }
    | {
        type: "pull_request";
        parameters: {
          allowed_merge_methods: Array<"merge" | "squash">;
          dismiss_stale_reviews_on_push: boolean;
          require_code_owner_review: boolean;
          require_last_push_approval: boolean;
          required_approving_review_count: number;
          required_review_thread_resolution: boolean;
        };
      }
    | {
        type: "required_status_checks";
        parameters: {
          strict_required_status_checks_policy: boolean;
          do_not_enforce_on_create: boolean;
          required_status_checks: RulesetStatusCheck[];
        };
      }
  >;
}

const REPOSITORY_RULESET_NAME = "Starter: protect main";
const REQUIRED_CHECK = "Required checks";

export const AI_VARIABLES = [
  "AI_PROVIDER_ID",
  "AI_MODEL_ID",
  "AI_REVIEW_MODEL_ID",
  "AI_ISSUE_MODEL_ID",
  "AI_TASK_MODEL_ID",
];
export const COPILOT_SECRETS = [
  "COPILOT_ACCESS_TOKEN",
  "COPILOT_REFRESH_TOKEN",
];
const ALLOWED_ACTION_PATTERNS = [
  "dorny/paths-filter@*",
  "release-drafter/release-drafter@*",
  "micnncim/action-label-syncer@*",
  "sst/opencode/github@*",
];
const LABEL_RENAMES = new Map([["💬quesion", "💬question"]]);

export function parseArguments(argv: string[]): SetupArguments {
  const args: SetupArguments = {
    mode: "setup",
    dryRun: false,
    defaults: false,
    yes: false,
    repository: undefined,
    scope: undefined,
    environment: undefined,
    secretName: undefined,
  };
  const values = [...argv];

  if (values[0] === "secrets") {
    args.mode = values.shift() as "secrets";
  }

  while (values.length > 0) {
    const value = values.shift();

    if (value === "--dry-run") args.dryRun = true;
    else if (value === "--defaults") args.defaults = true;
    else if (value === "--yes") args.yes = true;
    else if (value === "--repo") args.repository = requireValue(value, values);
    else if (value === "--scope")
      args.scope = requireValue(value, values) as "repository";
    else if (value === "--environment") {
      args.environment = requireValue(value, values);
    } else if (value === "--name") {
      args.secretName = requireValue(value, values);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (args.scope && args.scope !== "repository") {
    throw new Error("--scope only accepts 'repository'.");
  }
  if (args.scope && args.environment) {
    throw new Error("Use either --scope or --environment, not both.");
  }
  if (
    args.mode === "setup" &&
    (args.scope || args.environment || args.secretName)
  ) {
    throw new Error("Secret options require the secrets subcommand.");
  }
  if (args.mode === "secrets" && args.defaults) {
    throw new Error("Secrets cannot be configured with --defaults.");
  }
  if ((args.scope || args.environment) && !args.secretName) {
    throw new Error("--scope and --environment require --name.");
  }

  return args;
}

function requireValue(flag: string, values: string[]): string {
  const value = values.shift();
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

export function buildRepositorySettings(
  metadata: RepositoryMetadata = {},
): RepositorySettings {
  return {
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
    ...metadata,
  };
}

export function buildActionsSettings({
  shaPinningRequired = false,
}: {
  shaPinningRequired?: boolean;
} = {}): ActionsSettings {
  return {
    permissions: {
      enabled: true,
      allowed_actions: "selected",
      sha_pinning_required: shaPinningRequired,
    },
    selectedActions: {
      github_owned_allowed: true,
      verified_allowed: false,
      patterns_allowed: [...ALLOWED_ACTION_PATTERNS],
    },
    workflow: {
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: false,
    },
  };
}

export function buildMainRuleset(integrationId: number): RulesetInput {
  return {
    name: REPOSITORY_RULESET_NAME,
    target: "branch",
    enforcement: "active",
    bypass_actors: [
      {
        actor_id: 5,
        actor_type: "RepositoryRole",
        bypass_mode: "always",
      },
    ],
    conditions: {
      ref_name: {
        include: ["refs/heads/main"],
        exclude: [],
      },
    },
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      {
        type: "pull_request",
        parameters: {
          allowed_merge_methods: ["merge", "squash"],
          dismiss_stale_reviews_on_push: false,
          require_code_owner_review: false,
          require_last_push_approval: false,
          required_approving_review_count: 0,
          required_review_thread_resolution: true,
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          strict_required_status_checks_policy: true,
          do_not_enforce_on_create: false,
          required_status_checks: [
            {
              context: REQUIRED_CHECK,
              ...(integrationId ? { integration_id: integrationId } : {}),
            },
          ],
        },
      },
    ],
  };
}

export function buildBranchProtection(
  current: BranchProtectionInput = {},
  integrationId: number,
): BranchProtectionOutput {
  const contexts = new Set(current.required_status_checks?.contexts ?? []);
  contexts.add(REQUIRED_CHECK);
  const checks = new Map(
    (current.required_status_checks?.checks ?? []).map((check) => [
      `${check.context}:${check.app_id ?? ""}`,
      check,
    ]),
  );
  if (integrationId) {
    checks.set(`${REQUIRED_CHECK}:${integrationId}`, {
      context: REQUIRED_CHECK,
      app_id: integrationId,
    });
  }
  const reviews = current.required_pull_request_reviews ?? {};
  const dismissalRestrictions = mapRestrictions(reviews.dismissal_restrictions);

  return {
    required_status_checks: {
      strict: true,
      contexts: [...contexts],
      ...(checks.size > 0 ? { checks: [...checks.values()] } : {}),
    },
    enforce_admins: Boolean(current.enforce_admins?.enabled),
    required_pull_request_reviews: {
      ...(dismissalRestrictions
        ? { dismissal_restrictions: dismissalRestrictions }
        : {}),
      dismiss_stale_reviews: Boolean(reviews.dismiss_stale_reviews),
      require_code_owner_reviews: Boolean(reviews.require_code_owner_reviews),
      required_approving_review_count: Math.max(
        reviews.required_approving_review_count ?? 0,
        0,
      ),
      require_last_push_approval: Boolean(reviews.require_last_push_approval),
    },
    restrictions: mapRestrictions(current.restrictions),
    required_conversation_resolution: true,
    required_linear_history: Boolean(current.required_linear_history?.enabled),
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: Boolean(current.block_creations?.enabled),
    lock_branch: Boolean(current.lock_branch?.enabled),
    allow_fork_syncing: Boolean(current.allow_fork_syncing?.enabled),
  };
}

function mapRestrictions(
  restrictions: RestrictionsInput | null | undefined,
): RestrictionsOutput | null {
  if (!restrictions) return null;
  return {
    users: (restrictions.users ?? []).map((user) =>
      typeof user === "string" ? user : (user.login ?? user),
    ),
    teams: (restrictions.teams ?? []).map((team) =>
      typeof team === "string" ? team : (team.slug ?? team),
    ),
    apps: (restrictions.apps ?? []).map((app) =>
      typeof app === "string" ? app : (app.slug ?? app),
    ),
  };
}

export function parseLabels(source: string): Label[] {
  const labels: Label[] = [];
  let label: Partial<Label> | undefined;

  for (const line of source.split("\n")) {
    const name = line.match(/^\s*- name:\s*(.+)\s*$/);
    if (name) {
      if (label) labels.push(validateLabel(label));
      label = { name: parseYamlString(name[1] as string) };
      continue;
    }

    const property = line.match(/^\s+(description|color):\s*(.+)\s*$/);
    if (label && property) {
      const key = property[1] as "description" | "color";
      label[key] = parseYamlString(property[2] as string);
    }
  }

  if (label) labels.push(validateLabel(label));
  if (labels.length === 0)
    throw new Error("No labels found in .github/labels.yml.");
  return labels;
}

function parseYamlString(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed) as string;
  if (trimmed.startsWith("'"))
    return trimmed.slice(1, -1).replaceAll("''", "'");
  return trimmed;
}

function validateLabel(label: Partial<Label>): Label {
  if (!label.name || label.description === undefined || !label.color) {
    throw new Error(`Incomplete label definition: ${label.name ?? "unknown"}`);
  }
  return label as Label;
}

export function diffLabels(
  desired: Label[],
  current: CurrentLabel[],
  renames: ReadonlyMap<string, string> = LABEL_RENAMES,
): LabelDiff {
  const currentByName = new Map(
    current.map((label) => [label.name.toLowerCase(), label]),
  );
  for (const [previousName, nextName] of renames) {
    if (
      currentByName.has(previousName.toLowerCase()) &&
      currentByName.has(nextName.toLowerCase())
    ) {
      throw new Error(
        `Cannot migrate label '${previousName}' because '${nextName}' already exists. Merge their assignments manually before setup.`,
      );
    }
  }
  const desiredNames = new Set(
    desired.map((label) => label.name.toLowerCase()),
  );
  const create = [];
  const update = [];
  const renamedCurrentNames = new Set();

  for (const label of desired) {
    let existing = currentByName.get(label.name.toLowerCase());
    if (!existing) {
      const previousName = [...renames.entries()].find(
        ([, nextName]) => nextName.toLowerCase() === label.name.toLowerCase(),
      )?.[0];
      existing = previousName
        ? currentByName.get(previousName.toLowerCase())
        : undefined;
      if (existing) renamedCurrentNames.add(existing.name.toLowerCase());
    }
    if (!existing) {
      create.push(label);
      continue;
    }
    if (
      existing.name !== label.name ||
      (existing.description ?? "") !== label.description ||
      existing.color.toLowerCase() !== label.color.toLowerCase()
    ) {
      update.push({ current: existing, desired: label });
    }
  }

  const remove = current.filter(
    (label) =>
      !desiredNames.has(label.name.toLowerCase()) &&
      !renamedCurrentNames.has(label.name.toLowerCase()),
  );
  return { create, update, remove };
}

export function diffObject<Current extends object, Desired extends object>(
  current: Current | undefined,
  desired: Desired,
): ObjectDiff[] {
  const currentRecord = current as Record<string, unknown> | undefined;
  return Object.entries(desired)
    .filter(
      ([key, value]) =>
        JSON.stringify(currentRecord?.[key]) !== JSON.stringify(value),
    )
    .map(([key, value]) => ({
      key,
      current: currentRecord?.[key],
      desired: value,
    }));
}

export { REQUIRED_CHECK, REPOSITORY_RULESET_NAME };
