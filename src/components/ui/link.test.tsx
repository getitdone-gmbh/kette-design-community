import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Link } from './link';

describe('Link', () => {
  it('renders an anchor with the brand default look and the link-sm role', () => {
    render(<Link href="/x">Docs</Link>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '/x');
    expect(link).toHaveClass('typography-link-sm', 'text-link-default', 'hover:text-link-hover', 'active:underline', 'gap-2');
  });

  it.each([
    ['neutral', 'text-text-subtle'],
    ['destructive', 'text-text-destructive'],
  ] as const)('color %s', (color, cls) => {
    render(
      <Link href="#" color={color}>
        L
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass(cls);
  });

  it('2xl widens the gap and icons', () => {
    render(
      <Link href="#" size="2xl" icon={<svg data-testid="i" />}>
        L
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('gap-3');
    expect(screen.getByTestId('i').parentElement).toHaveClass('h-icon-lg', 'w-icon-lg');
  });

  it('renders icons decoratively and a leading dot', () => {
    const { rerender } = render(
      <Link href="#" icon={<svg data-testid="lead" />} iconTrailing={<svg data-testid="trail" />}>
        L
      </Link>,
    );
    expect(screen.getByTestId('lead').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('trail').parentElement).toHaveClass('h-icon-md', 'w-icon-md');
    rerender(
      <Link href="#" dotLeading icon={<svg data-testid="lead" />}>
        L
      </Link>,
    );
    expect(screen.queryByTestId('lead')).not.toBeInTheDocument();
    expect(screen.getByRole('link').querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('disabled: no href, out of tab order, click is swallowed, aria-disabled', async () => {
    const onClick = vi.fn();
    render(
      <Link href="/x" disabled onClick={onClick}>
        Off
      </Link>,
    );
    const link = screen.getByText('Off');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveClass('aria-disabled:text-text-disabled');
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is keyboard focusable with the shared focus ring', async () => {
    render(<Link href="#">Tab</Link>);
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    expect(screen.getByRole('link')).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default');
  });

  it('asChild styles the child element and keeps one link', () => {
    render(
      <Link asChild iconTrailing={<svg data-testid="t" />}>
        <a href="/child">Child</a>
      </Link>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveClass('typography-link-sm');
    expect(screen.getByTestId('t')).toBeInTheDocument();
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="#">
        L
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

describe('Link tones', () => {
  it('inverse uses the inverse text token', () => {
    render(<Link href="/x" color="inverse">Footer</Link>);
    expect(screen.getByRole('link')).toHaveClass('text-text-inverse');
  });

  it('inherit keeps the surrounding colour and stays underlined', () => {
    render(<Link href="/x" color="inherit">More</Link>);
    expect(screen.getByRole('link')).toHaveClass('text-inherit', 'underline');
  });

  it('typography inherit takes the font from the surrounding text instead of the link role', () => {
    render(
      <Link href="#" typography="inherit">
        Inline
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Inline' });
    expect(link).toHaveClass('[font:inherit]');
    expect(link).not.toHaveClass('typography-link-sm');
  });

  it('combines typography inherit with colour inherit', () => {
    render(
      <Link href="#" color="inherit" typography="inherit">
        Inline
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('text-inherit', 'underline', '[font:inherit]');
  });

  it('keeps the link role by default', () => {
    render(<Link href="#">Docs</Link>);
    expect(screen.getByRole('link')).toHaveClass('typography-link-sm');
    expect(screen.getByRole('link')).not.toHaveClass('[font:inherit]');
  });

  describe('adoption options', () => {
    it('leaves underline, weight and tracking classes off by default', () => {
      render(<Link href="/x">More</Link>);
      const link = screen.getByRole('link');
      expect(link).not.toHaveClass('underline', 'no-underline', 'font-medium', 'tracking-normal');
    });

    it('underline always keeps the underline on hover and press', () => {
      render(<Link href="/x" color="inherit" underline="always">More</Link>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('underline', 'hover:underline');
      expect(link).not.toHaveClass('hover:no-underline');
    });

    it('underline hover shows the underline on hover only', () => {
      render(<Link href="/x" color="inherit" underline="hover">More</Link>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('no-underline', 'hover:underline');
      expect(link).not.toHaveClass('underline');
    });

    it('underline none never underlines', () => {
      render(<Link href="/x" underline="none">More</Link>);
      expect(screen.getByRole('link')).toHaveClass('no-underline', 'hover:no-underline', 'active:no-underline');
    });

    it('weight medium sets the medium weight', () => {
      render(<Link href="/x" weight="medium">More</Link>);
      expect(screen.getByRole('link')).toHaveClass('font-medium');
    });

    it('tracking normal resets and inherit takes the surrounding letter spacing', () => {
      const { rerender } = render(<Link href="/x" typography="inherit" tracking="normal">More</Link>);
      expect(screen.getByRole('link')).toHaveClass('tracking-normal');
      rerender(<Link href="/x" typography="inherit" tracking="inherit">More</Link>);
      expect(screen.getByRole('link')).toHaveClass('[letter-spacing:inherit]');
      expect(screen.getByRole('link')).not.toHaveClass('tracking-normal');
    });
  });

  it('typography link-md sets the 16px link role', () => {
    render(<Link href="/a" typography="link-md">Read</Link>);
    expect(screen.getByRole('link')).toHaveClass('typography-link-md');
    expect(screen.getByRole('link')).not.toHaveClass('typography-link-sm');
  });
});

describe('Link gating (0.28.1)', () => {
  it('stays hoverable for a tooltip, calls onGatedClick and swallows the click', async () => {
    const onClick = vi.fn();
    const onGatedClick = vi.fn();
    const onParentClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test wrapper
      <div onClick={onParentClick}>
        <Link href="/x" disabled onClick={onClick} onGatedClick={onGatedClick}>
          Docs
        </Link>
      </div>,
    );
    const link = screen.getByText('Docs').closest('a') as HTMLElement;
    expect(link.className).not.toMatch(/pointer-events-none/);
    // userEvent refuses to click an element with pointer-events: none.
    await userEvent.click(link);
    expect(onGatedClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('aria-disabled alone is gated: still focusable and reachable by keyboard, the click is guarded', async () => {
    const onClick = vi.fn();
    const onGatedClick = vi.fn((event: React.MouseEvent) => event.defaultPrevented);
    render(
      <Link href="/x" aria-disabled="true" onClick={onClick} onGatedClick={onGatedClick}>
        Docs
      </Link>,
    );
    const link = screen.getByText('Docs').closest('a') as HTMLElement;
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('href', '/x');
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onGatedClick).toHaveBeenCalledTimes(1);
    expect(onGatedClick.mock.results[0].value).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });
});
