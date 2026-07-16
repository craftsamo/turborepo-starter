import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { buildLicense, resolveAnswers } from "../setup/project/policy.mts";

const currentPackage = {
  name: "turborepo-starter",
  description: "Starter description",
  author: "craftsamo",
  license: "MIT",
  version: "0.0.0",
  private: true,
};
const currentLicense = "MIT License\n\nCopyright (c) 2025 craftsamo\n";
const currentReadme = `# Welcome to the Turborepo Starter!

Starter description that wraps
over multiple lines.

## Features

- Feature

### Installation

1. **Clone the repository**

\`\`\`sh
git clone https://github.com/craftsamo/turborepo-starter.git
cd turborepo-starter
\`\`\`

2. **Install Dependencies**

3. **Initialize the project**

\`\`\`sh
nps setup.project
\`\`\`

4. **Run Development Server**

\`\`\`
turborepo-starter/
\`\`\`

## License

Old license text.
`;
const projectScriptSource = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../setup/project",
);
const metadataArguments = [
  "--name",
  "example-app",
  "--description",
  "Example application.",
  "--author",
  "Example Author",
  "--copyright-holder",
  "Example Company",
  "--year",
  "2026",
];
const privateArguments = ["--kind", "private", ...metadataArguments];

function answers(overrides = {}) {
  return resolveAnswers({
    kind: "private",
    name: "example-app",
    description: "Example application.",
    author: "Example Author",
    copyrightHolder: "Example Company",
    year: 2026,
    ...overrides,
  });
}

function createFixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "setup-project-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scriptDirectory = path.join(root, "scripts/setup/project");
  mkdirSync(scriptDirectory, { recursive: true });
  cpSync(projectScriptSource, scriptDirectory, { recursive: true });
  writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(currentPackage, null, 2)}\n`,
  );
  writeFileSync(path.join(root, "README.md"), currentReadme);
  writeFileSync(path.join(root, "LICENSE"), currentLicense);
  git(root, ["init"]);
  git(root, ["config", "user.name", "Test User"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "test fixture"]);
  return root;
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function runSetup(root, args) {
  return spawnSync(
    process.execPath,
    [path.join(root, "scripts/setup/project/index.mts"), ...args],
    { cwd: root, encoding: "utf8", input: "" },
  );
}

describe("project setup CLI", () => {
  it("keeps files unchanged during a non-interactive dry run", (t) => {
    const root = createFixture(t);
    const before = readFileSync(path.join(root, "package.json"), "utf8");
    const result = runSetup(root, [...privateArguments, "--dry-run"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Dry run complete\. No files changed\./);
    assert.equal(readFileSync(path.join(root, "package.json"), "utf8"), before);
    assert.equal(git(root, ["status", "--porcelain"]), "");
  });

  it("requires --yes for non-interactive writes", (t) => {
    const root = createFixture(t);
    const before = readFileSync(path.join(root, "package.json"), "utf8");
    const result = runSetup(root, privateArguments);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Non-interactive setup requires --yes/);
    assert.equal(readFileSync(path.join(root, "package.json"), "utf8"), before);
    assert.equal(git(root, ["status", "--porcelain"]), "");
  });

  it("applies private project metadata and licensing", (t) => {
    const root = createFixture(t);
    const result = runSetup(root, [...privateArguments, "--yes"]);

    assert.equal(result.status, 0, result.stderr);
    const packageJson = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    assert.equal(packageJson.name, "example-app");
    assert.equal(packageJson.license, "UNLICENSED");
    assert.match(
      readFileSync(path.join(root, "LICENSE"), "utf8"),
      /All rights reserved/,
    );
    assert.equal(
      readFileSync(
        path.join(root, "LICENSES/turborepo-starter-MIT.txt"),
        "utf8",
      ),
      currentLicense,
    );
    const readme = readFileSync(path.join(root, "README.md"), "utf8");
    assert.doesNotMatch(readme, /Initialize the project|turborepo-starter\//);
  });

  it("applies Apache-2.0 licensing and notice files", (t) => {
    const root = createFixture(t);
    const apacheAnswers = answers({ kind: "oss", license: "Apache-2.0" });
    const result = runSetup(root, [
      "--kind",
      "oss",
      "--license",
      "Apache-2.0",
      ...metadataArguments,
      "--yes",
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(path.join(root, "LICENSE"), "utf8"),
      buildLicense(apacheAnswers),
    );
    assert.equal(
      readFileSync(path.join(root, "NOTICE"), "utf8"),
      "example-app\nCopyright 2026 Example Company\n",
    );
  });

  it("rejects dirty target files", (t) => {
    const root = createFixture(t);
    writeFileSync(path.join(root, "README.md"), `${currentReadme}\nChanged.\n`);
    const result = runSetup(root, [...privateArguments, "--yes"]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /target files have uncommitted changes/);
    assert.equal(
      JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).name,
      "turborepo-starter",
    );
  });

  it("leaves original files intact when staging cannot complete", (t) => {
    const root = createFixture(t);
    writeFileSync(path.join(root, "LICENSES"), "reserved path\n");
    git(root, ["add", "LICENSES"]);
    git(root, ["commit", "-m", "reserve licenses path"]);
    const originalPackage = readFileSync(path.join(root, "package.json"), "utf8");
    const originalReadme = readFileSync(path.join(root, "README.md"), "utf8");
    const originalLicense = readFileSync(path.join(root, "LICENSE"), "utf8");
    const result = runSetup(root, [...privateArguments, "--yes"]);

    assert.equal(result.status, 1);
    assert.equal(
      readFileSync(path.join(root, "package.json"), "utf8"),
      originalPackage,
    );
    assert.equal(readFileSync(path.join(root, "README.md"), "utf8"), originalReadme);
    assert.equal(readFileSync(path.join(root, "LICENSE"), "utf8"), originalLicense);
    assert.equal(
      readdirSync(root).some((entry) => entry.includes(".setup-project-")),
      false,
    );
    assert.equal(git(root, ["status", "--porcelain"]), "");
  });
});
