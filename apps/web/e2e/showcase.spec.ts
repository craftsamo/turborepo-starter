import { expect, test } from '@playwright/test';

test('navigates through the English showcase and updates shared state', async ({ page }) => {
  await page.goto('/en');

  await expect(
    page.getByRole('heading', { name: 'Build from a stronger starting point.' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Explore showcase' }).click();

  await expect(page).toHaveURL(/\/en\/showcase$/);
  await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();

  await page.getByRole('button', { name: 'Increment' }).click();

  await expect(page.getByLabel('Counter value')).toHaveText('1');
  await expect(page.getByText('Counter incremented', { exact: true })).toBeVisible();
});

test('uses Accept-Language for an unprefixed URL', async ({ request }) => {
  const response = await request.get('/showcase?source=test', {
    headers: { 'accept-language': 'ja-JP,ja;q=0.9,en;q=0.8' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/ja\/showcase\?source=test$/);
});

test('falls back to English for an unsupported browser language', async ({ request }) => {
  const response = await request.get('/showcase', {
    headers: { 'accept-language': 'fr-FR,fr;q=0.9' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/en\/showcase$/);
});

test('prefers the locale cookie over the browser language', async ({ baseURL, context, page }) => {
  await context.addCookies([
    {
      name: 'NEXT_LOCALE',
      value: 'en',
      url: baseURL!,
    },
  ]);
  await page.setExtraHTTPHeaders({ 'accept-language': 'ja' });

  await page.goto('/');

  await expect(page).toHaveURL(/\/en$/);
});

test('keeps an explicit URL locale over stored and browser preferences', async ({
  baseURL,
  context,
  page,
}) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'ja', url: baseURL! }]);
  await page.setExtraHTTPHeaders({ 'accept-language': 'ja' });

  await page.goto('/en/showcase');

  await expect(page).toHaveURL(/\/en\/showcase$/);
  await expect(page.getByRole('heading', { name: 'Built to be touched.' })).toBeVisible();
});

test('switches language without losing the current location', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/en/showcase?source=test#state');

  await page.getByRole('button', { name: 'Switch to 日本語' }).click();

  await expect(page).toHaveURL(/\/ja\/showcase\?source=test#state$/);
  await expect(page.getByRole('heading', { name: '目に見える状態管理。' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

  const localeCookies = (await page.context().cookies()).filter(
    ({ name }) => name === 'NEXT_LOCALE',
  );
  expect(localeCookies).toHaveLength(1);
  expect(localeCookies[0]).toMatchObject({ value: 'ja', path: '/' });

  await page.getByRole('button', { name: 'Englishに切り替える' }).click();

  await expect(page).toHaveURL(/\/en\/showcase\?source=test#state$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const returnedLocaleCookies = (await page.context().cookies()).filter(
    ({ name }) => name === 'NEXT_LOCALE',
  );
  expect(returnedLocaleCookies).toHaveLength(1);
  expect(returnedLocaleCookies[0]).toMatchObject({ value: 'en', path: '/' });
  expect(consoleErrors).toEqual([]);
});

test('renders a localized not-found page', async ({ page }) => {
  await page.goto('/ja/unknown-route');

  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ホームに戻る' })).toHaveAttribute('href', '/ja');
});

test('publishes localized discovery metadata', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml');
  const sitemap = await sitemapResponse.text();

  expect(sitemapResponse.ok()).toBe(true);
  expect(sitemap).toContain('/en/showcase');
  expect(sitemap).toContain('/ja/showcase');
  expect(sitemap).toContain('hreflang="en"');
  expect(sitemap).toContain('hreflang="ja"');

  const manifestResponse = await request.get('/ja/manifest.webmanifest');
  const manifest = await manifestResponse.json();

  expect(manifestResponse.ok()).toBe(true);
  expect(manifest.lang).toBe('ja');
  expect(manifest.start_url).toBe('/ja');
  expect(manifest.description).toContain('Web アプリケーション');
});
