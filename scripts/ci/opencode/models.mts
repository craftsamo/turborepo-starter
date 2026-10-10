import type { AgentName } from "./command.mts";

export interface ModelSource {
  origin: "variable" | "default";
  variable?: string;
  models: string[];
}

export interface DefaultModels {
  source: string;
  checkedAt: string;
  policy: string;
  candidates: string[];
}

export interface RunError {
  type?: string | undefined;
  status?: number | undefined;
  message?: string | undefined;
}

const MODEL_ID = /^[^\s/#,]+\/[^\s#,]+(?:#[^\s#,]+)?$/;

export function parseModelList(value: string, label: string): string[] {
  const models = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const model of models) {
    if (!MODEL_ID.test(model)) {
      throw new Error(
        `${label}: "${model}" is not a model ID. Use provider/model or provider/model#variant.`,
      );
    }
  }
  return models;
}

export function parseDefaultModels(raw: string): DefaultModels {
  const data: unknown = JSON.parse(raw);
  if (typeof data !== "object" || data === null) {
    throw new Error("models.json must contain an object.");
  }
  const record = data as Record<string, unknown>;
  const candidates = record.candidates;
  if (
    !Array.isArray(candidates) ||
    candidates.length === 0 ||
    !candidates.every((item) => typeof item === "string")
  ) {
    throw new Error(
      "models.json: candidates must be a non-empty string array.",
    );
  }
  return {
    source: String(record.source ?? ""),
    checkedAt: String(record.checkedAt ?? ""),
    policy: String(record.policy ?? ""),
    candidates: parseModelList(candidates.join(","), "models.json"),
  };
}

export function agentVariable(agent: AgentName): string {
  return `OPENCODE_MODEL_${agent.toUpperCase()}`;
}

export function resolveModelSource(
  agent: AgentName,
  env: Record<string, string | undefined>,
  defaults: DefaultModels,
): ModelSource {
  for (const variable of [agentVariable(agent), "OPENCODE_MODEL"]) {
    const value = env[variable]?.trim();
    if (value) {
      return {
        origin: "variable",
        variable,
        models: parseModelList(value, variable),
      };
    }
  }
  return { origin: "default", models: [...defaults.candidates] };
}

// `provider.no-route`: the model or variant is not reachable with the current
// credentials (unknown ID, paid model without a key, retired free model).
// A 403 from the free tier means the free model refused this client; only the
// curated default list may skip past it, because a configured model failing
// that way is a setup problem the user should see.
export function shouldTryNextModel(
  origin: ModelSource["origin"],
  error: RunError | undefined,
): boolean {
  if (!error) return false;
  if (error.type === "provider.no-route") return true;
  return (
    origin === "default" &&
    error.type === "provider.auth" &&
    error.status === 403
  );
}
