## TypeScript Config

This directory contains TypeScript configuration files tailored for different
purposes and frameworks. Below is an overview of each configuration:

### `base.json`

- **Purpose**: Defines the basic configuration for TypeScript projects.
- **Key Features**:
  - Composite builds disabled (`composite`: false).
  - Strict type checking (`strict`: true).
  - CommonJS module format (`module`: commonjs).
  - Skips type checking for library files (`skipLibCheck`: true).

### `react-library.json`

- **Purpose**: Specialized configuration for React library projects.
- **Extends**: `base.json`
- **Key Features**:
  - JSX support with `react-jsx`.
  - ES2022 target and module format (`module`: ESNext).
  - Includes `src` directory for compilation.

### `next.json`

- **Purpose**: Configuration optimized for Next.js projects.
- **Extends**: `base.json`
- **Key Features**:
  - ES2022 target and module resolution tailored for bundlers.
  - Preserves JSX syntax (`jsx`: preserve).
  - Supports Next.js plugins.
  - Includes paths alias (`@/*`: `./src/*`).
  - Includes `src`, `next-env.d.ts`, `*.ts`, and `*.tsx` files for compilation.

### `package.json`

- **Purpose**: Defines metadata for the `@workspace/tsconfig` package.
- **Key Features**:
  - Name: `@workspace/tsconfig`
  - Version: `0.0.0`
  - Files included: `base.json`, `nextjs.json`, `react-library.json`

### Usage

To use these configurations in your project, extend the appropriate file in your
own `tsconfig.json`. For example:

```json
{
  "extends": "@workspace/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

These configurations are designed to streamline development workflows for
various frameworks and project types.
