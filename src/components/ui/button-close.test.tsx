import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { ButtonClose } from './button-close';

describe('ButtonClose', () => {
  it('is a named button, type=button, small neutral by default', () => {
    render(<ButtonClose />);
    const btn = screen.getByRole('button', { name: 'Close' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveClass('h-control-sm', 'w-control-sm', 'rounded-control', 'text-icon-subtle', 'hover:bg-muted', 'hover:text-icon-default');
  });

  it('supports sizes, brand colour and a custom label', () => {
    render(<ButtonClose size="lg" color="brand" aria-label="Dismiss" />);
    const btn = screen.getByRole('button', { name: 'Dismiss' });
    expect(btn).toHaveClass('h-control-lg', 'w-control-lg', 'text-icon-brand', 'hover:bg-background-brand-subtle');
    expect(btn.querySelector('svg')).toHaveClass('h-icon-lg', 'w-icon-lg');
  });

  it('uses the shared focus ring and activates with Enter and Space', async () => {
    const onClick = vi.fn();
    render(<ButtonClose onClick={onClick} />);
    await userEvent.tab();
    const btn = screen.getByRole('button');
    expect(btn).toHaveFocus();
    expect(btn).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('disabled blocks clicks and forwards the ref', async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<ButtonClose ref={ref} disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
