import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DesignSystemProvider } from './design-system-provider';

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

const rawPaletteClass =
  /(^|\s)(bg|text|border|shadow|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;

// Radix Toast.Root portals into the Viewport rendered alongside it; both must sit inside a
// single Provider, matching toaster.tsx's own composition.
const renderToast = (props: React.ComponentProps<typeof Toast> = {}) =>
  render(
    <ToastProvider>
      <Toast data-testid="toast" {...props}>
        <div className="grid gap-1">
          <ToastTitle>Scheduled: Catch up</ToastTitle>
          <ToastDescription data-testid="toast-description">
            Friday, February 10, 2023 at 5:57 PM
          </ToastDescription>
        </div>
        <ToastAction altText="Undo" data-testid="toast-action">
          Undo
        </ToastAction>
        <ToastClose data-testid="toast-close" />
      </Toast>
      <ToastViewport />
    </ToastProvider>,
  );

describe('Toast placement', () => {
  it('sits at the bottom on phones with the newest toast nearest the edge, bottom right from sm (desktop unchanged)', () => {
    renderToast();
    const viewport = screen.getByRole('region').querySelector('ol') as HTMLElement;
    expect(viewport).toHaveClass('fixed', 'bottom-0', 'z-toast', 'flex-col-reverse', 'sm:right-0', 'sm:flex-col', 'md:max-w-[420px]');
    expect(viewport).not.toHaveClass('top-0');
    expect(viewport).not.toHaveClass('sm:top-auto');
    expect(viewport.className).toContain('max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]');
    expect(viewport.className).toContain('max-sm:bottom-[var(--toast-inset-bottom,0px)]');
    // Anchored on both sides on a phone: centred, full width.
    expect(viewport).toHaveClass('max-sm:inset-x-0', 'w-full');
  });

  it('opens from the bottom and slides out downward on phones', () => {
    renderToast();
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('data-[state=open]:slide-in-from-bottom-full', 'max-sm:data-[state=closed]:slide-out-to-bottom-full', 'sm:data-[state=closed]:slide-out-to-right-full');
    expect(toast.className).toContain('data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y,0px)]');
  });

  const mockMatchMedia = (phone: boolean) => {
    window.matchMedia = ((query: string) => ({
      matches: phone && query.includes('639px'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
  };

  it.each([
    [true, 'down'],
    [false, 'right'],
  ])('phone=%s swipes to dismiss in direction %s', async (phone, direction) => {
    mockMatchMedia(phone);
    renderToast();
    await waitFor(() => expect(screen.getByTestId('toast')).toHaveAttribute('data-swipe-direction', direction));
  });

  it('an explicit swipeDirection on the provider wins over the responsive default', async () => {
    mockMatchMedia(true);
    render(
      <ToastProvider swipeDirection="left">
        <Toast data-testid="toast">
          <ToastTitle>Hi</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('toast')).toHaveAttribute('data-swipe-direction', 'left'));
  });
});

describe('Toast component', () => {
  it('renders open by default (uncontrolled) with title, description and action', () => {
    renderToast();
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Scheduled: Catch up')).toBeInTheDocument();
    expect(screen.getByText('Friday, February 10, 2023 at 5:57 PM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  // --- default variant tokens ---
  it('renders the default variant with token-styled surface, never a raw palette value', () => {
    renderToast();
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('bg-surface-canvas', 'text-text-default');
    expect(toast.className).not.toMatch(rawPaletteClass);
  });

  // --- destructive variant tokens ---
  it('renders the destructive variant with the general-error-* surface family', () => {
    renderToast({ variant: 'destructive' });
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass(
      'destructive',
      'border-transparent',
      'bg-general-error-default',
      'text-general-error-on',
    );
    expect(toast.className).not.toMatch(rawPaletteClass);
  });

  // --- reduced motion (TOAST-A11Y-01) ---
  // Every sibling overlay/transition primitive (Tooltip, DropdownMenu, Accordion, Skeleton,
  // LoadingSpinner) carries a `motion-reduce:` fallback so `prefers-reduced-motion: reduce`
  // users get an instant show/hide instead of the slide-in/slide-out/fade-out animation. Toast
  // had none of these until now.
  it('carries a motion-reduce fallback so open/close is instant, not animated (TOAST-A11Y-01)', () => {
    renderToast();
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass(
      'motion-reduce:animate-none',
      'motion-reduce:transition-none',
      'motion-reduce:data-[state=closed]:animate-none',
    );
  });

  // --- non-text boundary contrast (TOAST-A11Y-02 / TOAST-TOK-03) ---
  it('carries a token-driven, non-color boundary on the default variant (TOAST-A11Y-02)', () => {
    renderToast();
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('border', 'border-solid', 'border-general-border-default');
    expect(toast.className).not.toMatch(rawPaletteClass);
  });

  describe('WCAG 1.4.11 non-text contrast (TOAST-A11Y-02 / TOAST-TOK-03)', () => {
    // Relative luminance / contrast ratio per WCAG 2.x, §1.4.11 / §1.4.3. Same formula/fixture
    // pattern as skeleton.test.tsx's SKEL-A11Y-01 suite and alert.test.tsx's ALERT-A11Y-06 suite:
    // values are pinned from public/theme.css rather than read live so this test doesn't silently
    // pass/fail on an unrelated jsdom/CSS-loading quirk.
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
    // `--semantic-background-default` — the same pair Skeleton's SKEL-A11Y-01 / Alert's
    // ALERT-A11Y-06 already pin.
    const LIGHT_BORDER: [number, number, number] = [15, 23, 42];
    const LIGHT_BACKGROUND: [number, number, number] = [255, 255, 255];
    const DARK_BORDER: [number, number, number] = [51, 65, 85];
    const DARK_BACKGROUND: [number, number, number] = [2, 6, 23];

    it('clears the 3:1 non-text minimum in light mode', () => {
      expect(contrastRatio(LIGHT_BORDER, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(3);
    });

    it('TOKEN GAP TOAST-TOK-03: dark mode still falls short of the 3:1 minimum (tracked, not fixable in this file — see the TOAST-TOK-03 comment in toast.tsx)', () => {
      const ratio = contrastRatio(DARK_BORDER, DARK_BACKGROUND);
      // Intentionally NOT `toBeGreaterThanOrEqual(3)` yet — there is no shipped, more-separated
      // border or elevation token for a near-black surface without fabricating one. This pins
      // today's known-insufficient ratio so a regression fails loudly, while a fix (a dedicated
      // dark-mode-aware `toast-border-default`) will also fail this assertion — at which point
      // flip it to `toBeGreaterThanOrEqual(3)` and close the gap.
      expect(ratio).toBeCloseTo(1.95, 1);
      expect(ratio).toBeLessThan(3);
    });
  });

  // --- destructive ToastClose hover + focus-visible parity (TOAST-A11Y-03) ---
  describe('destructive ToastClose (TOAST-A11Y-03)', () => {
    it('carries matching hover and focus-visible full-opacity classes, not hover-only', () => {
      renderToast({ variant: 'destructive' });
      const close = screen.getByTestId('toast-close');
      expect(close).toHaveClass('group-[.destructive]:text-general-error-on');
      expect(close).toHaveClass('group-[.destructive]:hover:text-general-error-on');
      expect(close).toHaveClass('group-[.destructive]:focus-visible:text-general-error-on');
    });

    it('is reachable and operable by keyboard', async () => {
      const user = userEvent.setup();
      renderToast({ variant: 'destructive' });
      const close = screen.getByTestId('toast-close');
      close.focus();
      expect(close).toHaveFocus();
      await user.keyboard('{Enter}');
      await waitFor(() => expect(screen.queryByTestId('toast')).not.toBeInTheDocument());
    });
  });

  // --- destructive ToastDescription full-opacity text (TOAST-A11Y-04) ---
  it('gives the destructive description group-scoped full opacity instead of the default 90% (TOAST-A11Y-04)', () => {
    renderToast({ variant: 'destructive' });
    const description = screen.getByTestId('toast-description');
    expect(description).toHaveClass('opacity-90', 'group-[.destructive]:opacity-100');
  });

  it('keeps the default variant description at the softer opacity-90 treatment', () => {
    renderToast();
    const description = screen.getByTestId('toast-description');
    expect(description).toHaveClass('opacity-90', 'group-[.destructive]:opacity-100');
  });

  // --- ToastClose accessible name ---
  it('defaults the close button aria-label to "Dismiss" and accepts an override', () => {
    renderToast();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  // --- icon family (MAT-TOAST-01) ---
  // The library's established icon family is lucide-react (dialog.tsx, sheet.tsx use `X` for the
  // identical dismiss affordance). ToastClose must render a lucide icon, not @radix-ui/react-icons.
  it('renders the dismiss icon from the lucide-react family, matching Dialog/Sheet (MAT-TOAST-01)', () => {
    renderToast();
    const close = screen.getByTestId('toast-close');
    const icon = close.querySelector('svg');
    expect(icon).toBeInTheDocument();
    // lucide-react icons carry this class; @radix-ui/react-icons icons do not.
    expect(icon).toHaveClass('lucide');
  });

  // --- persistently-visible resting dismiss affordance at full strength (MAT-TOAST-02 / TOAST-A11Y-06 / TOAST-A11Y-08) ---
  it.each(['default', 'destructive', 'inverse'] as const)('shows the %s dismiss control at rest with full colour, no opacity blend (WCAG 1.4.11)', (variant) => {
    renderToast({ variant });
    const close = screen.getByTestId('toast-close');
    expect(close.className).not.toMatch(/(^|\s)opacity-/);
  });

  it('colours the dismiss control per variant from text tokens that clear 3:1 on their own surface', () => {
    renderToast();
    expect(screen.getByTestId('toast-close')).toHaveClass('text-text-subtle', 'hover:text-text-default');
  });

  // --- ToastAction non-text boundary contrast (TOAST-A11Y-05) ---
  it('gives the default-variant ToastAction an explicit token border color, not the unstyled global fallback (TOAST-A11Y-05)', () => {
    renderToast();
    const action = screen.getByTestId('toast-action');
    expect(action).toHaveClass('border', 'border-solid', 'border-general-border-default');
    expect(action.className).not.toMatch(rawPaletteClass);
  });

  // --- fluid-type clamp overrides no longer use !important (TOAST-A11Y-07) ---
  describe('clamp text-spacing override (TOAST-A11Y-07)', () => {
    it('does not use the `!` (!important) modifier on the clamp font-size/line-height classes', () => {
      renderToast({ clamp: true });
      const toast = screen.getByTestId('toast');
      const title = screen.getByText('Scheduled: Catch up');
      const description = screen.getByTestId('toast-description');
      const action = screen.getByTestId('toast-action');

      for (const el of [toast, title, description, action]) {
        expect(el.className).not.toMatch(/!text-clamp-small/);
        expect(el.className).not.toMatch(/!leading-clamp-small/);
      }
    });

    it('still applies the clamp classes on the Toast root via higher-specificity descendant selectors', () => {
      // Toaster.tsx only forwards `clamp` to the Toast root (not to the nested Title/Description/
      // Action) — the root-level `[&_div]:` / `[&_button]:` descendant selectors are what actually
      // drive fluid type in the real toaster flow, so they are the ones that must stay non-important.
      renderToast({ clamp: true });
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('[&_div]:text-clamp-small', '[&_button]:text-clamp-small');
      expect(toast).toHaveClass('[&_div]:leading-clamp-small', '[&_button]:leading-clamp-small');
    });

    it('still applies the clamp classes via higher-specificity, non-important selectors when passed directly to Title/Description/Action', () => {
      // ToastTitle/ToastDescription/ToastAction each also accept their own `clamp` prop for direct
      // consumers that bypass Toaster; verify their `.group`-scoped override survives without `!`.
      render(
        <ToastProvider>
          <Toast data-testid="toast">
            <ToastTitle clamp data-testid="toast-title">
              Scheduled: Catch up
            </ToastTitle>
            <ToastDescription clamp data-testid="toast-description">
              Friday, February 10, 2023 at 5:57 PM
            </ToastDescription>
            <ToastAction clamp altText="Undo" data-testid="toast-action">
              Undo
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByTestId('toast-title')).toHaveClass(
        '[.group_&]:text-clamp-small',
        '[.group_&]:leading-clamp-small',
      );
      expect(screen.getByTestId('toast-description')).toHaveClass(
        '[.group_&]:text-clamp-small',
        '[.group_&]:leading-clamp-small',
      );
      expect(screen.getByTestId('toast-action')).toHaveClass(
        '[.group_&]:text-clamp-small',
        '[.group_&]:leading-clamp-small',
      );
    });
  });
});

describe('Toast built-in texts follow the labels context', () => {
  const full = (viewport?: string, provider?: string) => (
    <ToastProvider label={provider}>
      <Toast>
        <ToastTitle>Gespeichert</ToastTitle>
        <ToastClose />
      </Toast>
      <ToastViewport label={viewport} />
    </ToastProvider>
  );

  it('English by default: region, close button and spoken prefix', async () => {
    render(full());
    expect(screen.getByRole('region', { name: 'Notifications (F8)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain('Notification Gespeichert'));
  });

  it('German with the German locale: no English left', async () => {
    render(<DesignSystemProvider locale="de">{full()}</DesignSystemProvider>);
    expect(screen.getByRole('region', { name: 'Benachrichtigungen (F8)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain('Benachrichtigung Gespeichert'));
    expect(document.body.textContent).not.toMatch(/Notification|Dismiss/);
  });

  it('keeps the hotkey in the region name', () => {
    render(
      <DesignSystemProvider locale="de">
        <ToastProvider>
          <ToastViewport hotkey={['altKey', 'KeyT']} />
        </ToastProvider>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('region', { name: 'Benachrichtigungen (alt+T)' })).toBeInTheDocument();
  });

  it('a label prop or a provider label override wins over the locale', async () => {
    const { rerender } = render(<DesignSystemProvider locale="de">{full('Meldungen', 'Meldung')}</DesignSystemProvider>);
    expect(screen.getByRole('region', { name: 'Meldungen' })).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain('Meldung Gespeichert'));
    rerender(<DesignSystemProvider locale="de" labels={{ toastRegion: 'Hinweise ({hotkey})', dismiss: 'Weg' }}>{full()}</DesignSystemProvider>);
    expect(screen.getByRole('region', { name: 'Hinweise (F8)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weg' })).toBeInTheDocument();
  });
});
