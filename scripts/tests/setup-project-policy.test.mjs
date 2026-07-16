import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildProjectPlan,
  defaultLicense,
  parseArguments,
  resolveAnswers,
} from "../setup/project/policy.mts";

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

describe("project setup arguments", () => {
  it("parses non-interactive project metadata", () => {
    assert.deepEqual(
      parseArguments([
        "--kind",
        "oss",
        "--license",
        "Apache-2.0",
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
        "--dry-run",
        "--yes",
      ]),
      {
        kind: "oss",
        license: "Apache-2.0",
        name: "example-app",
        description: "Example application.",
        author: "Example Author",
        copyrightHolder: "Example Company",
        year: 2026,
        dryRun: true,
        yes: true,
      },
    );
  });

  it("rejects incompatible project kinds and licenses", () => {
    assert.throws(
      () => parseArguments(["--kind", "private", "--license", "MIT"]),
      /must use UNLICENSED/,
    );
    assert.throws(
      () =>
        resolveAnswers({
          kind: "oss",
          license: "UNLICENSED",
          name: "example-app",
          description: "Example application.",
          author: "Example Author",
          copyrightHolder: "Example Company",
          year: 2026,
        }),
      /must use MIT or Apache-2.0/,
    );
  });

  it("defaults private projects to UNLICENSED and public projects to MIT", () => {
    assert.equal(defaultLicense("private"), "UNLICENSED");
    assert.equal(defaultLicense("oss"), "MIT");
    assert.equal(defaultLicense("starter"), "MIT");
  });
});

describe("project setup plan", () => {
  it("builds a private project and preserves the upstream MIT license", () => {
    const plan = buildProjectPlan({
      currentPackage,
      currentReadme,
      currentLicense,
      answers: answers(),
    });

    assert.equal(plan.packageJson.name, "example-app");
    assert.equal(plan.packageJson.license, "UNLICENSED");
    assert.equal(plan.packageJson.private, true);
    assert.match(
      plan.files.find((file) => file.path === "LICENSE").content,
      /All rights reserved/,
    );
    assert.equal(
      plan.files.find(
        (file) => file.path === "LICENSES/turborepo-starter-MIT.txt",
      ).content,
      currentLicense,
    );
    assert.match(
      plan.files.find((file) => file.path === "README.md").content,
      /proprietary software/,
    );
    assert.doesNotMatch(
      plan.files.find((file) => file.path === "README.md").content,
      /nps setup\.project|turborepo-starter\//,
    );
  });

  it("generates a fresh MIT license for an open source project", () => {
    const plan = buildProjectPlan({
      currentPackage,
      currentReadme,
      currentLicense,
      answers: answers({ kind: "oss", license: "MIT" }),
    });
    const license = plan.files.find((file) => file.path === "LICENSE").content;

    assert.match(license, /^MIT License/);
    assert.match(license, /Copyright \(c\) 2026 Example Company/);
  });

  it("generates Apache-2.0 with a project notice", () => {
    const plan = buildProjectPlan({
      currentPackage,
      currentReadme,
      currentLicense,
      answers: answers({ kind: "oss", license: "Apache-2.0" }),
    });

    assert.match(
      plan.files.find((file) => file.path === "LICENSE").content,
      /Apache License\n +Version 2\.0, January 2004/,
    );
    for (let section = 1; section <= 9; section += 1) {
      assert.match(
        plan.files.find((file) => file.path === "LICENSE").content,
        new RegExp(`\\n   ${section}\\.`),
      );
    }
    assert.match(
      plan.files.find((file) => file.path === "LICENSE").content,
      /END OF TERMS AND CONDITIONS[\s\S]*APPENDIX: How to apply/,
    );
    assert.equal(
      plan.files.find((file) => file.path === "NOTICE").content,
      "example-app\nCopyright 2026 Example Company\n",
    );
  });
});
