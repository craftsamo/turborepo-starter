import '@testing-library/dom';
import { act, fireEvent, render, screen } from '../testUtils';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/showcase',
  getPathname: ({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`,
}));

const accessibleName = 'Switch to 日本語';
const originalLocation = window.location;
const replace = vi.fn();

beforeEach(() => {
  replace.mockClear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search: '', hash: '', replace },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('LanguageSwitcher', () => {
  it.each(['bottom', 'toolbar'] as const)('renders one named button in %s mode', async (mode) => {
    await act(async () => {
      render(<LanguageSwitcher mode={mode} />);
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(accessibleName);
    expect(buttons[0]).not.toBeDisabled();
    expect(screen.getByText('日本語')).toHaveAttribute('lang', 'ja');
    expect(screen.getByText('日本語')).not.toHaveClass('sr-only');
  });

  it.each(['bottom', 'toolbar'] as const)('switches locale and goes busy in %s mode', (mode) => {
    render(<LanguageSwitcher mode={mode} />);

    const button = screen.getByRole('button', { name: accessibleName });
    act(() => {
      fireEvent.click(button);
    });

    expect(replace).toHaveBeenCalledWith(expect.stringMatching(/^\/ja/));
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('hides the label visually while keeping the accessible name', () => {
    render(<LanguageSwitcher mode='bottom' hideLabel />);

    expect(screen.getByText('日本語')).toHaveClass('sr-only');
    expect(screen.getByRole('button')).toHaveAccessibleName(accessibleName);
  });
});
