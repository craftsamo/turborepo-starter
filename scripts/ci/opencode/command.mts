export const AGENTS = ["plan", "build", "review", "debug"] as const;
export type AgentName = (typeof AGENTS)[number];

// `build` is reserved so `/oc build ...` is never mistaken for a plan request.
export const AVAILABLE_AGENTS: readonly AgentName[] = [
  "plan",
  "review",
  "debug",
];

export type Target = "issue" | "pull_request" | "pull_request_review_comment";

export type ParsedCommand =
  { kind: "ignore" } | { kind: "run"; agent: AgentName; instruction: string };

export type CommandCheck = { ok: true } | { ok: false; message: string };

const PREFIX = /^\/(?:oc|opencode)(?=\s|$)/;

function isAgentName(value: string): value is AgentName {
  return (AGENTS as readonly string[]).includes(value);
}

export function isPullRequestTarget(target: Target): boolean {
  return target !== "issue";
}

export function parseCommand(body: string, target: Target): ParsedCommand {
  const text = body.trimStart();
  const prefix = PREFIX.exec(text);
  if (!prefix) return { kind: "ignore" };

  const rest = text.slice(prefix[0].length).trim();
  const [first = "", ...others] = rest.split(/(\s+)/);
  const keyword = first.toLowerCase();

  if (isAgentName(keyword)) {
    return { kind: "run", agent: keyword, instruction: others.join("").trim() };
  }

  if (rest === "") {
    return {
      kind: "run",
      agent: isPullRequestTarget(target) ? "review" : "plan",
      instruction: "",
    };
  }

  return { kind: "run", agent: "plan", instruction: rest };
}

export function usage(target: Target): string {
  const lines = [
    "Usage: `/oc [plan|review|debug] <instruction>` (`/opencode` also works).",
    "",
    "- `plan` (default): investigate and propose a plan. Read-only.",
    "- `debug`: diagnose a bug or failure and find the root cause. Read-only.",
  ];
  if (isPullRequestTarget(target)) {
    lines.push(
      "- `review`: review this pull request with inline comments. Read-only.",
    );
  }
  return lines.join("\n");
}

export function checkCommand(
  command: Extract<ParsedCommand, { kind: "run" }>,
  target: Target,
): CommandCheck {
  if (!AVAILABLE_AGENTS.includes(command.agent)) {
    return {
      ok: false,
      message: `\`${command.agent}\` is not available yet.\n\n${usage(target)}`,
    };
  }
  if (command.agent === "review" && !isPullRequestTarget(target)) {
    return {
      ok: false,
      message: `\`review\` only works on pull requests.\n\n${usage(target)}`,
    };
  }
  return { ok: true };
}
