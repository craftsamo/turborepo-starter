import '@testing-library/dom';
import { vi } from 'vitest';
import { render, act, waitFor, screen } from '../testUtils';
import RootPage from '../../app/[locale]/(app)/page';

// Footer is an async Server Component; stub it so the client-side test
// renderer can mount the page without resolving a nested async component.
vi.mock('@/components/Footer', () => ({
  Footer: () => <footer />,
}));

describe('RootPage', async () => {
  it('renders the RootPage correctly', async function () {
    await act(async () => {
      render(
        await RootPage({
          params: Promise.resolve({ locale: 'en' }),
          searchParams: Promise.resolve({}),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Build from a stronger starting point.' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore showcase' })).toHaveAttribute(
        'href',
        '/en/showcase',
      );
      expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'flow');
    });
  });

  it('renders Japanese content', async () => {
    render(
      await RootPage({
        params: Promise.resolve({ locale: 'ja' }),
        searchParams: Promise.resolve({}),
      }),
      { locale: 'ja' },
    );

    expect(screen.getByRole('heading', { name: 'より強固な土台から始めよう。' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'ショーケースを見る' })).toHaveAttribute(
      'href',
      '/ja/showcase',
    );
  });
});
