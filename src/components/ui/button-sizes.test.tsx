import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';

import { Button, type ButtonProps } from './button';
import { DesignSystemProvider } from './design-system-provider';

type Size = NonNullable<ButtonProps['size']>;

// kette-design-community ships the zero theme only (styles/theme.css), so the light :root block is the token source and only the zero preset is checked.
const rootBlock = readFileSync(join(process.cwd(), 'styles/theme.css'), 'utf8').split(/\n\}/)[0];
const tokenPx = (name: string) => {
  const match = rootBlock.match(new RegExp(`${name}:\\s*(\\d+)px`));
  if (!match) throw new Error(`no ${name} in styles/theme.css`);
  return Number.parseInt(match[1], 10);
};

// Rendered height in px: resolves the `h-control-*` class against the token value of the theme.
const pxOf = (button: HTMLElement, axis: 'h' | 'w') => {
  const cls = [...button.classList].find((c) => c.startsWith(`${axis}-control-`));
  if (!cls) throw new Error(`no ${axis} class on ${button.className}`);
  return tokenPx(`--size-control-${cls.replace(`${axis}-control-`, '')}`);
};

const heightOf = (size: Size, preset: 'zero', _theme: string, icon: boolean) => {
  const { unmount } = render(
    <DesignSystemProvider preset={preset}>
      <Button size={size} aria-label="Probe">
        {icon ? <svg /> : 'Probe'}
      </Button>
    </DesignSystemProvider>,
  );
  const button = screen.getByRole('button', { name: 'Probe' });
  const h = pxOf(button, 'h');
  if (icon) expect(pxOf(button, 'w')).toBe(h);
  unmount();
  return h;
};

// Chain rule: the workload.zero prototype decides (zero: sm 28, default 32, lg 36, dense icon 24), the default scale is the token scale.
const EXPECTED = {
  zero: { xs: 24, sm: 28, md: 32, lg: 36, xl: 40, '2xl': 48 },
} as const;

const CASES: Array<['zero', string]> = [['zero', 'zero']];

describe.each(CASES)('Button heights, preset %s with theme %s', (preset, theme) => {
  const e = EXPECTED[preset];

  it('text buttons follow the control scale', () => {
    expect(heightOf('sm', preset, theme, false)).toBe(e.sm);
    expect(heightOf('default', preset, theme, false)).toBe(e.md);
    expect(heightOf('md', preset, theme, false)).toBe(e.md);
    expect(heightOf('lg', preset, theme, false)).toBe(e.lg);
    expect(heightOf('xl', preset, theme, false)).toBe(e.xl);
    expect(heightOf('2xl', preset, theme, false)).toBe(e['2xl']);
  });

  it('every icon-only size is square and as high as its text size', () => {
    expect(heightOf('icon-xs', preset, theme, true)).toBe(e.xs);
    expect(heightOf('icon-sm', preset, theme, true)).toBe(heightOf('sm', preset, theme, false));
    expect(heightOf('icon', preset, theme, true)).toBe(heightOf('default', preset, theme, false));
    expect(heightOf('icon-lg', preset, theme, true)).toBe(heightOf('lg', preset, theme, false));
    expect(heightOf('icon-xl', preset, theme, true)).toBe(heightOf('xl', preset, theme, false));
    expect(heightOf('icon-2xl', preset, theme, true)).toBe(heightOf('2xl', preset, theme, false));
  });

  it('every icon-only size meets the 24px target size minimum (WCAG 2.5.8)', () => {
    for (const size of ['icon-xs', 'icon-sm', 'icon', 'icon-lg', 'icon-xl', 'icon-2xl'] as const) {
      expect(heightOf(size, preset, theme, true)).toBeGreaterThanOrEqual(24);
    }
  });
});

describe('icon-xs', () => {
  it('sizes the icon slot to the icon-xs token', () => {
    render(<Button size="icon-xs" aria-label="Remove" icon={<svg data-testid="slot" />} />);
    expect(screen.getByTestId('slot')).toHaveClass('h-icon-xs', 'w-icon-xs');
  });

  it('sizes a child glyph to the icon-xs token', () => {
    render(
      <Button size="icon-xs" variant="ghost" aria-label="Remove">
        <svg data-testid="glyph" />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('[&>svg]:h-icon-xs', '[&>svg]:w-icon-xs');
  });
});

describe('link variant padding', () => {
  it('has no padding by default, like inline text', () => {
    render(<Button variant="link">Docs</Button>);
    const cls = screen.getByRole('button', { name: 'Docs' }).className;
    expect(cls).toMatch(/(^|\s)p-0(\s|$)/);
    expect(cls).not.toMatch(/(^|\s)px-control-px-md(\s|$)/);
  });

  it('keeps the horizontal padding of the size with padded', () => {
    render(
      <Button variant="link" size="sm" padded>
        Docs
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Docs' });
    expect(button).toHaveClass('px-button-px-sm');
    expect(button.className).not.toMatch(/(^|\s)p-0(\s|$)/);
  });

  it('lets a consumer padding class win without the important flag', () => {
    render(
      <Button variant="link" className="px-3">
        Docs
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Docs' });
    expect(button).toHaveClass('px-3');
    expect(button.className).not.toMatch(/!p-0/);
  });

  it('ignores padded on other variants', () => {
    render(<Button padded>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('px-control-px-md');
  });
});

describe('inline', () => {
  it('is a link size with no fixed height that inherits the text of its paragraph', () => {
    render(
      <p>
        Read the{' '}
        <Button variant="link" size="inline">
          docs
        </Button>
      </p>,
    );
    const link = screen.getByRole('button', { name: 'docs' });
    expect(link.className).not.toMatch(/(^|\s)h-/);
    expect(link).toHaveClass('[:where(&)]:[font-size:inherit]', '[:where(&)]:[font-weight:inherit]', '[:where(&)]:[line-height:inherit]', 'p-0');
  });

  it('inherits type through zero-specificity rules, so text and font classes of the consumer win', () => {
    render(
      <Button variant="link" size="inline" className="text-sm font-medium">
        docs
      </Button>,
    );
    const link = screen.getByRole('button', { name: 'docs' });
    expect(link).toHaveClass('text-sm', 'font-medium');
    // No plain arbitrary property that could out-rank or tie with the consumer class.
    expect(link.className).not.toMatch(/(^|\s)\[(font-size|font-weight|line-height):inherit\]/);
  });

  it('looks like a link by default: link colour roles and underline, no weight change on hover', () => {
    render(
      <Button variant="link" size="inline">
        docs
      </Button>,
    );
    const link = screen.getByRole('button', { name: 'docs' });
    expect(link).toHaveClass('text-link-default', 'hover:text-link-hover', 'active:text-link-active', 'underline', 'underline-offset-4');
    expect(link.className).not.toContain('font-semibold');
  });

  it('keeps hover:font-semibold on the other link sizes', () => {
    render(<Button variant="link">Open</Button>);
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('hover:font-semibold');
  });

  it('has no border, min-height or negative margin, so the box is the text line', () => {
    render(
      <Button variant="link" size="inline">
        docs
      </Button>,
    );
    const link = screen.getByRole('button', { name: 'docs' });
    expect(link).toHaveClass('border-0');
    expect(link).not.toHaveClass('border');
    expect(link.className).not.toContain('min-height');
    expect(link.className).not.toContain('margin-block');
  });

  it('gets its 24px target (WCAG 2.5.8) from a centered pseudo-element that is capped at the line plus 8px', () => {
    render(
      <Button variant="link" size="inline">
        docs
      </Button>,
    );
    const link = screen.getByRole('button', { name: 'docs' });
    expect(link).toHaveClass('relative', 'after:absolute', 'after:left-1/2', 'after:top-1/2', 'after:-translate-x-1/2', 'after:-translate-y-1/2');
    // theme(spacing.6) is 1.5rem, 24px at the root size of 16px. The height never exceeds the line (1lh) plus spacing.2 (8px).
    expect(link.className).toContain('after:[width:max(100%,theme(spacing.6))]');
    expect(link.className).toContain('after:[height:min(theme(spacing.6),calc(1lh_+_theme(spacing.2)))]');
  });
});
