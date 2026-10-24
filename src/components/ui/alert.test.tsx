import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Button } from './button';
import { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle } from './alert';

describe('Alert component', () => {
  it('renders with role="status" for the (non-urgent) default variant', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Content</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className with the variant classes', () => {
    render(<Alert className="max-w-[400px]">Content</Alert>);
    expect(screen.getByRole('status')).toHaveClass('max-w-[400px]', 'rounded-card');
  });

  it('renders AlertTitle and AlertDescription', () => {
    render(
      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components using the cli.</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText('Heads up!')).toBeInTheDocument();
    expect(screen.getByText('You can add components using the cli.')).toBeInTheDocument();
  });

  describe('variant', () => {
    it.each([
      ['default', 'status', 'bg-surface-canvas', 'text-text-default'],
      ['decent', 'status', 'bg-background-neutral-subtle', 'text-text-default'],
      ['info', 'status', 'bg-general-info-default/10', 'text-general-info-hover'],
      ['success', 'status', 'bg-general-success-default/10', 'text-general-success-hover'],
      ['warning', 'alert', 'bg-general-warning-default/10', 'text-general-warning-hover'],
      ['destructive', 'alert', 'bg-general-error-default/10', 'text-text-destructive-on-subtle'],
    ] as const)('applies token classes for the %s variant', (variant, role, bgClass, textClass) => {
      render(<Alert variant={variant}>Content</Alert>);
      const alertEl = screen.getByRole(role);
      expect(alertEl).toHaveClass(bgClass, textClass);
    });

    it('never renders a raw Tailwind palette color class', () => {
      const variants = ['default', 'decent', 'info', 'success', 'warning', 'destructive'] as const;
      variants.forEach((variant) => {
        const { unmount } = render(<Alert variant={variant}>Content</Alert>);
        const alertEl = screen.getByRole(variant === 'warning' || variant === 'destructive' ? 'alert' : 'status');
        const rawPaletteClass =
          /(^|\s)(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;
        expect(alertEl.className).not.toMatch(rawPaletteClass);
        unmount();
      });
    });

    it('uses the high-contrast general-border-default token for the decent boundary', () => {
      render(<Alert variant="decent">Content</Alert>);
      expect(screen.getByRole('status')).toHaveClass('border-general-border-default');
    });

    // ALERT-A11Y-06 / ALERT-TOK-05: a rendered-contrast regression check, not just a class-name
    // assertion (a class name can be present while the token it points at is visually
    // insufficient — that's exactly how this gap slipped through the first time). Contrast is
    // computed from the actual CSS-var RGB triples shipped in `public/theme.css` for the
    // `default`/`decent` boundary pair (`--colors-general-border-default` against
    // `--semantic-background-default`), pinned here rather than read live so this test doesn't
    // silently pass/fail on an unrelated jsdom/CSS-loading quirk. If either theme.css value
    // changes, update the fixtures below to match and re-run — a change that regresses contrast
    // further will fail the light-mode assertion or shrink the (still tracked, not yet fixed)
    // dark-mode ratio below its pinned floor.
    describe('WCAG 1.4.11 non-text contrast (ALERT-A11Y-06)', () => {
      // Relative luminance / contrast ratio per WCAG 2.x, §1.4.11 / §1.4.3.
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

      // Pinned from public/theme.css (`:root` / `.dark`): `--colors-general-border-default` vs
      // `--semantic-background-default`, the border/page-background pair `default`/`decent` render.
      const LIGHT_BORDER: [number, number, number] = [15, 23, 42];
      const LIGHT_BACKGROUND: [number, number, number] = [255, 255, 255];
      const DARK_BORDER: [number, number, number] = [51, 65, 85];
      const DARK_BACKGROUND: [number, number, number] = [2, 6, 23];

      it('clears the 3:1 non-text minimum in light mode', () => {
        expect(contrastRatio(LIGHT_BORDER, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(3);
      });

      it('TOKEN GAP ALERT-TOK-05: dark mode still falls short of the 3:1 minimum (tracked, not fixable in this file — see the ALERT-TOK-05 comment in alert.tsx)', () => {
        const ratio = contrastRatio(DARK_BORDER, DARK_BACKGROUND);
        // Intentionally NOT `toBeGreaterThanOrEqual(3)` yet — there is no shipped, more-separated
        // `general-border-*` dark value to point at without fabricating one. This pins today's
        // known-insufficient ratio so any further regression (the value drifting even lower) fails
        // loudly, while a fix (design-tokens-maintainer shipping a >=3:1 value) will also fail this
        // assertion — at which point flip it to `toBeGreaterThanOrEqual(3)` and close the gap.
        expect(ratio).toBeCloseTo(1.95, 1);
        expect(ratio).toBeLessThan(3);
      });
    });

    it('defaults to the default variant', () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole('status')).toHaveClass('bg-surface-canvas', 'text-text-default');
    });
  });

  describe('role/aria-live (derived from severity)', () => {
    it.each([
      ['default', 'status', 'polite'],
      ['decent', 'status', 'polite'],
      ['info', 'status', 'polite'],
      ['success', 'status', 'polite'],
      ['warning', 'alert', 'assertive'],
      ['destructive', 'alert', 'assertive'],
    ] as const)('variant=%s renders role="%s" with aria-live="%s"', (variant, role, ariaLive) => {
      render(<Alert variant={variant}>Content</Alert>);
      const alertEl = screen.getByRole(role);
      expect(alertEl).toHaveAttribute('aria-live', ariaLive);
    });

    it('lets a consumer override the derived role and aria-live', () => {
      render(
        <Alert variant="destructive" role="status" aria-live="polite">
          Content
        </Alert>,
      );
      const alertEl = screen.getByRole('status');
      expect(alertEl).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('AlertClose (optional dismiss affordance)', () => {
    it('is not rendered unless composed by the consumer', () => {
      render(<Alert>Content</Alert>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders an accessible, labeled button when composed', () => {
      render(
        <Alert>
          <AlertClose />
        </Alert>,
      );
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('accepts a custom aria-label', () => {
      render(
        <Alert>
          <AlertClose aria-label="Close notification" />
        </Alert>,
      );
      expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    });

    it('fires onClick when activated via mouse or keyboard', async () => {
      const onClick = jest.fn();
      render(
        <Alert>
          <AlertClose onClick={onClick} />
        </Alert>,
      );
      const close = screen.getByRole('button', { name: 'Dismiss' });
      await userEvent.click(close);
      close.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('carries hover/focus-visible/active token classes', () => {
      render(
        <Alert>
          <AlertClose />
        </Alert>,
      );
      const close = screen.getByRole('button', { name: 'Dismiss' });
      expect(close).toHaveClass('hover:bg-background-neutral-default', 'hover:text-text-default');
      expect(close).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default', 'focus-visible:ring-offset-focus');
      expect(close).toHaveClass('active:bg-background-neutral-default', 'active:brightness-95');
    });

    it('supports a real disabled attribute and blocks activation', async () => {
      const onClick = jest.fn();
      render(
        <Alert>
          <AlertClose disabled onClick={onClick} />
        </Alert>,
      );
      const close = screen.getByRole('button', { name: 'Dismiss' });
      expect(close).toBeDisabled();
      expect(close).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-disabled');
      await userEvent.click(close);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('forwards a ref to the button element', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <Alert>
          <AlertClose ref={ref} />
        </Alert>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('size', () => {
    it('keeps the established layout by default', () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole('status')).toHaveClass('p-4', 'text-sm', 'leading-3', 'rounded-card');
    });

    it('compact: borderless severity tint, surface radius, ui type role and token padding', () => {
      render(
        <Alert size="compact" variant="warning">
          Content
        </Alert>,
      );
      const el = screen.getByRole('alert');
      expect(el).toHaveClass(
        'rounded-surface',
        'border-transparent',
        'typography-ui',
        'px-control-px-lg',
        'py-control-py-md',
        'bg-background-warning-subtle',
      );
      expect(el).not.toHaveClass('p-4');
      expect(el.className).not.toMatch(/(^|\s)rounded-card(\s|$)/);
    });
  });
});

describe('AlertActions', () => {
  it('renders a wrapping action row inside the alert, with focusable children', async () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Heads up</AlertTitle>
        <AlertActions>
          <button type="button">Renew</button>
          <button type="button">Later</button>
        </AlertActions>
      </Alert>,
    );
    const row = screen.getByRole('alert').querySelector('[data-slot="alert-actions"]') as HTMLElement;
    expect(row).toHaveClass('flex', 'flex-wrap', 'gap-2');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Renew' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Later' })).toHaveFocus();
  });

  it('keeps the icon out of the column rule for actionsPlacement="end" so it stays in its own column at every breakpoint', () => {
    render(
      <Alert actionsPlacement="end" variant="info">
        <svg data-testid="icon" aria-hidden="true" />
        <AlertTitle>Heads up</AlertTitle>
        <AlertActions>
          <button type="button">Renew</button>
        </AlertActions>
      </Alert>,
    );
    const root = screen.getByRole('status');
    expect(root).toHaveClass('@xl:[&>*:not(svg)]:col-start-1');
    expect(root).not.toHaveClass('@xl:[&>*]:col-start-1');
    expect(root).toHaveClass('@xl:[&>[data-slot=alert-actions]]:col-start-2');
  });
});

describe('Alert inline links', () => {
  const linkRule = '[&_[data-slot=button][data-variant=link]]:text-inherit';
  it.each(['info', 'success', 'warning', 'destructive'] as const)('%s alert: a link button takes the alert text colour and stays underlined', (variant) => {
    render(
      <Alert variant={variant}>
        <AlertDescription>
          Read the{' '}
          <Button variant="link" size="inline">
            billing terms
          </Button>
        </AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole(variant === 'warning' || variant === 'destructive' ? 'alert' : 'status');
    expect(alert).toHaveClass(linkRule, '[&_[data-slot=button][data-variant=link]]:underline', '[&_[data-slot=button][data-variant=link]]:underline-offset-4');
    const link = screen.getByRole('button', { name: 'billing terms' });
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveAttribute('data-variant', 'link');
  });

  it('leaves the neutral variants alone (the link keeps its own colour)', () => {
    render(<Alert variant="decent">x</Alert>);
    expect(screen.getByRole('status')).not.toHaveClass(linkRule);
  });
});
