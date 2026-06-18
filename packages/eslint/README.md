## ESLint Config

This directory contains the ESLint configuration files tailored for different
use cases and frameworks. Below is an overview of the configurations and their
intended usage:

### `base.js`

- **Purpose**: Shared ESLint configuration for the repository.
- **Key Features**:
  - Recommended settings (`@eslint/js` and `typescript-eslint`).
  - Prettier integration (`eslint-config-prettier`).
  - Environment variable checks with `turbo/no-undeclared-env-vars`.
  - Ignores `dist/**` directory.

### `react-internal.js`

- **Purpose**: Custom ESLint configuration for React libraries.
- **Extends**: `base.js`
- **Key Features**:
  - React and React Hooks support (`eslint-plugin-react`,
    `eslint-plugin-react-hooks`).
  - Disables older React rules like `react/react-in-jsx-scope`.
  - Adds Service Worker and browser globals.

### `next.js`

- **Purpose**: Custom ESLint configuration for Next.js applications.
- **Extends**: `base.js`
- **Key Features**:
  - Next.js specific rules (`@next/eslint-plugin-next`).
  - Core Web Vitals rules.
  - React Hooks and Service Worker integration.

### `package.json`

- **Purpose**: Defines metadata and dependencies for the `@workspace/eslint`
  package.
- **Key Features**:
  - Name: `@workspace/eslint`
  - Version: `1.0.0`
  - Module type (`type`: module)
  - Private package (`private`: true)
  - Export paths: `base.js`, `nextjs.js`, `react-internal.js`
  - Development Dependencies: Various ESLint plugins and configurations.

### Usage

To use these configurations in your project, extend or import the appropriate
configuration file. For example:

```javascript
const eslintConfig = require("@workspace/eslint/base");
module.exports = eslintConfig;
```

This ensures consistent linting across the workspace and compatibility with
specific frameworks.
