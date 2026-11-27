import '@testing-library/dom';
import { within } from '@testing-library/react';
import { act, render, screen } from '../../testUtils';
import { BottomNav } from '../../../components/Navigation';
import { navItems } from '../../../components/Navigation/items';
import { ToolbarLink } from '../../../components/Navigation/ToolbarLink';

vi.mock('next/navigation', () => ({
  usePathname: () => '/showcase/streaming',
}));

describe('BottomNav', () => {
  it('keeps the parent navigation item active on a nested route', async () => {
    await act(async () => {
      render(<BottomNav />);
    });

    expect(screen.getByRole('link', { name: 'Showcase' })).toHaveAttribute('aria-current', 'page');
  });

  it.each(['docked', 'floating'] as const)(
    'keeps only destination links inside the navigation landmark (%s)',
    async (variant) => {
      await act(async () => {
        render(<BottomNav variant={variant} />);
      });

      const nav = screen.getByRole('navigation');
      const button = screen.getByRole('button', { name: 'Toggle color theme' });

      expect(within(nav).getAllByRole('link')).toHaveLength(navItems.length);
      expect(within(nav).queryByRole('button')).toBeNull();
      expect(nav).not.toContainElement(button);
    },
  );

  it('names every tab by its label in floating mode', async () => {
    await act(async () => {
      render(<BottomNav variant='floating' />);
    });

    const names = within(screen.getByRole('navigation'))
      .getAllByRole('link')
      .map((link) => link.textContent);

    // Whether the labels are visible is a layout question for the VRT shots.
    expect(names).toEqual(navItems.map((item) => item.label));
  });

  it('marks the parent toolbar item active on a nested route', async () => {
    await act(async () => {
      render(<ToolbarLink href='/showcase' label='Showcase' />);
    });

    expect(screen.getByRole('link', { name: 'Showcase' })).toHaveAttribute('aria-current', 'page');
  });
});
