import '@testing-library/dom';
import { within } from '@testing-library/react';
import { act, render, screen } from '../../testUtils';
import { BottomNav } from '../../../components/Navigation';
import { navItems } from '../../../components/Navigation/items';
import { ToolbarLink } from '../../../components/Navigation/ToolbarLink';

vi.mock('next/navigation', () => ({
  usePathname: () => '/showcase/streaming',
}));

const getBar = () => document.querySelector('[data-slot="bottom-bar"]');

/** Runs `run` with a scrollable `main[data-mode]` on the page, removing it afterwards. */
const withScreen = async (
  run: (scrollTo: (top: number) => void) => Promise<void>,
): Promise<void> => {
  const main = document.createElement('main');
  main.dataset.mode = 'flow';
  Object.defineProperty(main, 'clientHeight', { value: 800 });
  Object.defineProperty(main, 'scrollHeight', { value: 3000 });
  document.body.append(main);

  const scrollTo = (top: number) => {
    act(() => {
      main.scrollTop = top;
      main.dispatchEvent(new Event('scroll'));
    });
  };

  try {
    await run(scrollTo);
  } finally {
    main.remove();
  }
};

describe('BottomNav hide on scroll', () => {
  it('slides the floating bar away on scroll down and back on scroll up', async () => {
    await withScreen(async (scrollTo) => {
      await act(async () => {
        render(<BottomNav variant='floating' />);
      });

      expect(getBar()).not.toHaveAttribute('data-hidden');
      scrollTo(400);
      expect(getBar()).toHaveAttribute('data-hidden', 'true');
      scrollTo(380);
      expect(getBar()).not.toHaveAttribute('data-hidden');
      scrollTo(1000);
      expect(getBar()).toHaveAttribute('data-hidden', 'true');
      scrollTo(2200);
      expect(getBar()).not.toHaveAttribute('data-hidden');
    });
  });

  it('shows the hidden bar again when focus enters it', async () => {
    await withScreen(async (scrollTo) => {
      await act(async () => {
        render(<BottomNav variant='floating' />);
      });

      scrollTo(1000);
      expect(getBar()).toHaveAttribute('data-hidden', 'true');
      act(() => screen.getByRole('link', { name: 'Showcase' }).focus());
      expect(getBar()).not.toHaveAttribute('data-hidden');
    });
  });

  it('never hides the docked bar', async () => {
    await withScreen(async (scrollTo) => {
      await act(async () => {
        render(<BottomNav />);
      });

      scrollTo(1000);
      expect(getBar()).not.toHaveAttribute('data-hidden');
    });
  });
});

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
