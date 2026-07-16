import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { resolveAnswers, updateReadme } from "../setup/project/policy.mts";

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

describe("README updates", () => {
  it("updates the heading, description, and license section", () => {
    const result = updateReadme(currentReadme, "turborepo-starter", answers());

    assert.match(result, /^# example-app\n\nExample application\./);
    assert.match(result, /## Features\n\n- Feature/);
    assert.match(
      result,
      /git clone <repository-url>\ncd example-app/,
    );
    assert.doesNotMatch(result, /Initialize the project|nps setup\.project/);
    assert.match(result, /3\. \*\*Run Development Server\*\*/);
    assert.match(result, /example-app\//);
    assert.match(result, /## License\n\nThis project is proprietary software/);
    assert.doesNotMatch(result, /Old license text/);
  });

  it("preserves sections following the license section", () => {
    const result = updateReadme(
      `${currentReadme}\n## Support\n\nContact support.\n`,
      "turborepo-starter",
      answers({ kind: "oss", license: "MIT" }),
    );

    assert.match(result, /## License\n\nThis project is licensed under the MIT/);
    assert.match(result, /## Support\n\nContact support\./);
  });

  it("removes setup-only guidance from the real starter README", () => {
    const realReadme = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../README.md"),
      "utf8",
    );
    const result = updateReadme(
      realReadme,
      "turborepo-starter",
      answers(),
    );

    assert.doesNotMatch(result, /nps setup\.project|turborepo-starter\//);
    assert.doesNotMatch(result, /the starter's repository settings/);
    assert.match(result, /the project's repository settings/);
  });

  it("uses the repository directory for scoped package names", () => {
    const result = updateReadme(
      currentReadme,
      "@craftsamo/turborepo-starter",
      answers({ name: "@acme/example-app" }),
    );

    assert.match(result, /cd example-app/);
    assert.match(result, /example-app\//);
    assert.doesNotMatch(result, /cd @acme\/example-app/);
  });
});
