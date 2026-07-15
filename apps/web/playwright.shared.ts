import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

interface PlaywrightConfigOptions {
  live?: boolean;
}

export const createPlaywrightConfig = ({
  live = false,
}: PlaywrightConfigOptions = {}): PlaywrightTestConfig => {
  const port = live ? undefined : Number(process.env.WEB_E2E_PORT ?? 3100);
  const externalBaseURL = live ? process.env.PLAYWRIGHT_BASE_URL : undefined;

  if (live && !externalBaseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL is required for live tests.');
  }

  if (!live && (!Number.isInteger(port) || port! < 1 || port! > 65_535)) {
    throw new Error('WEB_E2E_PORT must be a valid TCP port.');
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
          command: `pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
  });
};
