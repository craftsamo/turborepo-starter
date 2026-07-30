import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export interface PlaywrightConfigOptions {
  /**
   * Run against an external deployment (`PLAYWRIGHT_BASE_URL`) instead of
   * starting a local production server.
   */
  live?: boolean;
  /**
   * Environment variable that holds the local E2E port. Every browser app must
   * own a distinct variable + default so Turbo can run E2E tasks concurrently.
   */
  portEnvVar?: string;
  /** Default local E2E port when the env var is unset. */
  defaultPort?: number;
  /** Local server command factory. Defaults to `next start` on the given port. */
  serverCommand?: (port: number) => string;
}

/**
 * Shared Playwright config factory for workspace browser apps.
 *
 * Owns the three standard viewport projects (desktop / tablet / mobile), the
 * local `next start` web server, reporter/artifact settings, and the
 * screenshot-comparison tolerances used by the VRT helpers. Apps create their
 * `playwright.config.ts` by calling this factory so every fork inherits the
 * same layout-regression safety net.
 */
export const createPlaywrightConfig = ({
  live = false,
  portEnvVar = 'WEB_E2E_PORT',
  defaultPort = 3100,
  serverCommand = (port) => `pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
}: PlaywrightConfigOptions = {}): PlaywrightTestConfig => {
  const port = live ? undefined : Number(process.env[portEnvVar] ?? defaultPort);
  const externalBaseURL = live ? process.env.PLAYWRIGHT_BASE_URL : undefined;

  if (live && !externalBaseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL is required for live tests.');
  }

  if (!live && (!Number.isInteger(port) || port! < 1 || port! > 65_535)) {
    throw new Error(`${portEnvVar} must be a valid TCP port.`);
  }

  const baseURL = live ? externalBaseURL! : `http://127.0.0.1:${port}`;
  const reportFolder = live ? 'playwright-live-report' : 'playwright-report';

  return defineConfig({
    testDir: './e2e',
    outputDir: live ? './live-test-results' : './test-results',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI
      ? [['line'], ['html', { open: 'never', outputFolder: reportFolder }]]
      : [['html', { open: 'never', outputFolder: reportFolder }]],
    expect: {
      // Visual-regression comparisons (see vrt.ts). Small ratio tolerance
      // absorbs anti-aliasing noise; anything visible to a human still fails.
      toHaveScreenshot: {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
        caret: 'hide',
      },
    },
    use: {
      baseURL,
      screenshot: 'only-on-failure',
      trace: 'on-first-retry',
      video: 'retain-on-failure',
    },
    projects: [
      {
        name: 'desktop',
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 1280, height: 720 },
        },
      },
      {
        name: 'tablet',
        use: {
          browserName: 'chromium',
          viewport: { width: 768, height: 1024 },
          hasTouch: true,
          isMobile: true,
        },
      },
      {
        name: 'mobile',
        use: {
          ...devices['Pixel 7'],
        },
      },
    ],
    webServer: live
      ? undefined
      : {
          command: serverCommand(port!),
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
  });
};
