import { createLocalizedMetadata } from '@/i18n/metadata';

describe('localized metadata', () => {
  it('includes locale alternates and absolute social images', () => {
    const metadata = createLocalizedMetadata({
      language: 'ja',
      pathname: '/showcase',
      title: 'ショーケース',
      description: '説明',
    });

    expect(metadata.alternates).toMatchObject({
      canonical: '/ja/showcase',
      languages: {
        en: '/en/showcase',
        ja: '/ja/showcase',
        'x-default': '/en/showcase',
      },
    });
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: 'http://localhost/image/opengraph-image.jpg' }],
    });
    expect(metadata.twitter).toMatchObject({
      images: ['http://localhost/image/twitter-image.jpg'],
    });
  });
});
