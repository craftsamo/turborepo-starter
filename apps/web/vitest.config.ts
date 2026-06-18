import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { environment, plugins, setupFiles, testExclude, testInclude } from '@workspace/vitest';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: plugins,
  resolve: {
    alias: {
      '@workspace/ui': r('../../packages/ui/src'),
      '@workspace/constants': r('../../packages/constants/src'),
    },
  },
  test: {
    setupFiles: setupFiles.app,
    environment,
    globals: true,
    include: testInclude,
    exclude: testExclude.app,
  },
});
