import '@testing-library/dom';
import { act, render, screen } from '../../../testUtils';
import {
  StreamResult,
  StreamResultSkeleton,
} from '../../../../app/(app)/showcase/streaming/_components';

describe('RSC streaming result', () => {
  it('renders a resolved server payload', async () => {
    const result = await StreamResult({
      resultPromise: Promise.resolve({
        delayMs: 800,
        title: 'Primary payload arrived',
        description: 'The first boundary completed.',
      }),
    });

    await act(async () => {
      render(result);
    });

    expect(screen.getByRole('heading', { name: 'Primary payload arrived' })).toBeInTheDocument();
    expect(screen.getByText('resolved after 800 ms')).toBeInTheDocument();
  });

  it('announces a pending server payload', async () => {
    await act(async () => {
      render(<StreamResultSkeleton label='Secondary payload' />);
    });

    expect(screen.getByRole('status', { name: 'Secondary payload is streaming' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
