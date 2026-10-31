import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Input, InputHint } from './input';

describe('Input component', () => {
  it('renders as a native input and forwards a ref to it', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Placeholder" />);
    expect(screen.getByPlaceholderText('Placeholder')).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts typed input', async () => {
    render(<Input placeholder="Placeholder" />);
    const input = screen.getByPlaceholderText('Placeholder');
    await userEvent.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('merges a consumer className with the token classes', () => {
    render(<Input className="max-w-[320px]" placeholder="Placeholder" />);
    expect(screen.getByPlaceholderText('Placeholder')).toHaveClass('max-w-[320px]', 'rounded-control');
  });

  it('compact renders the dense 32px field and does not leak to the DOM', () => {
    render(<Input compact placeholder="Placeholder" />);
    const input = screen.getByPlaceholderText('Placeholder');
    expect(input).toHaveClass('h-8', 'py-1');
    expect(input).not.toHaveAttribute('compact');
  });

  it('keeps the 40px field by default', () => {
    render(<Input placeholder="Placeholder" />);
    expect(screen.getByPlaceholderText('Placeholder')).not.toHaveClass('h-8');
  });

  it('forwards the type attribute', () => {
    render(<Input type="email" placeholder="Placeholder" />);
    expect(screen.getByPlaceholderText('Placeholder')).toHaveAttribute('type', 'email');
  });

  describe('tokens', () => {
    it('uses the dedicated input/* token family for border, background, and text', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      expect(input).toHaveClass(
        'rounded-control',
        'border-input',
        'bg-background',
        'text-foreground',
        'placeholder:text-input-foreground-placeholder',
      );
    });

    it('never renders a raw Tailwind palette color class', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      const rawPaletteClass = /(^|\s)(bg|text|border|ring|outline)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-\d+)?(\s|$)/;
      expect(input.className).not.toMatch(rawPaletteClass);
    });
  });

  describe('hover', () => {
    it('darkens the border and adds the soft field shadow (no rest shadow, no bg tint)', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      // field hover shadow under the theme bevel; at rest only the theme bevel (0 0 #0000 without one)
      expect(input).toHaveClass('hover:border-border-bold', 'hover:shadow-[shadow:var(--bevel-input),theme(boxShadow.field-hover)]', 'shadow-[shadow:var(--bevel-input)]');
      expect(input.className).not.toMatch(/(^|\s)shadow-(?!\[shadow:var\(--bevel-input\)\])/);
      expect(input.className).not.toMatch(/hover:bg-/);
    });
  });

  describe('focus-visible', () => {
    it('carries the shared system focus ring tokens', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-focus',
        'focus-visible:ring-ring-default',
        'focus-visible:border-ring',
      );
      expect(input).toHaveClass('focus-visible:ring-offset-focus', 'focus-visible:ring-offset-background');
      expect(input.className).not.toMatch(/\bring-white\b/);
    });
  });

  describe('invalid', () => {
    it('applies the error border/ring treatment when aria-invalid is true', () => {
      render(<Input aria-invalid placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveClass('aria-[invalid=true]:border-destructive', 'aria-[invalid=true]:ring-destructive/20');
    });

    it('does not set aria-invalid by default', () => {
      render(<Input placeholder="Placeholder" />);
      expect(screen.getByPlaceholderText('Placeholder')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('disabled', () => {
    it('sets the native disabled attribute and dims via opacity', () => {
      render(<Input disabled placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText('Placeholder');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-disabled');
    });
  });

  describe('clamp', () => {
    it('applies fluid type classes when clamp is set', () => {
      render(<Input clamp placeholder="Placeholder" />);
      expect(screen.getByPlaceholderText('Placeholder')).toHaveClass('text-clamp', 'leading-clamp');
    });

    it('does not apply fluid type classes by default', () => {
      render(<Input placeholder="Placeholder" />);
      expect(screen.getByPlaceholderText('Placeholder')).not.toHaveClass('text-clamp', 'leading-clamp');
    });
  });

  describe('search variant', () => {
    it('is the plain field by default (no wrapper, no icon)', () => {
      const { container } = render(<Input placeholder="Placeholder" />);
      expect(container.firstChild).toBe(screen.getByPlaceholderText('Placeholder'));
      expect(container.querySelector('svg')).toBeNull();
    });

    it('adds a decorative leading icon and reserves room, keeping the ref on the input', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(<Input ref={ref} variant="search" placeholder="Search" />);
      const input = screen.getByPlaceholderText('Search');
      expect(ref.current).toBe(input);
      expect(input.className).toMatch(/pl-\[calc/);
      const icon = container.querySelector('svg');
      expect(icon?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(icon).toHaveClass('h-icon-xs', 'w-icon-xs');
    });

    it('applies className to the wrapper and inputClassName to the field', () => {
      const { container } = render(<Input variant="search" className="max-w-[320px]" inputClassName="uppercase" placeholder="Search" />);
      const input = screen.getByPlaceholderText('Search');
      expect(container.firstChild).toHaveClass('max-w-[320px]');
      expect(input).not.toHaveClass('max-w-[320px]');
      expect(input).toHaveClass('uppercase');
    });

    it('honours leadingIcon and defaults to the search icon', () => {
      const { container, rerender } = render(<Input variant="search" placeholder="Search" />);
      expect(container.querySelector('svg')).toHaveClass('lucide-search');
      rerender(<Input variant="search" placeholder="Search" leadingIcon={<i data-testid="custom" />} />);
      expect(screen.getByTestId('custom')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeNull();
    });
  });

  describe('InputHint', () => {
    it('uses the input-hint type role and hint colour', () => {
      render(<InputHint>Helper</InputHint>);
      expect(screen.getByText('Helper')).toHaveClass('typography-input-hint', 'text-input-foreground-hint');
    });

    it('switches to the error colour when invalid', () => {
      render(<InputHint invalid>Bad</InputHint>);
      expect(screen.getByText('Bad')).toHaveClass('text-input-foreground-hint-error');
    });

    it('supports a warning tone and lets invalid win', () => {
      const { rerender } = render(<InputHint tone="warning">Careful</InputHint>);
      expect(screen.getByText('Careful')).toHaveClass('text-text-warning');
      rerender(<InputHint tone="warning" invalid>Careful</InputHint>);
      expect(screen.getByText('Careful')).toHaveClass('text-input-foreground-hint-error');
    });
  });

  describe('password reveal and trailing action', () => {
    it('toggles between masked and plain text with aria-pressed and a label', async () => {
      const user = userEvent.setup();
      render(<Input type="password" revealable placeholder="Password" />);
      const field = screen.getByPlaceholderText('Password');
      const toggle = screen.getByRole('button', { name: 'Show password' });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(field).toHaveAttribute('type', 'password');
      await user.click(toggle);
      expect(field).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('is keyboard operable and keeps focus on the toggle', async () => {
      const user = userEvent.setup();
      render(<Input type="password" revealable placeholder="Password" />);
      await user.tab();
      await user.tab();
      expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'text');
    });

    it('uses label props over the defaults', () => {
      render(<Input type="password" revealable showPasswordLabel="Anzeigen" />);
      expect(screen.getByRole('button', { name: 'Anzeigen' })).toBeInTheDocument();
    });

    it('ignores revealable on non-password fields', () => {
      render(<Input type="text" revealable placeholder="Name" />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders a trailing action slot that receives clicks', async () => {
      const onClick = vi.fn();
      render(<Input placeholder="Token" trailingAction={<button type="button" onClick={onClick}>Copy</button>} />);
      await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
      expect(onClick).toHaveBeenCalled();
      expect(screen.getByPlaceholderText('Token').className).toContain('pr-[calc(theme(spacing.control-sm)');
    });
  });
});
