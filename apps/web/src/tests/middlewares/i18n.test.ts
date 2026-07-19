import type { NextFetchEvent } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { i18n } from '@/middlewares/i18n';

const { handleI18nRouting } = vi.hoisted(() => ({
  handleI18nRouting: vi.fn(() => NextResponse.redirect('http://localhost/ja/showcase')),
}));

vi.mock('next-intl/middleware', () => ({
  default: () => handleI18nRouting,
}));

describe('i18n middleware', () => {
  it('delegates locale routing to next-intl', async () => {
    const handler = i18n();
    const request = new NextRequest('http://localhost/showcase?source=test', {
      headers: { 'accept-language': 'en-US;q=0.7,ja-JP;q=0.9' },
    });

    const response = await handler(request, {} as NextFetchEvent);

    expect(handleI18nRouting).toHaveBeenCalledWith(request);
    expect(response?.headers.get('location')).toBe('http://localhost/ja/showcase');
  });
});
