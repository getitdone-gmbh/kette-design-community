import { screen, waitFor } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// jsdom has no ResizeObserver; Radix's Popper primitives (which Tooltip is built on)
// use it to track anchor size.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;

// Radix opens on hover after `delayDuration` (default 700ms). Use 0 across tests so
// assertions don't depend on real timers. The rendered content carries a stable
// `data-testid` because Radix additionally renders a visually-hidden `role="tooltip"`
// span (for Safari/VoiceOver) alongside the styled surface, so `getByRole('tooltip')`
// can't be used to assert on the token classes.
const renderTooltip = (trigger: React.ReactNode, content: React.ReactNode = <p>Add to library</p>) =>
  render(
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent data-testid="tooltip-content">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );

// A disabled trigger now exposes TWO role="button" nodes with the same accessible
// name: the real (disabled, non-focusable) inner `<button>` and the wrapping `<span
// role="button">` that actually receives focus/hover. Disambiguate by tag name rather
// than relying on `getByRole` uniqueness.
const getDisabledTriggerElements = (name: string) => {
  const matches = screen.getAllByRole('button', { name });
  const wrapper = matches.find((el) => el.tagName === 'SPAN') as HTMLElement;
  const button = matches.find((el) => el.tagName === 'BUTTON') as HTMLElement;
  return { wrapper, button };
};

describe('Tooltip component', () => {
  it('is closed by default', () => {
    renderTooltip(<Button variant="outline">Hover</Button>);
    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
  });

  // --- hover state ---
  it('opens on hover and shows the token-styled content', async () => {
    renderTooltip(<Button variant="outline">Hover</Button>);
    await userEvent.hover(screen.getByRole('button', { name: 'Hover' }));

    const tooltip = await waitFor(() => screen.getByTestId('tooltip-content'));
    expect(tooltip).toHaveTextContent('Add to library');
    expect(tooltip).toHaveClass('bg-foreground', 'text-background', 'rounded-item', 'px-2', 'py-1', 'text-xs', 'font-medium');
    expect(tooltip.className).not.toMatch(/(^|\s)(border|shadow-)/);
    // No raw palette/hex values on the content surface.
    expect(tooltip.className).not.toMatch(/\bbg-black\b/);
    expect(tooltip.className).not.toMatch(/\btext-white\b/);
  });

  it('closes on Escape', async () => {
    renderTooltip(<Button variant="outline">Hover</Button>);
    await userEvent.hover(screen.getByRole('button', { name: 'Hover' }));
    await waitFor(() => screen.getByTestId('tooltip-content'));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument());
  });

  // --- focus-visible state ---
  it('opens on keyboard focus and closes on blur', async () => {
    renderTooltip(<Button variant="outline">Hover</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Hover' })).toHaveFocus();
    await waitFor(() => screen.getByTestId('tooltip-content'));

    await userEvent.tab();
    await waitFor(() => expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument());
  });

  // --- disabled trigger state ---
  describe('disabled trigger', () => {
    it('wraps a disabled child in a focusable, hoverable element', () => {
      renderTooltip(
        <Button variant="outline" disabled>
          Save
        </Button>,
      );
      const { wrapper, button } = getDisabledTriggerElements('Save');
      expect(button).toBeDisabled();
      // The real control keeps native disabled semantics for assistive tech…
      expect(button).toHaveAttribute('disabled');
      // …while a wrapper wins pointer/focus interaction so the tooltip can still open.
      expect(wrapper).toHaveAttribute('tabindex', '0');
      expect(button).toHaveStyle({ pointerEvents: 'none' });
    });

    it('opens on hover of the wrapper even though the inner control is disabled', async () => {
      renderTooltip(
        <Button variant="outline" disabled>
          Save
        </Button>,
        <p>You don&apos;t have permission to save this item</p>,
      );
      const { wrapper } = getDisabledTriggerElements('Save');
      await userEvent.hover(wrapper);

      const tooltip = await waitFor(() => screen.getByTestId('tooltip-content'));
      expect(tooltip).toHaveTextContent("You don't have permission to save this item");
    });

    it('does not wrap an enabled child', () => {
      renderTooltip(<Button variant="outline">Save</Button>);
      const button = screen.getByRole('button', { name: 'Save' });
      expect(button.parentElement).not.toHaveAttribute('tabindex', '0');
    });

    // --- focus-visible state (WCAG 2.4.7 / 2.4.11) ---
    it('gives the wrapper the system focus ring instead of the UA default outline', () => {
      renderTooltip(
        <Button variant="outline" disabled>
          Save
        </Button>,
      );
      const { wrapper } = getDisabledTriggerElements('Save');
      expect(wrapper).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-focus',
        'focus-visible:ring-ring-default',
        'rounded-control',
      );
    });

    // --- name/role/value (WCAG 4.1.2) ---
    it('exposes a button role and aria-disabled state on the focus target', () => {
      renderTooltip(
        <Button variant="outline" disabled>
          Save
        </Button>,
      );
      const { wrapper } = getDisabledTriggerElements('Save');
      expect(wrapper).toHaveAttribute('role', 'button');
      expect(wrapper).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // --- reduced motion (prefers-reduced-motion) ---
  it('carries a motion-reduce fallback so open/close is instant, not animated', async () => {
    renderTooltip(<Button variant="outline">Hover</Button>);
    await userEvent.hover(screen.getByRole('button', { name: 'Hover' }));

    const tooltip = await waitFor(() => screen.getByTestId('tooltip-content'));
    expect(tooltip).toHaveClass('motion-reduce:animate-none', 'motion-reduce:transition-none');
  });

  // --- arrow anatomy (Figma "Arrow" variants) ---
  it('renders an arrow that blends into the tooltip surface', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent data-testid="tooltip-content">
            <p>Add to library</p>
            <TooltipArrow data-testid="tooltip-arrow" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const arrow = await waitFor(() => screen.getByTestId('tooltip-arrow'));
    expect(arrow).toHaveClass('fill-foreground');
  });
});
