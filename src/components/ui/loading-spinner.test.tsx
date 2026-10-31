import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import { createRef } from 'react';

import { LoadingSpinner } from './loading-spinner';

const rawPaletteClass =
  /(^|\s)(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;

describe('LoadingSpinner component', () => {
  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LoadingSpinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className with the variant classes', () => {
    render(<LoadingSpinner className="mx-auto" data-testid="spinner" />);
    expect(screen.getByTestId('spinner')).toHaveClass('mx-auto', 'animate-spin', 'rounded-full');
  });

  // --- accessible name / live region (LOADSPIN-A11Y-01) ---
  // Unlike Skeleton (a purely visual tile that a composing component must wrap in its own live
  // region, see skeleton.tsx), LoadingSpinner is typically used standalone, so it self-announces:
  // role="status" + aria-live="polite" + a default "Loading" aria-label, matching the same
  // role/aria-live convention Table's inline TableLoading already uses (table.tsx).
  it('renders role="status" aria-live="polite" with a default "Loading" accessible name', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAccessibleName('Loading');
  });

  it('lets a consumer override the accessible name via `label`', () => {
    render(<LoadingSpinner label="Loading users" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading users');
  });

  it('lets a consumer override the accessible name via an explicit aria-label, taking precedence over `label`', () => {
    render(<LoadingSpinner label="Loading users" aria-label="Fetching results" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Fetching results');
  });

  it('lets a consumer override role/aria-live entirely (e.g. to avoid a nested live-region double-announcement)', () => {
    render(<LoadingSpinner role="presentation" aria-live="off" data-testid="spinner" />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAttribute('role', 'presentation');
    expect(spinner).toHaveAttribute('aria-live', 'off');
  });

  // --- token alignment (LOADSPIN-TOK-01, was a raw `border-slate-200 border-t-slate-600` pair
  // with no dark-mode value at all — see the comment in loading-spinner.tsx) ---
  describe('token-driven colors, never a raw Tailwind palette color class', () => {
    it('applies the adaptive semantic track token by default', () => {
      render(<LoadingSpinner data-testid="spinner" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('border-border-default');
      expect(spinner.className).not.toMatch(rawPaletteClass);
    });

    it.each([
      ['default', 'border-t-general-brand-default'],
      ['inverse', 'border-t-general-brand-on'],
      ['destructive', 'border-t-general-error-default'],
    ] as const)('tone=%s applies the %s active-indicator token', (tone, expectedClass) => {
      render(<LoadingSpinner tone={tone} data-testid="spinner" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass(expectedClass);
      expect(spinner.className).not.toMatch(rawPaletteClass);
    });
  });

  // --- size variants ---
  describe('size', () => {
    it.each([
      ['sm', 'h-4', 'w-4', 'border-2'],
      ['default', 'h-12', 'w-12', 'border-4'],
      ['lg', 'h-16', 'w-16', 'border-4'],
      ['xl', 'h-24', 'w-24', 'border-8'],
    ] as const)('size=%s applies %s/%s/%s', (size, h, w, border) => {
      render(<LoadingSpinner size={size} data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass(h, w, border);
    });

    it('defaults to size="default" (48px/border-4) so existing prop-less usage keeps its visual size', () => {
      render(<LoadingSpinner data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-12', 'w-12', 'border-4');
    });
  });

  // --- reduced motion (prefers-reduced-motion) ---
  // `animate-spin` runs indefinitely with no user interaction — same fallback Skeleton/Tooltip/
  // Select/DropdownMenu already carry for continuously/automatically animating primitives.
  it('carries a motion-reduce fallback so the spin can be turned off', () => {
    render(<LoadingSpinner data-testid="spinner" />);
    expect(screen.getByTestId('spinner')).toHaveClass('motion-reduce:animate-none');
  });

  // --- WCAG 1.4.11 non-text contrast for the active indicator (the only perceivable "it's
  // loading" signal) — pinned from public/theme.css rather than read live, same pattern as
  // skeleton.test.tsx's SKEL-A11Y-01 suite, so this doesn't silently pass/fail on an unrelated
  // jsdom/CSS-loading quirk. If a theme.css value changes, update the fixtures below and re-run.
  describe('WCAG 1.4.11 non-text contrast of the active indicator (LOADSPIN-A11Y-02)', () => {
    const toLinear = (c: number) => {
      const srgb = c / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    };
    const relativeLuminance = ([r, g, b]: [number, number, number]) =>
      0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    const contrastRatio = (a: [number, number, number], b: [number, number, number]) => {
      const [lA, lB] = [relativeLuminance(a), relativeLuminance(b)];
      const [hi, lo] = lA > lB ? [lA, lB] : [lB, lA];
      return (hi + 0.05) / (lo + 0.05);
    };

    // Pinned from public/theme.css (`:root` / `.dark`).
    const LIGHT_BACKGROUND: [number, number, number] = [255, 255, 255];
    const DARK_BACKGROUND: [number, number, number] = [2, 6, 23];
    const BRAND_DEFAULT: [number, number, number] = [37, 99, 235]; // --colors-general-brand-default (same in both modes)
    const ERROR_DEFAULT_LIGHT: [number, number, number] = [220, 38, 38]; // --colors-general-error-default (light)
    const ERROR_DEFAULT_DARK: [number, number, number] = [239, 68, 68]; // --colors-general-error-default (dark)
    const BRAND_ON_LIGHT: [number, number, number] = [248, 250, 252]; // --colors-general-brand-on (light)
    const BRAND_ON_DARK: [number, number, number] = [15, 23, 42]; // --colors-general-brand-on (dark)

    it('tone="default" (general-brand-default) clears 3:1 against the page background in light mode', () => {
      expect(contrastRatio(BRAND_DEFAULT, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(3);
    });

    it('tone="default" (general-brand-default) clears 3:1 against the page background in dark mode', () => {
      expect(contrastRatio(BRAND_DEFAULT, DARK_BACKGROUND)).toBeGreaterThanOrEqual(3);
    });

    it('tone="destructive" (general-error-default) clears 3:1 against the page background in both modes', () => {
      expect(contrastRatio(ERROR_DEFAULT_LIGHT, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(ERROR_DEFAULT_DARK, DARK_BACKGROUND)).toBeGreaterThanOrEqual(3);
    });

    // tone="inverse" is meant to sit on a solid `general-brand-default` fill (e.g. inside a filled
    // primary Button), not on the page background — checked against that fill instead.
    it('tone="inverse" (general-brand-on) clears 3:1 against a general-brand-default fill in both modes', () => {
      expect(contrastRatio(BRAND_ON_LIGHT, BRAND_DEFAULT)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(BRAND_ON_DARK, BRAND_DEFAULT)).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('LoadingSpinner inline layout', () => {
  it('puts the supporting text beside the indicator on one row', () => {
    render(<LoadingSpinner size="sm" layout="inline" supportingText="Saving..." />);
    const root = screen.getByRole('status');
    expect(root).toHaveAttribute('data-layout', 'inline');
    expect(root).toHaveClass('flex-row');
    expect(root).not.toHaveClass('flex-col');
    expect(screen.getByText('Saving...')).toHaveClass('whitespace-nowrap');
  });

  it('keeps the stacked layout by default', () => {
    render(<LoadingSpinner supportingText="Loading data..." />);
    expect(screen.getByRole('status')).toHaveClass('flex-col');
  });
});
