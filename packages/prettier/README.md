## Prettier Config

This directory contains the Prettier configuration and related files for the
project. Below is an overview of the configuration and usage:

### `index.js`

- **Purpose**: Defines Prettier configuration for consistent code formatting
  across the workspace.
- **Key Features**:
  - Line endings are set to `lf`.
  - Single quotes are used for strings (`singleQuote`: true).
  - Spacing within brackets is enabled (`bracketSpacing`: true).
  - JSX uses single quotes (`jsxSingleQuote`: true).
  - Semicolons are enforced (`semi`: true).
  - Final newline is inserted in files (`insertFinalNewline`: true).
  - Maximum line width is set to 130 characters (`printWidth`: 130).

### `package.json`

- **Purpose**: Defines metadata and dependencies for the `@workspace/prettier`
  package.
- **Key Features**:
  - Name: `@workspace/prettier`
  - Version: `1.0.0`
  - Private package (`private`: true)
  - Files included: `index.js`
  - Development Dependency: Prettier `^3.2.5`

### Usage

To use this configuration in your project, extend or import the configuration in
your Prettier setup. For example:

```javascript
const prettierConfig = require("@workspace/prettier");
module.exports = prettierConfig;
```

This ensures consistent formatting across all files in the workspace.
