import path from "node:path";
import { APACHE_LICENSE } from "./apache-license.mts";

export type ProjectKind = "private" | "oss" | "starter";
export type ProjectLicense = "UNLICENSED" | "MIT" | "Apache-2.0";

export interface ProjectArguments {
  dryRun: boolean;
  yes: boolean;
  kind?: ProjectKind | undefined;
  license?: ProjectLicense | undefined;
  name?: string | undefined;
  description?: string | undefined;
  author?: string | undefined;
  copyrightHolder?: string | undefined;
  year?: number | undefined;
}

export interface ProjectAnswers {
  kind: ProjectKind;
  license: ProjectLicense;
  name: string;
  description: string;
  author: string;
  copyrightHolder: string;
  year: number;
}

export interface RootPackage {
  name: string;
  description?: string;
  author?: string;
  license?: string;
  private?: boolean;
  [key: string]: unknown;
}

export interface PlannedFile {
  path: string;
  content: string;
}

export interface ProjectPlan {
  packageJson: RootPackage;
  files: PlannedFile[];
}

const MIT_LICENSE = (year: number, holder: string): string => `MIT License

Copyright (c) ${year} ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

export function parseArguments(argv: string[]): ProjectArguments {
  const args: ProjectArguments = { dryRun: false, yes: false };
  const values = [...argv];

  while (values.length > 0) {
    const value = values.shift();
    if (value === "--dry-run") args.dryRun = true;
    else if (value === "--yes") args.yes = true;
    else if (value === "--kind")
      args.kind = requireValue(value, values) as ProjectKind;
    else if (value === "--license")
      args.license = requireValue(value, values) as ProjectLicense;
    else if (value === "--name") args.name = requireValue(value, values);
    else if (value === "--description")
      args.description = requireValue(value, values);
    else if (value === "--author") args.author = requireValue(value, values);
    else if (value === "--copyright-holder")
      args.copyrightHolder = requireValue(value, values);
    else if (value === "--year")
      args.year = Number(requireValue(value, values));
    else throw new Error(`Unknown argument: ${value}`);
  }

  if (args.kind && !isProjectKind(args.kind)) {
    throw new Error("--kind accepts private, oss, or starter.");
  }
  if (args.license && !isProjectLicense(args.license)) {
    throw new Error("--license accepts UNLICENSED, MIT, or Apache-2.0.");
  }
  if (args.year !== undefined && !isValidYear(args.year)) {
    throw new Error("--year must be a four-digit year.");
  }
  if (args.kind && args.license) validateLicense(args.kind, args.license);

  return args;
}

export function resolveAnswers(
  values: Omit<ProjectAnswers, "license"> & { license?: ProjectLicense },
): ProjectAnswers {
  const license = values.license ?? defaultLicense(values.kind);
  validateLicense(values.kind, license);
  validateRequired("Project name", values.name);
  validatePackageName(values.name);
  validateRequired("Description", values.description);
  validateRequired("Author", values.author);
  validateRequired("Copyright holder", values.copyrightHolder);
  if (!isValidYear(values.year)) throw new Error("Year must be a four-digit year.");
  return { ...values, license };
}

export function buildProjectPlan({
  currentPackage,
  currentReadme,
  currentLicense,
  answers,
}: {
  currentPackage: RootPackage;
  currentReadme: string;
  currentLicense: string;
  answers: ProjectAnswers;
}): ProjectPlan {
  const packageJson: RootPackage = {
    ...currentPackage,
    name: answers.name,
    description: answers.description,
    author: answers.author,
    license: answers.license,
    private: true,
  };
  const files: PlannedFile[] = [
    {
      path: "README.md",
      content: updateReadme(currentReadme, currentPackage.name, answers),
    },
    {
      path: "LICENSE",
      content: buildLicense(answers),
    },
  ];

  if (currentLicense !== buildLicense(answers) && currentPackage.license === "MIT") {
    files.push({
      path: path.posix.join(
        "LICENSES",
        `${safeFileName(currentPackage.name)}-MIT.txt`,
      ),
      content: ensureTrailingNewline(currentLicense),
    });
  }
  if (answers.license === "Apache-2.0") {
    files.push({
      path: "NOTICE",
      content: `${answers.name}\nCopyright ${answers.year} ${answers.copyrightHolder}\n`,
    });
  }

  return { packageJson, files };
}

export function defaultLicense(kind: ProjectKind): ProjectLicense {
  return kind === "private" ? "UNLICENSED" : "MIT";
}

export function buildLicense(answers: ProjectAnswers): string {
  if (answers.license === "MIT") {
    return MIT_LICENSE(answers.year, answers.copyrightHolder);
  }
  if (answers.license === "Apache-2.0") return APACHE_LICENSE;
  return `Copyright (c) ${answers.year} ${answers.copyrightHolder}. All rights reserved.

Except for components identified in the LICENSES directory, this software is
proprietary and confidential. Unauthorized copying, distribution,
modification, or use is prohibited except as permitted by a written agreement
with the copyright holder.
`;
}

export function updateReadme(
  source: string,
  sourceName: string,
  answers: ProjectAnswers,
): string {
  const prepared = prepareReadme(source, sourceName, answers.name);
  const lines = prepared.split("\n");
  const headingIndex = lines.findIndex((line) => line.startsWith("# "));
  if (headingIndex === -1) throw new Error("README.md must contain an H1 heading.");
  lines[headingIndex] = `# ${answers.name}`;

  let descriptionStart = headingIndex + 1;
  while (lines[descriptionStart] === "") descriptionStart += 1;
  let descriptionEnd = descriptionStart;
  while (
    descriptionEnd < lines.length &&
    lines[descriptionEnd] !== "" &&
    !lines[descriptionEnd]?.startsWith("#")
  ) {
    descriptionEnd += 1;
  }
  lines.splice(descriptionStart, descriptionEnd - descriptionStart, answers.description);

  const updated = lines.join("\n").trimEnd();
  const licenseSection = `## License\n\n${licenseSummary(answers.license)}`;
  const licenseHeading = /^## .*License\s*$/m;
  const match = licenseHeading.exec(updated);
  if (!match) return `${updated}\n\n${licenseSection}\n`;
  const remainder = updated.slice(match.index + match[0].length);
  const nextHeading = /\n## /.exec(remainder);
  const suffix = nextHeading ? remainder.slice(nextHeading.index).trimEnd() : "";
  return `${updated.slice(0, match.index).trimEnd()}\n\n${licenseSection}${suffix ? `\n${suffix}` : ""}\n`;
}

function prepareReadme(
  source: string,
  sourceName: string,
  projectName: string,
): string {
  const sourceDirectory = sourceName.split("/").at(-1) as string;
  const projectDirectory = projectName.split("/").at(-1) as string;
  let result = source.replaceAll("\r\n", "\n");
  result = result.replace(
    /```sh\ngit clone [^\n]+\ncd [^\n]+\n```/,
    `\`\`\`sh\ngit clone <repository-url>\ncd ${projectDirectory}\n\`\`\``,
  );
  result = result.replaceAll(`${sourceDirectory}/`, `${projectDirectory}/`);
  result = result.replace(/^\| `nps setup\.project`.*\n/gm, "");

  const installationHeading = "### Installation";
  const installationStart = result.indexOf(installationHeading);
  if (installationStart === -1) return result;
  const followingSection = result.indexOf("\n## ", installationStart);
  const installationEnd = followingSection === -1 ? result.length : followingSection;
  const installation = result.slice(installationStart, installationEnd);
  const withoutSetup = installation.replace(
    /\n\d+\. \*\*Initialize the project\*\*[\s\S]*?(?=\n\d+\. \*\*)/,
    "",
  );
  let step = 0;
  const renumbered = withoutSetup.replace(/^\d+\. (?=\*\*)/gm, () => {
    step += 1;
    return `${step}. `;
  });
  return `${result.slice(0, installationStart)}${renumbered}${result.slice(installationEnd)}`.replaceAll(
    "the starter's repository settings",
    "the project's repository settings",
  );
}

function licenseSummary(license: ProjectLicense): string {
  if (license === "MIT") {
    return "This project is licensed under the MIT License. See [LICENSE](LICENSE).";
  }
  if (license === "Apache-2.0") {
    return "This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).";
  }
  return "This project is proprietary software. See [LICENSE](LICENSE). Upstream license notices are preserved in [LICENSES](LICENSES).";
}

function validateLicense(kind: ProjectKind, license: ProjectLicense): void {
  if (kind === "private" && license !== "UNLICENSED") {
    throw new Error("Private projects must use UNLICENSED.");
  }
  if (kind !== "private" && license === "UNLICENSED") {
    throw new Error("Open source projects and starters must use MIT or Apache-2.0.");
  }
}

function validatePackageName(name: string): void {
  if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error("Project name must be a lowercase npm package name.");
  }
}

function validateRequired(label: string, value: string): void {
  if (!value.trim()) throw new Error(`${label} is required.`);
}

function isProjectKind(value: string): value is ProjectKind {
  return value === "private" || value === "oss" || value === "starter";
}

function isProjectLicense(value: string): value is ProjectLicense {
  return value === "UNLICENSED" || value === "MIT" || value === "Apache-2.0";
}

function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1000 && year <= 9999;
}

function safeFileName(name: string): string {
  return name.replace(/^@/, "").replaceAll("/", "-");
}

function ensureTrailingNewline(value: string): string {
  return `${value.trimEnd()}\n`;
}

function requireValue(flag: string, values: string[]): string {
  const value = values.shift();
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}
