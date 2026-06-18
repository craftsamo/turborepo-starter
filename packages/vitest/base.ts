import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export const plugins = [tsconfigPaths(), react()];

export const testInclude = ["src/tests/**"];

export const testExclude = {
  app: ["node_modules", "src/tests/testUtils.tsx", "src/tests/vitest.setup.js"],
  packages: [],
};

export const setupFiles = {
  app: ["src/tests/vitest.setup.js"],
  package: [],
};

export const environment = "jsdom";
