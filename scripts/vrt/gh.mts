// The git and gh calls the VRT script makes, run in the repository root.
// They run before dependencies are installed in CI, so the script cannot
// borrow repo-kit's.
import { execFileSync } from "node:child_process";

import { resolveRepositoryRoot } from "../repository-root.mts";

export const repositoryRoot = resolveRepositoryRoot();

export function runCommand(command: string, args: string[]): string {
  try {
    return execFileSync(command, args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? "").trim();
    throw new Error(stderr || `${command} ${args.join(" ")} failed.`, {
      cause: error,
    });
  }
}

export function api<T>(method: "GET", endpoint: string): T | undefined {
  const output = runCommand("gh", ["api", "--method", method, endpoint]);
  return output ? (JSON.parse(output) as T) : undefined;
}

export function getRepositoryName(): string {
  return runCommand("gh", [
    "repo",
    "view",
    "--json",
    "nameWithOwner",
    "--jq",
    ".nameWithOwner",
  ]);
}
