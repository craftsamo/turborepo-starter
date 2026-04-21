import '@testing-library/dom';
import { render, act, waitFor, screen } from '../testUtils';
import RootPage from '../../app/page';

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
