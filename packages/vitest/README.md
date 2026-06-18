# Vitest

This package provides common configuration and utilities for Vitest within the
monorepo.

## Overview

- A package for setting up the **Vitest** testing environment
- `base.ts` defines shared plugins, test targets, exclusions, setup files, and
  environment
- Each app/package imports and uses this configuration

## Main Contents

- `base.ts`
  - `plugins`: Vite plugins (`vite-tsconfig-paths`, `@vitejs/plugin-react`)
  - `testInclude`: Test target paths
  - `testExclude`: Excluded files
  - `setupFiles`: Setup files
  - `environment`: Test environment (`jsdom`)

## Usage

1. In the Vitest config file of each app/package, import the exports from
   `@workspace/vitest`.

   ```ts
   import { resolve } from "path";
   import { defineConfig } from "vitest/config";
   import {
     environment,
     plugins,
     setupFiles,
     testExclude,
     testInclude,
   } from "@workspace/vitest";
   ```

2. Override or extend as needed in each project.
