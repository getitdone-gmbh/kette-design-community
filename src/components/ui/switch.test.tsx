import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Switch } from './switch';

describe('Switch component', () => {
  it('keeps the 44x24 default size', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toHaveClass('h-switch-track-h-md', 'w-switch-track-w-md');
  });

  it('size sm uses the theme-aware switch size tokens', () => {
    render(<Switch size="sm" aria-label="Toggle" />);
    const root = screen.getByRole('switch');
    expect(root).toHaveClass('h-switch-track-h-sm', 'w-switch-track-w-sm');
    expect(root.className).not.toMatch(/w-switch-track-w-md/);
    expect(root.firstElementChild).toHaveClass('h-switch-thumb-sm', 'w-switch-thumb-sm');
  });

  it('toggles with the keyboard', async () => {
    render(<Switch size="sm" aria-label="Toggle" />);
    const root = screen.getByRole('switch');
    root.focus();
    await userEvent.keyboard(' ');
    expect(root).toHaveAttribute('aria-checked', 'true');
  });
});
