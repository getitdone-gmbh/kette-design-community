import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import { createRef } from 'react';

import { Skeleton } from './skeleton';

const rawPaletteClass =
  /(^|\s)(bg|text|border|shadow|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;

describe('Skeleton component', () => {
  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} data-testid="skeleton" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a consumer className with the variant classes', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('h-12', 'w-12', 'rounded-full', 'animate-pulse');
  });

  // The fill is a token with light and dark values, never a raw palette class.
  it('applies the token-driven background, never a raw Tailwind palette color class (TABLE-MAT-02)', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-overlay-skeleton-default', 'animate-pulse', 'rounded-default');
    expect(skeleton.className).not.toMatch(rawPaletteClass);
  });

  // --- reduced motion (prefers-reduced-motion) ---
  // `animate-pulse` runs indefinitely with no user interaction, unlike Tooltip/Select/DropdownMenu's
  // one-shot open/close animation — so it needs the same `motion-reduce:animate-none` fallback those
  // primitives already carry, or `prefers-reduced-motion: reduce` users get a perpetual pulse forever.
  it('carries a motion-reduce fallback so the pulse can be turned off', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('motion-reduce:animate-none');
  });

  it('renders the block tile without a border, filled with the skeleton token', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-overlay-skeleton-default');
    expect(skeleton.className).not.toMatch(/(^|\s)border(-|\s|$)/);
    expect(skeleton.className).not.toMatch(rawPaletteClass);
  });

  describe('composed variants (Figma Skeleton set)', () => {
    it('defaults to the single block tile, unchanged (no status role, no data-variant)', () => {
      render(<Skeleton data-testid="skeleton" />);
      const el = screen.getByTestId('skeleton');
      expect(el).not.toHaveAttribute('role');
      expect(el).not.toHaveAttribute('data-variant');
      expect(el).toHaveClass('animate-pulse', 'rounded-default', 'bg-overlay-skeleton-default');
    });

    it('row-single renders exactly one row at the row height and announces itself', () => {
      const { container } = render(<Skeleton variant="row-single" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('data-variant', 'row-single');
      expect(status).toHaveTextContent('Loading');
      expect(container.querySelectorAll('.h-row')).toHaveLength(1);
      expect(container.querySelector('.h-row')).toHaveClass('border-border-subtle', 'px-3', 'gap-4');
    });

    it('row renders two rows by default and honours rows', () => {
      const { container, rerender } = render(<Skeleton variant="row" />);
      expect(container.querySelectorAll('.h-row')).toHaveLength(2);
      rerender(<Skeleton variant="row" rows={5} />);
      expect(container.querySelectorAll('.h-row')).toHaveLength(5);
    });

    it('text and avatar variants announce loading and use skeleton overlay tokens', () => {
      const { container, rerender } = render(<Skeleton variant="text" label="Loading text" />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading text');
      expect(container.querySelectorAll('.bg-overlay-skeleton-subtle')).toHaveLength(3);
      rerender(<Skeleton variant="avatar" />);
      expect(container.querySelector('.h-8')).toHaveClass('rounded-full', 'bg-overlay-skeleton-default');
    });

    it('bars carry the reduced-motion fallback and no raw palette class', () => {
      const { container } = render(<Skeleton variant="row-single" />);
      container.querySelectorAll('span.animate-pulse').forEach((bar) => {
        expect(bar).toHaveClass('motion-reduce:animate-none');
        expect(bar.className).not.toMatch(rawPaletteClass);
      });
    });
  });
});
