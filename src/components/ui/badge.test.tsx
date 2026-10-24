import { render, screen } from '@testing-library/react';

import { contrast, loadThemes } from '../../lib/token-contrast';
import { DesignSystemProvider } from './design-system-provider';
import { Badge } from './badge';

// The text sits in a label slot, so the badge root is its closest div.
const badgeEl = (name: string) => screen.getByText(name).closest('div') as HTMLElement;

describe('Badge component', () => {
  it('renders an optional leading icon as a decorative token sized slot', () => {
    render(<Badge icon={<svg data-testid="glyph" />}>Live</Badge>);
    const slot = screen.getByTestId('glyph').parentElement as HTMLElement;
    expect(slot).toHaveAttribute('aria-hidden', 'true');
    expect(slot).toHaveClass('[&>svg]:h-icon-xs', '[&>svg]:w-icon-xs');
    expect(badgeEl('Live')).toBeInTheDocument();
  });

  it('renders no icon slot by default', () => {
    const { container } = render(<Badge>Plain</Badge>);
    expect(container.querySelector('[data-slot="icon"]')).toBeNull();
  });

  it('renders the default variant', () => {
    render(<Badge>Default</Badge>);
    expect(badgeEl('Default')).toBeInTheDocument();
  });

  it.each([
    ['ghost', 'bg-badge-background-ghost-default', 'text-badge-foreground-ghost-default'],
    ['subtle', 'bg-badge-background-subtle-default', 'text-badge-foreground-subtle-default'],
    ['link', 'bg-badge-background-link-default', 'text-badge-foreground-link-default'],
  ] as const)('wires the %s variant to its dedicated badge-background-*/badge-foreground-* tokens', (variant, bgClass, fgClass) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    const el = badgeEl(variant);
    expect(el).toHaveClass(bgClass);
    expect(el).toHaveClass(fgClass);
  });

  it('does not use hardcoded/raw palette classes for the new variants', () => {
    render(<Badge variant="subtle">Subtle</Badge>);
    const el = badgeEl('Subtle');
    expect(el.className).not.toMatch(/\b(bg|text)-(slate|gray|blue|green|red)-\d{2,3}\b/);
  });

  it('uses the compact Attio sizing: 22px high, item radius, medium weight', () => {
    render(<Badge>Size</Badge>);
    expect(badgeEl('Size')).toHaveClass('h-badge', 'px-gap-control', 'rounded-item', 'text-xs', 'font-medium', 'border');
  });

  it('is static: no hover and no focus ring on any variant', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'subtle', 'link'] as const;
    for (const variant of variants) {
      const { unmount } = render(<Badge variant={variant}>{`b-${variant}`}</Badge>);
      const cls = badgeEl(`b-${variant}`).className;
      expect(cls).not.toMatch(/hover:/);
      expect(cls).not.toMatch(/focus(-visible)?:/);
      unmount();
    }
  });

  it('outline variant has an input-colored border and transparent fill', () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(badgeEl('Outline')).toHaveClass('border-input', 'text-foreground');
  });
});

describe('Badge info tone in the zero preset', () => {
  it('uses the status token background-info-subtle, not the brand tint, so themes that grey the status tints stay consistent', () => {
    render(
      <DesignSystemProvider preset="zero">
        <Badge variant="info">Info</Badge>
      </DesignSystemProvider>,
    );
    const el = badgeEl('Info');
    expect(el).toHaveClass('bg-background-info-subtle', 'text-text-info-on-subtle');
    expect(el).not.toHaveClass('bg-background-brand-subtle');
  });

  it('every status tone maps to its own status tokens', () => {
    render(
      <DesignSystemProvider preset="zero">
        <Badge variant="success">success</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="destructive" tinted>destructive</Badge>
      </DesignSystemProvider>,
    );
    expect(badgeEl('success')).toHaveClass('bg-general-success-container');
    expect(badgeEl('warning')).toHaveClass('bg-general-warning-container');
    expect(badgeEl('destructive')).toHaveClass('bg-background-destructive-subtle');
  });
});

describe('Badge status tones', () => {
  it.each(['success', 'warning', 'info'] as const)('wires %s to the container and on-container tokens', (tone) => {
    render(<Badge variant={tone}>{tone}</Badge>);
    const el = badgeEl(tone);
    expect(el).toHaveClass(`bg-general-${tone}-container`, `text-general-${tone}-on-container`);
    expect(el.className).not.toMatch(/\b(bg|text)-(slate|gray|blue|green|red|amber|emerald)-\d{2,3}\b/);
  });

  it('uses the neutral foreground for product text by default and keeps the product colour only when readable is false', () => {
    render(
      <>
        <Badge variant="product-backoffice">Default</Badge>
        <Badge variant="product-backoffice" readable={false}>
          Coloured
        </Badge>
      </>,
    );
    const fallback = badgeEl('Default');
    expect(fallback).toHaveClass('text-foreground', 'bg-product-backoffice-subtle');
    expect(fallback).not.toHaveClass('text-product-backoffice-default');
    expect(badgeEl('Coloured')).toHaveClass('text-product-backoffice-default');
  });

  it('renders the neutral product-accent variant with an optional border', () => {
    render(
      <Badge variant="product-accent" bordered>
        Accent
      </Badge>,
    );
    expect(badgeEl('Accent')).toHaveClass('bg-product-accent-subtle', 'text-foreground', 'border-product-accent-border');
  });
});

describe('Badge credit variant', () => {
  it('uses the data-status-credit subtle fill and on text tokens', () => {
    render(<Badge variant="credit">Credit</Badge>);
    const el = badgeEl('Credit');
    expect(el).toHaveClass('bg-data-status-credit-subtle', 'text-data-status-credit-on');
  });

  it.each(loadThemes().flatMap((t) => [[t.name, 'light', t.light] as const, [t.name, 'dark', t.dark] as const]))(
    '%s %s: credit text is at least 4.5:1 on its subtle fill',
    (_name, _mode, tokens) => {
      expect(contrast(tokens['data-status-credit-on'], tokens['data-status-credit-subtle'])).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('Badge in narrow containers', () => {
  it('never wraps, can shrink and carries the text as title', () => {
    render(<Badge>Projektbedarf KW 44</Badge>);
    const el = badgeEl('Projektbedarf KW 44');
    expect(el).toHaveClass('whitespace-nowrap', 'max-w-full');
    expect(el).not.toHaveClass('min-w-0');
    expect(screen.getByText('Projektbedarf KW 44')).toHaveClass('min-w-0', 'truncate');
    expect(el).toHaveAttribute('title', 'Projektbedarf KW 44');
  });

  it('truncates only the label and keeps the icon whole', () => {
    render(<Badge icon={<svg data-testid="glyph" />}>In Prüfung seit gestern</Badge>);
    const label = screen.getByText('In Prüfung seit gestern');
    expect(label).toHaveClass('min-w-0', 'truncate');
    expect(badgeEl('In Prüfung seit gestern')).toHaveAttribute('title', 'In Prüfung seit gestern');
    expect(screen.getByTestId('glyph').parentElement).toHaveClass('shrink-0');
  });

  it('keeps the dot whole and sets no title for element children', () => {
    const { container } = render(
      <Badge dot>
        <b>Rich</b>
      </Badge>,
    );
    expect(container.querySelector('[data-slot="dot"]')).toHaveClass('shrink-0');
    expect(container.firstElementChild).not.toHaveAttribute('title');
  });
});
