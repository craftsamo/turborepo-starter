# Project Setup

**Command**: `nps setup.project`

Use project setup once after creating a repository from this starter. It
replaces starter-specific metadata and makes the derived project's licensing
intent explicit.

## Interactive Setup

Run the setup wizard from the repository root:

```sh
nps setup.project
```

The wizard asks for:

- Project name and description
- Author and copyright holder
- Project type: private/commercial, open source, or reusable starter
- License for open source projects and starters: MIT or Apache-2.0

Every run displays the planned metadata and file changes before confirmation.
Confirmation defaults to no.

## Project Types

| Type               | Package license | Root license                  |
| ------------------ | --------------- | ----------------------------- |
| Private/commercial | `UNLICENSED`    | All rights reserved           |
| Open source        | `MIT` or `Apache-2.0` | Selected standard license |
| Reusable starter   | `MIT` or `Apache-2.0` | Selected standard license |

The root package remains `private: true` for every type. That setting prevents
accidental npm publication; it does not determine the source-code license.

When setup replaces an MIT root license, it preserves the original text under
`LICENSES/<original-project>-MIT.txt`. The private license excludes components
identified in that directory from its proprietary terms. Apache-2.0 setup also
creates a project `NOTICE` file.

## Dry Run

Pass all project values to preview a non-interactive setup:

```sh
nps "setup.project --kind private --name example-app --description 'Example application' --author craftsamo --copyright-holder craftsamo --dry-run --yes"
```

`--dry-run` never writes files. In a terminal, missing values are collected
interactively. Non-interactive writes require `--yes` and complete metadata.

## Non-Interactive Setup

Use `--yes` only when all required project values are supplied:

```sh
nps "setup.project --kind private --name example-app --description 'Example application' --author craftsamo --copyright-holder craftsamo --yes"
```

For an Apache-2.0 open source project:

```sh
nps "setup.project --kind oss --license Apache-2.0 --name example-app --description 'Example application' --author craftsamo --copyright-holder craftsamo --yes"
```

Supported arguments:

| Argument                    | Values                              |
| --------------------------- | ----------------------------------- |
| `--kind`                    | `private`, `oss`, `starter`         |
| `--license`                 | `UNLICENSED`, `MIT`, `Apache-2.0`   |
| `--name`                    | Lowercase npm-compatible name       |
| `--description`             | Non-empty project description       |
| `--author`                  | Package author                       |
| `--copyright-holder`        | License copyright holder             |
| `--year`                    | Four-digit year; current year by default |
| `--dry-run`                 | Preview without writing files        |
| `--yes`                     | Skip confirmation; requires metadata |

Private projects only accept `UNLICENSED`. Open source projects and reusable
starters only accept MIT or Apache-2.0.

## Safety

Setup stops before prompting or writing when `package.json`, `README.md`,
`LICENSE`, `NOTICE`, or `LICENSES/` contains uncommitted changes. Existing
notice files are never overwritten with different content. Writes use a
temporary file and rename within the destination directory.

The command does not change Git history, remotes, GitHub settings, workspace
package names, or application-specific configuration. Review third-party code
and dependency license obligations separately before distributing a product.
