import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DEFAULT_MAX_CHANGED_LINES = 500;
export const DEFAULT_EXCLUDED_PATHS = new Set(["pnpm-lock.yaml"]);

export function countChangedLines(
  numstat,
  excludedPaths = DEFAULT_EXCLUDED_PATHS,
) {
  let changedLines = 0;

  for (const line of numstat.split("\n")) {
    if (!line) continue;

    const [additions, deletions, path] = line.split("\t");

    if (path === undefined) {
      throw new Error(`Unexpected git numstat line: ${line}`);
    }

    if (excludedPaths.has(path)) continue;
    if (additions === "-" && deletions === "-") continue;

    const additionCount = Number.parseInt(additions, 10);
    const deletionCount = Number.parseInt(deletions, 10);

    if (!Number.isInteger(additionCount) || !Number.isInteger(deletionCount)) {
      throw new Error(`Unexpected git numstat line: ${line}`);
    }

    changedLines += additionCount + deletionCount;
  }

  return changedLines;
}

export function numstatPaths(numstat) {
  return numstat
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t")[2])
    .filter((path) => path !== undefined);
}

// Paths marked `linguist-generated` in .gitattributes, read from the
// NUL-separated output of `git check-attr -z linguist-generated`
// (path, attribute, value triples). Generated output such as migration
// snapshots is not reviewed line by line, so it does not count.
export function generatedPaths(checkAttrOutput) {
  const fields = checkAttrOutput.split("\0");
  const generated = new Set();

  for (let index = 0; index + 2 < fields.length; index += 3) {
    const [path, , value] = fields.slice(index, index + 3);

    if (value === "set" || value === "true") generated.add(path);
  }

  return generated;
}

export function evaluateCommitSize(
  numstat,
  maxChangedLines = DEFAULT_MAX_CHANGED_LINES,
  excludedPaths = DEFAULT_EXCLUDED_PATHS,
) {
  const changedLines = countChangedLines(numstat, excludedPaths);

  return {
    changedLines,
    maxChangedLines,
    passes: changedLines <= maxChangedLines,
  };
}

export function parseMaxChangedLines(value) {
  if (value === undefined) return DEFAULT_MAX_CHANGED_LINES;

  const maxChangedLines = Number(value);

  if (!Number.isInteger(maxChangedLines) || maxChangedLines < 1) {
    throw new Error("MAX_COMMIT_CHANGED_LINES must be a positive integer.");
  }

  return maxChangedLines;
}

function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--cached") {
    console.error("Usage: node scripts/check-commit-size.mjs --cached");
    process.exitCode = 2;
    return;
  }

  const numstat = execFileSync(
    "git",
    ["diff", "--cached", "--numstat", "--no-renames"],
    { encoding: "utf8" },
  );
  const paths = numstatPaths(numstat);
  // --cached reads .gitattributes from the index, so the attributes being
  // committed decide, not uncommitted edits to them.
  const generated = paths.length
    ? generatedPaths(
        execFileSync(
          "git",
          ["check-attr", "-z", "--cached", "--stdin", "linguist-generated"],
          { encoding: "utf8", input: paths.join("\0") + "\0" },
        ),
      )
    : new Set();
  const result = evaluateCommitSize(
    numstat,
    parseMaxChangedLines(process.env.MAX_COMMIT_CHANGED_LINES),
    new Set([...DEFAULT_EXCLUDED_PATHS, ...generated]),
  );

  if (result.passes) return;

  console.error(
    [
      `Commit contains ${result.changedLines} reviewable changed lines; the limit is ${result.maxChangedLines}.`,
      "Split the staged changes into smaller, focused commits.",
      "Mark generated files `linguist-generated` in .gitattributes to leave them out of the count.",
      "Use --no-verify only when the repository policy explicitly permits an exception.",
    ].join("\n"),
  );
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
