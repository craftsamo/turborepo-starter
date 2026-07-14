import '@testing-library/dom';
import { toast } from '@workspace/ui/components/sonner';
import { act, render, screen, userEvent, waitFor } from '../../testUtils';
import ShowcasePage from '../../../app/(app)/showcase/page';

describe('ShowcasePage', () => {
  it('renders each interactive foundation in snap mode', async () => {
    await act(async () => {
      render(await ShowcasePage());
    });

    expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'snap');
    expect(screen.getByRole('heading', { name: 'Built to be touched.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'State you can see.' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'One system, multiple modes.' }),
    ).toBeInTheDocument();
  });

  it('updates the shared counter from the playground', async () => {
    const user = userEvent.setup();
    const toastSpy = vi.spyOn(toast, 'success').mockReturnValue('counter-toast');

    await act(async () => {
      render(await ShowcasePage());
    });

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Counter value' })).toHaveTextContent('1');
      expect(toastSpy).toHaveBeenCalledWith('Counter incremented', {
        description: 'Redux updated the shared state.',
      });
    });
  });
});
