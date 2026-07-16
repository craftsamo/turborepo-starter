import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";
import type { Interface } from "node:readline/promises";

import { applyFileTransaction } from "./files.mts";
import {
  buildProjectPlan,
  defaultLicense,
  parseArguments,
  resolveAnswers,
} from "./policy.mts";
import type {
  ProjectAnswers,
  ProjectArguments,
  ProjectKind,
  ProjectLicense,
  ProjectPlan,
  RootPackage,
} from "./policy.mts";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const guardedPaths = [
  "package.json",
  "README.md",
  "LICENSE",
  "NOTICE",
  "LICENSES",
];

async function ask(
  question: string,
  defaultValue: string,
  readline: Interface,
): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await readline.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
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

async function collectAnswers(
  args: ProjectArguments,
  currentPackage: RootPackage,
  readline: Interface,
): Promise<ProjectAnswers> {
  const kind = args.kind ?? (await chooseKind(readline));
  const name =
    args.name ??
    (await ask("Project name", path.basename(repositoryRoot), readline));
  const description =
    args.description ?? (await ask("Description", "", readline));
  const gitAuthor = runGit(["config", "user.name"], true);
  const author =
    args.author ??
    (await ask("Author", gitAuthor || currentPackage.author || "", readline));
  const copyrightHolder =
    args.copyrightHolder ??
    (await ask("Copyright holder", author, readline));
  const license =
    args.license ??
    (kind === "private" ? defaultLicense(kind) : await chooseLicense(readline));

  return resolveAnswers({
    kind,
    license,
    name,
    description,
    author,
    copyrightHolder,
    year: args.year ?? new Date().getFullYear(),
  });
}

function collectNonInteractiveAnswers(
  args: ProjectArguments,
): ProjectAnswers {
  const required: Array<[string, string | undefined]> = [
    ["--kind", args.kind],
    ["--name", args.name],
    ["--description", args.description],
    ["--author", args.author],
    ["--copyright-holder", args.copyrightHolder],
  ];
  const missing = required
    .filter(([, value]) => !value)
    .map(([flag]) => flag);
  if (missing.length > 0) {
    throw new Error(
      `Non-interactive setup requires ${missing.join(", ")}.`,
    );
  }

  return resolveAnswers({
    kind: args.kind as ProjectKind,
    ...(args.license ? { license: args.license } : {}),
    name: args.name as string,
    description: args.description as string,
    author: args.author as string,
    copyrightHolder: args.copyrightHolder as string,
    year: args.year ?? new Date().getFullYear(),
  });
}

async function chooseKind(readline: Interface): Promise<ProjectKind> {
  console.log("\nProject type");
  console.log("  1. Private / commercial");
  console.log("  2. Open source");
  console.log("  3. Reusable starter");
  const choice = await ask("Choose a project type", "1", readline);
  if (choice === "1") return "private";
  if (choice === "2") return "oss";
  if (choice === "3") return "starter";
  throw new Error("Invalid project type selection.");
}

async function chooseLicense(readline: Interface): Promise<ProjectLicense> {
  console.log("\nLicense");
  console.log("  1. MIT");
  console.log("  2. Apache-2.0");
  const choice = await ask("Choose a license", "1", readline);
  if (choice === "1") return "MIT";
  if (choice === "2") return "Apache-2.0";
  throw new Error("Invalid license selection.");
}

function assertTargetFilesClean(): void {
  const output = runGit(["status", "--porcelain", "--", ...guardedPaths]);
  if (output) {
    throw new Error(
      `Project setup target files have uncommitted changes:\n${output}`,
    );
  }
}

function assertSafeCreates(plan: ProjectPlan): void {
  for (const file of plan.files) {
    if (file.path === "README.md" || file.path === "LICENSE") continue;
    const target = path.join(repositoryRoot, file.path);
    if (existsSync(target) && readFileSync(target, "utf8") !== file.content) {
      throw new Error(`Refusing to overwrite existing ${file.path}.`);
    }
  }
}

function printPlan(
  currentPackage: RootPackage,
  answers: ProjectAnswers,
  plan: ProjectPlan,
): void {
  console.log("\nProject setup plan");
  console.log(`  Kind: ${answers.kind}`);
  printValue("name", currentPackage.name, plan.packageJson.name);
  printValue(
    "description",
    currentPackage.description ?? "",
    plan.packageJson.description ?? "",
  );
  printValue("author", currentPackage.author ?? "", plan.packageJson.author ?? "");
  printValue(
    "license",
    currentPackage.license ?? "",
    plan.packageJson.license ?? "",
  );
  console.log("\nFiles");
  console.log("  Update: package.json");
  for (const file of plan.files) {
    const action = existsSync(path.join(repositoryRoot, file.path))
      ? "Update"
      : "Create";
    console.log(`  ${action}: ${file.path}`);
  }
}

function printValue(label: string, current: string, desired: string): void {
  if (current === desired) console.log(`  ${label}: ${JSON.stringify(current)}`);
  else {
    console.log(
      `  ${label}: ${JSON.stringify(current)} -> ${JSON.stringify(desired)}`,
    );
  }
}

function applyPlan(plan: ProjectPlan): void {
  applyFileTransaction(repositoryRoot, [
    {
      path: "package.json",
      content: `${JSON.stringify(plan.packageJson, null, 2)}\n`,
    },
    ...plan.files,
  ]);
}

function runGit(args: string[], allowFailure = false): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) return "";
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String(error.stderr).trim()
        : "";
    throw new Error(stderr || `git ${args.join(" ")} failed.`);
  }
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  assertTargetFilesClean();

  const currentPackage = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  ) as RootPackage;
  const currentReadme = readFileSync(
    path.join(repositoryRoot, "README.md"),
    "utf8",
  );
  const currentLicense = readFileSync(
    path.join(repositoryRoot, "LICENSE"),
    "utf8",
  );
  const nonInteractive = args.yes || !process.stdin.isTTY;
  const readline = nonInteractive
    ? undefined
    : createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answers = nonInteractive
      ? collectNonInteractiveAnswers(args)
      : await collectAnswers(args, currentPackage, readline!);
    const plan = buildProjectPlan({
      currentPackage,
      currentReadme,
      currentLicense,
      answers,
    });
    assertSafeCreates(plan);
    printPlan(currentPackage, answers, plan);

    if (args.dryRun) {
      console.log("\nDry run complete. No files changed.");
      return;
    }
    if (nonInteractive && !args.yes) {
      throw new Error("Non-interactive setup requires --yes to write files.");
    }
    if (!args.yes && !(await confirm("Apply these changes", false, readline!))) {
      console.log("Project setup cancelled.");
      return;
    }

    applyPlan(plan);
    console.log("\nProject setup complete.");
  } finally {
    readline?.close();
  }
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
