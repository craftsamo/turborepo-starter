// Entry point for .github/workflows/opencode.yml:
//   prepare  parse the comment, fetch context, write the prompt (GH_TOKEN)
//   run      run the agent with the model candidates (provider keys only)
//   publish  post the answer or review back to GitHub (GH_TOKEN)
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  checkCommand,
  isPullRequestTarget,
  parseCommand,
  type AgentName,
  type Target,
} from "./command.mts";
import {
  BASE_REF,
  buildPrompt,
  HEAD_REF,
  readEvent,
  type CommentInfo,
  type PullInfo,
} from "./context.mts";
import { parseDefaultModels, resolveModelSource } from "./models.mts";
import {
  neutralizeMentions,
  parseRunOutput,
  redactSecrets,
  SECRET_VARIABLES,
  type RunOutcome,
} from "./output.mts";
import {
  buildReviewPayload,
  commentableLines,
  parseReviewOutput,
} from "./review.mts";
import {
  buildRunArgs,
  footer,
  runWithFallback,
  type RunResult,
} from "./runner.mts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const configDir = path.join(root, ".github", "opencode");
const RUN_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_COMMENT = 60_000;

interface Destination {
  repository: string;
  number: number;
  // Root comment of the review thread to answer in, when there is one.
  threadId?: number | undefined;
}

interface Meta extends Destination {
  agent: AgentName;
  target: Target;
  permalinkBase: string;
  headSha: string;
  runUrl: string;
}

type Json = Record<string, unknown>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

function workDir(): string {
  const dir = path.join(requireEnv("RUNNER_TEMP"), "opencode");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function setOutput(name: string, value: string): void {
  appendFileSync(requireEnv("GITHUB_OUTPUT"), `${name}=${value}\n`);
}

function run(command: string, args: string[], input?: string): string {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    input,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["pipe", "pipe", "inherit"],
  });
}

function api<T>(method: string, endpoint: string, body?: unknown): T {
  const args = ["api", "--method", method, endpoint];
  if (body !== undefined) args.push("--input", "-");
  const output = run(
    "gh",
    args,
    body === undefined ? undefined : JSON.stringify(body),
  );
  return (output.trim() ? JSON.parse(output) : undefined) as T;
}

function apiPages<T>(endpoint: string): T[] {
  const pages = JSON.parse(
    run("gh", ["api", "--paginate", "--slurp", endpoint]),
  ) as T[][];
  return pages.flat();
}

// Fetch with the workflow token through gh so no credential is ever written
// to .git/config, where the agent could read it.
function gitFetch(refspecs: string[]): void {
  run("git", [
    "-c",
    "credential.helper=",
    "-c",
    "credential.helper=!gh auth git-credential",
    "fetch",
    "--no-tags",
    "origin",
    ...refspecs,
  ]);
}

function limit(text: string): string {
  return text.length <= MAX_COMMENT
    ? text
    : `${text.slice(0, MAX_COMMENT)}\n\n… (truncated)`;
}

function reply(destination: Destination, body: string): void {
  const { repository, number, threadId } = destination;
  if (threadId !== undefined) {
    try {
      api(
        "POST",
        `/repos/${repository}/pulls/${number}/comments/${threadId}/replies`,
        { body: limit(body) },
      );
      return;
    } catch (error) {
      console.log(
        `::warning::Thread reply failed, commenting on the pull request: ${error}`,
      );
    }
  }
  api("POST", `/repos/${repository}/issues/${number}/comments`, {
    body: limit(body),
  });
}

// Cosmetic, so a failure (for example a read-only token) never stops a run.
function react(repository: string, target: Target, commentId: number): void {
  const kind = target === "pull_request_review_comment" ? "pulls" : "issues";
  try {
    api(
      "POST",
      `/repos/${repository}/${kind}/comments/${commentId}/reactions`,
      { content: "eyes" },
    );
  } catch (error) {
    console.log(`::warning::Could not add a reaction: ${error}`);
  }
}

function login(user: unknown): string {
  const value = (user as Json | null)?.login;
  return typeof value === "string" ? value : "ghost";
}

function prepare(): void {
  const event = readEvent(
    requireEnv("GITHUB_EVENT_NAME"),
    readJson<unknown>(requireEnv("GITHUB_EVENT_PATH")),
  );
  const command = event
    ? parseCommand(event.commentBody, event.target)
    : undefined;
  if (!event || !command || command.kind === "ignore") {
    setOutput("agent", "");
    return;
  }

  const repository = requireEnv("GITHUB_REPOSITORY");
  const destination: Destination = {
    repository,
    number: event.number,
    threadId: event.reviewThread?.rootCommentId,
  };
  const check = checkCommand(command, event.target);
  if (!check.ok) {
    reply(destination, check.message);
    setOutput("agent", "");
    return;
  }
  react(repository, event.target, event.commentId);

  const issue = api<Json>("GET", `/repos/${repository}/issues/${event.number}`);
  const comments: CommentInfo[] = apiPages<Json>(
    `/repos/${repository}/issues/${event.number}/comments?per_page=100`,
  )
    .filter((comment) => comment.id !== event.commentId)
    .map((comment) => ({
      author: login(comment.user),
      body: String(comment.body ?? ""),
    }));

  let pull: PullInfo | undefined;
  let headSha = run("git", ["rev-parse", "HEAD"]).trim();
  if (isPullRequestTarget(event.target)) {
    const pr = api<Json>("GET", `/repos/${repository}/pulls/${event.number}`);
    const base = pr.base as Json;
    const head = pr.head as Json;
    gitFetch([
      `+refs/pull/${event.number}/head:${HEAD_REF}`,
      `+refs/heads/${String(base.ref)}:${BASE_REF}`,
    ]);
    // The fetched ref, not the API response, is what the agent reads; a push
    // in between would otherwise misplace inline comments.
    headSha = run("git", ["rev-parse", HEAD_REF]).trim();
    pull = {
      baseBranch: String(base.ref),
      headLabel: String(head.label),
      headSha,
      files: apiPages<Json>(
        `/repos/${repository}/pulls/${event.number}/files?per_page=100`,
      ).map((file) => ({
        filename: String(file.filename),
        status: String(file.status),
        additions: Number(file.additions),
        deletions: Number(file.deletions),
      })),
    };
  }

  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const meta: Meta = {
    ...destination,
    agent: command.agent,
    target: event.target,
    permalinkBase: `${server}/${repository}/blob/${headSha}`,
    headSha,
    runUrl: `${server}/${repository}/actions/runs/${requireEnv("GITHUB_RUN_ID")}`,
  };
  const prompt = buildPrompt({
    agent: command.agent,
    instruction: command.instruction,
    repository,
    event,
    issue: {
      title: String(issue.title ?? ""),
      body: String(issue.body ?? ""),
      author: login(issue.user),
      url: String(issue.html_url ?? ""),
    },
    pull,
    comments,
    permalinkBase: meta.permalinkBase,
  });

  const dir = workDir();
  writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  writeFileSync(path.join(dir, "prompt.md"), prompt);
  setOutput("agent", command.agent);
}

function runOpenCode(
  agent: AgentName,
  model: string,
  prompt: string,
  xdg: string,
): RunOutcome {
  // Unset secrets reach the step as empty strings; drop them so OpenCode
  // treats those providers as unconfigured.
  const env: NodeJS.ProcessEnv = { ...process.env, XDG_CONFIG_HOME: xdg };
  for (const name of SECRET_VARIABLES) {
    if (!env[name]) delete env[name];
  }

  console.log(`::group::opencode run --agent ${agent} --model ${model}`);
  const child = spawnSync("opencode", buildRunArgs(agent, model), {
    cwd: root,
    encoding: "utf8",
    env,
    input: prompt,
    killSignal: "SIGKILL",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["pipe", "pipe", "inherit"],
    timeout: RUN_TIMEOUT_MS,
  });
  console.log("::endgroup::");

  if (child.error) {
    const timedOut =
      (child.error as NodeJS.ErrnoException).code === "ETIMEDOUT";
    return {
      text: "",
      error: timedOut
        ? {
            type: "timeout",
            message: `opencode run did not finish within ${RUN_TIMEOUT_MS / 60_000} minutes.`,
          }
        : { type: "spawn", message: child.error.message },
    };
  }
  const outcome = parseRunOutput(child.stdout ?? "");
  if (!outcome.error && child.status !== 0) {
    return {
      ...outcome,
      error: { type: "exit", message: `opencode exited with ${child.status}.` },
    };
  }
  return outcome;
}

function runAgent(): void {
  const dir = workDir();
  const meta = readJson<Meta>(path.join(dir, "meta.json"));
  const prompt = readFileSync(path.join(dir, "prompt.md"), "utf8");

  let result: RunResult;
  try {
    const defaults = parseDefaultModels(
      readFileSync(path.join(configDir, "models.json"), "utf8"),
    );
    const source = resolveModelSource(meta.agent, process.env, defaults);
    const xdg = path.join(dir, "xdg");
    cpSync(configDir, path.join(xdg, "opencode"), { recursive: true });
    result = runWithFallback(source, (model) =>
      runOpenCode(meta.agent, model, prompt, xdg),
    );
  } catch (error) {
    result = { ok: false, text: "", error: String(error), tried: [] };
  }

  const redacted: RunResult = {
    ...result,
    text: redactSecrets(result.text, process.env),
  };
  if (result.error) {
    redacted.error = redactSecrets(result.error, process.env);
  }
  writeFileSync(path.join(dir, "result.json"), JSON.stringify(redacted));
  console.log(
    redacted.ok
      ? `Answered with ${redacted.model}.`
      : `Failed: ${redacted.error}`,
  );
}

function publishReview(meta: Meta, text: string, foot: string): boolean {
  const parsed = parseReviewOutput(text);
  if (!parsed) return false;
  // Finding bodies sit inside the json fence, so neutralize them one by one.
  const review = {
    summary: neutralizeMentions(parsed.summary),
    findings: parsed.findings.map((finding) => ({
      ...finding,
      body: neutralizeMentions(finding.body),
    })),
  };

  const diff = run("git", [
    "-c",
    "core.quotePath=false",
    "diff",
    `${BASE_REF}...${HEAD_REF}`,
  ]);
  const options = {
    commitId: meta.headSha,
    permalinkBase: meta.permalinkBase,
    footer: foot,
  };
  const endpoint = `/repos/${meta.repository}/pulls/${meta.number}/reviews`;
  const payload = buildReviewPayload(review, commentableLines(diff), options);
  try {
    api("POST", endpoint, { ...payload, body: limit(payload.body) });
  } catch (error) {
    console.log(`::warning::Inline review failed, posting a comment: ${error}`);
    reply(meta, buildReviewPayload(review, new Map(), options).body);
  }
  return true;
}

function formatFailure(agent: AgentName, error: string, foot: string): string {
  const detail = neutralizeMentions(error).replaceAll("```", "'''");
  return `OpenCode could not complete \`${agent}\`.\n\n\`\`\`text\n${detail}\n\`\`\`\n\n${foot}`;
}

function publish(): void {
  const dir = workDir();
  const meta = readJson<Meta>(path.join(dir, "meta.json"));
  const resultFile = path.join(dir, "result.json");
  const result: RunResult = existsSync(resultFile)
    ? readJson<RunResult>(resultFile)
    : {
        ok: false,
        text: "",
        error: "The agent step did not produce a result.",
        tried: [],
      };
  const foot = footer(meta.agent, result.model, meta.runUrl);

  if (!result.ok) {
    reply(
      meta,
      formatFailure(meta.agent, result.error ?? "Unknown error.", foot),
    );
    process.exitCode = 1;
    return;
  }
  if (meta.agent === "review" && publishReview(meta, result.text, foot)) return;
  reply(meta, `${neutralizeMentions(result.text)}\n\n${foot}`);
}

const commands: Record<string, () => void> = {
  prepare,
  run: runAgent,
  publish,
};
const name = process.argv[2] ?? "";
const handler = commands[name];
if (!handler) {
  console.error("Usage: node scripts/ci/opencode/main.mts prepare|run|publish");
  process.exitCode = 2;
} else {
  handler();
}
