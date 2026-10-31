import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

describe('Button component', () => {
  it('renders the label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('never wraps its label, a group of buttons wraps instead', () => {
    render(<Button size="sm">Export report</Button>);
    expect(screen.getByRole('button', { name: 'Export report' })).toHaveClass('whitespace-nowrap');
  });

  it('lets the link variant wrap like running text', () => {
    render(<Button variant="link">Lena Hartmann</Button>);
    expect(screen.getByRole('button', { name: 'Lena Hartmann' })).not.toHaveClass('whitespace-nowrap');
  });

  it('lets a consumer opt back into wrapping with a className', () => {
    render(<Button className="whitespace-normal">Export report</Button>);
    const button = screen.getByRole('button', { name: 'Export report' });
    expect(button).toHaveClass('whitespace-normal');
    expect(button).not.toHaveClass('whitespace-nowrap');
  });

  it('renders as a native button element by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toBeInstanceOf(HTMLButtonElement);
  });

  it('is disabled and non-interactive when disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onClick when activated via keyboard (Enter/Space)', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  // --- Icon slot (fixes the Figma "Icon=Default" gap: a passed icon must render, not a
  // hardcoded ArrowLeftIcon) ---
  describe('icon', () => {
    it('renders the passed icon instead of a hardcoded fallback', () => {
      render(<Button icon={<svg data-testid="custom-icon" />}>Continue</Button>);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('sizes the icon slot to the icon-md token for sm/md/lg/xl and 24px at 2xl', () => {
      const { rerender } = render(
        <Button size="md" icon={<svg data-testid="custom-icon" />}>
          Continue
        </Button>,
      );
      expect(screen.getByTestId('custom-icon')).toHaveClass('h-icon-md', 'w-icon-md');

      rerender(
        <Button size="2xl" icon={<svg data-testid="custom-icon" />}>
          Continue
        </Button>,
      );
      expect(screen.getByTestId('custom-icon')).toHaveClass('h-6', 'w-6');
    });
  });

  // --- Icon-only size scale (Figma "Icon=Only" across sm/md/lg/xl/2xl) ---
  describe('icon-only size scale', () => {
    it.each([
      ['icon-xs', 'h-control-xs', 'w-control-xs'],
      ['icon-sm', 'h-control-sm', 'w-control-sm'],
      ['icon', 'h-control-md', 'w-control-md'],
      ['icon-lg', 'h-control-lg', 'w-control-lg'],
      ['icon-xl', 'h-control-xl', 'w-control-xl'],
      ['icon-2xl', 'h-control-2xl', 'w-control-2xl'],
    ] as const)('renders %s at the correct square dimensions', (size, h, w) => {
      render(
        <Button size={size} aria-label="Go back">
          <svg />
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Go back' });
      expect(button).toHaveClass(h, w);
    });
  });

  // --- Dot-leading anatomy (Figma "Icon=Dot leading") ---
  describe('dotLeading', () => {
    it('renders a status dot before the label', () => {
      render(<Button dotLeading>Live</Button>);
      const button = screen.getByRole('button', { name: 'Live' });
      const dot = button.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full', 'h-[10px]', 'w-[10px]');
    });

    it('uses the on-color (currentColor) on solid Filled variants', () => {
      render(
        <Button variant="default" dotLeading>
          Live
        </Button>,
      );
      const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-current');
    });

    it('uses the fixed success token on non-Filled variants', () => {
      render(
        <Button variant="outline" dotLeading>
          Live
        </Button>,
      );
      const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-button-background-success-default');
    });

    it('takes precedence over a passed icon', () => {
      render(
        <Button dotLeading icon={<svg data-testid="custom-icon" />}>
          Live
        </Button>,
      );
      expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
    });
  });

  // --- Outline resting border (Figma "Outlined/Neutral/Default", node 3287:428629) ---
  // Regression coverage for the "too dark" defect: the outline variant previously had
  // no default border-color class, so it fell back to Tailwind's `currentColor` (the
  // near-black text color). It must render the shared interactive-stroke role
  // (`border-form-border-default` — gray/300 light, gray/700 dark; the same role Input/
  // Select/Textarea/Checkbox already consume) instead.
  describe('outline variant border', () => {
    it('binds the resting border to the shared form interactive-stroke token', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(button).toHaveClass('border', 'border-solid', 'border-input', 'bg-background', '[--button-elevation:theme(boxShadow.xs)]', 'shadow-[shadow:var(--bevel-button-outline-rest),var(--button-elevation)]');
    });

    it('does not fall back to the button-specific outline-border token or a raw color', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(button.className).not.toMatch(/border-button-border-outline-default/);
      expect(button.className).not.toMatch(/border-black|border-\[#/);
    });
  });

  // --- Outline hover background (Figma "Outlined/Neutral/Hover", node 3287:428797) ---
  // The outline variant previously had no hover background at all (`bg-transparent`
  // always). Figma specs a `gray/50` (light) / `gray/800` (dark) fill on hover, with the
  // border unchanged. Bound to `general-background-hover` — the existing neutral
  // hover-surface role (also used by Table rows) whose value already matches gray/50
  // light / gray/800 dark exactly — not the mismatched `button-background-outline-hover`
  // token (slate-100, flagged separately).
  describe('outline variant hover background', () => {
    it('darkens the border on hover instead of tinting the background', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button', { name: 'Cancel' });
      // Hover darkens the border (no background tint); pressed fills bg-muted.
      expect(button).toHaveClass('hover:border-border-bold', 'active:bg-muted');
      expect(button.className).not.toMatch(/hover:bg-(?!\[image:)/);
    });

    it('does not bind hover background to the mismatched button-background-outline-hover token', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(button.className).not.toMatch(/button-background-outline-hover/);
    });

    it('keeps the 1px input border alongside the hover border', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(button).toHaveClass('border', 'border-solid', 'border-input', 'hover:border-border-bold');
    });
  });

  // --- Primary / brand-filled (Figma "Variant=Filled, Color=Brand", node 3287:427299) ---
  // The brand button binds fill AND border to the same `button-background-primary` token,
  // so the outline matches the surface. Regression guard for the consumer defect where a
  // hand-branded `default` button got a blue fill but kept the neutral (slate-900) border.
  // Regression: tailwind-merge treated the token font size `text-clamp` as a
  // color and dropped the label color, leaving black text on the brand fill.
  describe('token font sizes keep the label color', () => {
    it.each(['clamp', 'clamp-sm'] as const)('size="%s" keeps text-button-foreground-primary-default', (size) => {
      render(
        <Button variant="primary" size={size}>
          Book
        </Button>,
      );
      expect(screen.getByRole('button', { name: 'Book' })).toHaveClass('text-button-foreground-primary-default');
    });
  });

  describe('primary variant', () => {
    it('fills and borders with the brand primary token, and text with the on-color', () => {
      render(<Button variant="primary">Book</Button>);
      const button = screen.getByRole('button', { name: 'Book' });
      expect(button).toHaveClass(
        'bg-button-background-primary-default',
        // border through the theme frame role (kette-tokens 5.26.0), default = the primary fill
        'border-[color:var(--frame-button-primary-rest)]',
        'text-button-foreground-primary-default',
      );
    });

    it('does not leave the neutral default border on the brand fill', () => {
      render(<Button variant="primary">Book</Button>);
      const button = screen.getByRole('button', { name: 'Book' });
      expect(button.className).not.toMatch(/border-button-background-default\b/);
    });

    it('counts as a solid Filled variant, so the status dot uses the on-color', () => {
      render(
        <Button variant="primary" dotLeading>
          Live
        </Button>,
      );
      const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-current');
    });
  });

  describe('asChild', () => {
    it('renders the single child element instead of a button', () => {
      render(
        <Button asChild>
          <a href="/somewhere">Go</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Go' });
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });
  });

  describe('size with asChild', () => {
    it('applies size classes to the slotted element', () => {
      render(
        <Button asChild size="sm">
          <a href="/x">Go</a>
        </Button>,
      );
      expect(screen.getByRole('link', { name: 'Go' })).toHaveClass('h-control-sm', 'px-button-px-sm');
    });

    it('uses the default size when none is given', () => {
      render(
        <Button asChild>
          <a href="/x">Go</a>
        </Button>,
      );
      expect(screen.getByRole('link', { name: 'Go' })).toHaveClass('h-control-md', 'px-control-px-md');
    });
  });
});

describe('Button state model (Attio recipe)', () => {
  it.each(['default', 'primary', 'destructive', 'outline', 'secondary', 'ghost'] as const)(
    '%s: always carries a 1px border, the control radius and the shared focus ring',
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      const button = screen.getByRole('button', { name: 'Go' });
      expect(button).toHaveClass('border', 'border-solid', 'rounded-control');
      expect(button).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default');
      expect(button).toHaveClass('disabled:opacity-disabled', 'disabled:pointer-events-none');
    },
  );

  it.each(['default', 'primary', 'outline'] as const)('%s: disabled uses the neutral disabled border role', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('disabled:border-border-disabled');
  });

  it('secondary: disabled keeps the transparent border', () => {
    render(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('disabled:border-transparent');
  });

  it.each(['default', 'primary', 'destructive'] as const)('%s: filled variants carry no shadow', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    // Only the theme bevel composition (0 0 #0000 without a theme bevel), no elevation in the default preset
    const cls = screen.getByRole('button', { name: 'Go' }).className;
    expect(cls).toContain('[--button-elevation:0_0_transparent]');
    expect(cls).not.toMatch(/(^|\s)shadow-(?!\[shadow:var\(--bevel-button-)/);
  });

  it('secondary is a muted fill with a stronger hover, so it no longer equals ghost', () => {
    render(
      <>
        <Button variant="secondary">Sec</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    );
    const secondary = screen.getByRole('button', { name: 'Sec' });
    const ghost = screen.getByRole('button', { name: 'Ghost' });
    expect(secondary).toHaveClass('bg-muted', 'hover:bg-muted-strong');
    expect(ghost).toHaveClass('bg-transparent', 'hover:bg-muted', 'active:bg-muted-strong');
    expect(secondary.className).not.toBe(ghost.className);
  });

  it.each([
    ['outline', 'data-[state=open]:border-border-bold'],
    ['ghost', 'data-[state=open]:bg-muted'],
    ['secondary', 'data-[state=open]:bg-muted-strong'],
    ['primary', 'data-[state=open]:bg-button-background-primary-hover'],
    ['destructive', 'data-[state=open]:bg-background-destructive-bold-hover'],
    ['outline-destructive', 'data-[state=open]:bg-general-error-container'],
    ['default', 'data-[state=open]:bg-button-background-hover'],
  ] as const)('%s: data-[state=open] mirrors the hover look', (variant, cls) => {
    render(<Button variant={variant}>Menu</Button>);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveClass(cls);
  });

  it('outline-destructive pairs error text and stroke on the page background, with AA on-container text on hover', () => {
    render(<Button variant="outline-destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('border-border-destructive', 'text-text-destructive', 'bg-background', 'shadow-xs');
    expect(button).toHaveClass('hover:bg-general-error-container', 'hover:text-general-error-on-container');
    expect(button).toHaveClass('rounded-control', 'focus-visible:ring-focus');
  });

  describe('compact density sizes', () => {
    it('sm is 13px/500 at 32px', () => {
      render(<Button size="sm">Go</Button>);
      expect(screen.getByRole('button')).toHaveClass('text-ui', 'font-medium', 'h-control-sm');
    });

    it.each(['sm', 'md', 'lg'] as const)('control-%s reads its height from the density token', (s) => {
      render(<Button size={`control-${s}`}>Go</Button>);
      expect(screen.getByRole('button')).toHaveClass(`h-control-${s}`);
    });
  });
});

describe('Button loading and count', () => {
  it('is busy, disabled and announces loading while loading, keeping the label', async () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Loading');
    expect(button.querySelector('[data-button-spinner]')).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses loadingLabel over the provider text and replaces the icon with the spinner', () => {
    render(
      <Button loading loadingLabel="Saving" icon={<svg data-testid="icon" />}>
        Save
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Saving');
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  it('is not busy by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('count pill is fully round like the Chip count', () => {
    render(<Button count={3}>Filters</Button>);
    expect(document.querySelector('[data-button-count]')).toHaveClass('rounded-full');
  });

  it('count is a 20px round pill on every variant outside zero', () => {
    for (const variant of ['default', 'primary', 'destructive', 'outline', 'secondary', 'ghost'] as const) {
      const { unmount } = render(
        <Button variant={variant} count={3}>
          Filters
        </Button>,
      );
      expect(document.querySelector('[data-button-count]')).toHaveClass('h-5', '[min-width:theme(spacing.5)]', 'rounded-full', 'inline-flex', 'items-center', 'justify-center');
      unmount();
    }
  });

  it('renders the count after the label', () => {
    render(<Button count={3}>Filters</Button>);
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('Filters3');
    expect(button.querySelector('[data-button-count]')).toHaveTextContent('3');
  });
});

describe('Button status corner', () => {
  it('adds a corner dot and appends the status text to the accessible name', () => {
    render(
      <Button size="icon" variant="ghost" aria-label="Sync" status="warning" statusLabel="Paused">
        <svg />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Sync, Paused' });
    expect(button).toHaveClass('relative');
    const dot = button.querySelector('[data-tone="warning"]');
    expect(dot).toHaveClass('absolute', 'bottom-0', 'right-0', 'bg-status-warning-dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('adds hidden text when there is no aria-label and no status without the prop', () => {
    const { rerender } = render(<Button status="success" statusLabel="Online">Sync</Button>);
    expect(screen.getByRole('button', { name: 'Sync Online' })).toBeInTheDocument();
    rerender(<Button>Sync</Button>);
    expect(screen.getByRole('button').querySelector('[data-tone]')).toBeNull();
    expect(screen.getByRole('button')).not.toHaveClass('relative');
  });
});

