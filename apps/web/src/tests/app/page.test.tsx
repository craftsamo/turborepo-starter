import '@testing-library/dom';
import { vi } from 'vitest';
import { render, act, waitFor, screen } from '../testUtils';
import RootPage from '../../app/(root)/page';

vi.mock('../../app/(root)/sections', () => ({
  HeroSection: () => <div>Turborepo Starter</div>,
}));

describe('RootPage', async () => {
  it('renders the RootPage correctly', async function () {
    await act(async () => {
      render(await RootPage());
    });

    await waitFor(() => {
      expect(screen.getByText(/Turborepo Starter/i)).toBeInTheDocument();
    });
  });
});
