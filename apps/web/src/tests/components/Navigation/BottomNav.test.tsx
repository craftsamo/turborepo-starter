import '@testing-library/dom';
import { act, render, screen } from '../../testUtils';
import { BottomNav } from '../../../components/Navigation';
import { ToolbarLink } from '../../../components/Navigation/ToolbarLink';

vi.mock('next/navigation', () => ({
  usePathname: () => '/showcase/streaming',
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...props }: React.ComponentProps<'a'>) => (
    <a href={`/en${href === '/' ? '' : href}`} {...props} />
  ),
  usePathname: () => '/showcase/streaming',
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('BottomNav', () => {
  it('keeps the parent navigation item active on a nested route', async () => {
    await act(async () => {
      render(<BottomNav />);
    });

    expect(screen.getByRole('link', { name: 'Showcase' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the parent toolbar item active on a nested route', async () => {
    await act(async () => {
      render(<ToolbarLink href='/showcase' label='Showcase' />);
    });

    expect(screen.getByRole('link', { name: 'Showcase' })).toHaveAttribute('aria-current', 'page');
  });
});
