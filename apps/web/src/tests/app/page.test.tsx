import '@testing-library/dom';
import { render, act, waitFor, screen } from '../testUtils';
import RootPage from '../../app/(app)/page';

describe('RootPage', async () => {
  it('renders the RootPage correctly', async function () {
    await act(async () => {
      render(await RootPage());
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Build from a stronger starting point.' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore showcase' })).toHaveAttribute(
        'href',
        '/showcase',
      );
      expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'flow');
    });
  });
});
