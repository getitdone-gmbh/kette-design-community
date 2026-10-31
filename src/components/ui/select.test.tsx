import { screen, waitFor } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { DesignSystemProvider } from './design-system-provider';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './select';

// jsdom has no ResizeObserver / pointer-capture / scrollIntoView, all of which Radix's
// Select primitive touches while positioning and scrolling its listbox.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const renderSelect = (props: { disabled?: boolean; defaultValue?: string; invalid?: boolean } = {}) =>
  render(
    <Select disabled={props.disabled} defaultValue={props.defaultValue}>
      <SelectTrigger aria-invalid={props.invalid} className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry" disabled>
          Blueberry (Out of stock)
        </SelectItem>
        <SelectSeparator />
        <SelectItem value="grapes">Grapes</SelectItem>
      </SelectContent>
    </Select>,
  );

describe('Select component', () => {
  it('is closed by default and shows the placeholder', () => {
    renderSelect();
    expect(screen.getByRole('combobox')).toHaveTextContent('Select a fruit');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // --- token usage / no raw palette ---
  it('renders the trigger and menu with token-styled classes, no raw palette values', async () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass(
      'rounded-control',
      'border-input',
      'bg-background',
      'text-select-foreground-default',
    );
    expect(trigger.className).not.toMatch(/\bring-white\b/);
    expect(trigger.className).not.toMatch(/\bbg-white\b/);
    // `select`/`select-popover` are not real color keys in the resolved Tailwind theme
    // (regression guard for SELECT-MAT-01/02 — these class names must never come back).
    expect(trigger.className).not.toMatch(/\bborder-select\b/);

    await userEvent.click(trigger);
    const listbox = await waitFor(() => screen.getByRole('listbox'));
    expect(listbox).toHaveClass('bg-popover', 'text-popover-foreground', 'rounded-popover', 'border-hairline', 'shadow-popover');
    expect(listbox.className).not.toMatch(/\bbg-white\b/);
    expect(listbox.className).not.toMatch(/\bborder-select-popover\b/);
  });

  // --- focus-visible state ---
  it('gives the trigger the system focus ring instead of a hardcoded ring color', () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-focus',
      'focus-visible:ring-ring-default',
      'focus-visible:border-ring',
    );
  });

  // Select trigger and Input must be the same height in a form row.
  it('shares the Input vertical rhythm (py-2, input typography, normal leading)', () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('py-2', 'typography-input-text', 'leading-normal');
    expect(trigger.className).not.toMatch(/(^|\s)py-3(\s|$)/);
  });

  // --- open / "state=open" state ---
  it('opens the listbox on click and marks the trigger data-state=open', async () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(trigger).toHaveClass('data-[state=open]:ring-focus', 'data-[state=open]:ring-ring-default', 'data-[state=open]:border-ring');
    // `focus` is not a real color key in the resolved Tailwind theme (regression guard
    // for SELECT-MAT-03 — this class name must never come back).
    expect(trigger.className).not.toMatch(/\bdata-\[state=open\]:border-focus\b/);
  });

  // --- selected state ---
  it('marks the chosen item data-state=checked and renders a check indicator', async () => {
    renderSelect({ defaultValue: 'banana' });
    await userEvent.click(screen.getByRole('combobox'));

    const selected = await waitFor(() => screen.getByRole('option', { name: 'Banana' }));
    expect(selected).toHaveAttribute('data-state', 'checked');
    expect(selected).toHaveClass('rounded-item', 'gap-[10px]');
    // trailing check indicator
    expect(selected.querySelector('svg')).not.toBeNull();
  });

  it('updates the trigger value when an item is selected via pointer', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('combobox'));
    const option = await waitFor(() => screen.getByRole('option', { name: 'Apple' }));
    await userEvent.click(option);

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
  });

  // --- keyboard model ---
  it('opens with the keyboard and selects an item with Enter', async () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    // Radix highlights the first enabled item (Apple) as soon as the listbox opens.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent('Apple');
  });

  it('closes without selecting on Escape', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('combobox'));
    await waitFor(() => screen.getByRole('listbox'));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveTextContent('Select a fruit');
  });

  // --- disabled (root) state ---
  describe('disabled', () => {
    it('marks the trigger disabled and does not open on click', async () => {
      renderSelect({ disabled: true });
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-disabled');

      await userEvent.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  // --- disabled (item) state ---
  describe('disabled item', () => {
    it('exposes aria-disabled and is skipped by selection', async () => {
      renderSelect();
      await userEvent.click(screen.getByRole('combobox'));
      const disabledOption = await waitFor(() => screen.getByRole('option', { name: 'Blueberry (Out of stock)' }));

      expect(disabledOption).toHaveAttribute('data-disabled');
      expect(disabledOption).toHaveClass('data-[disabled]:pointer-events-none', 'data-[disabled]:opacity-disabled');

      await userEvent.click(disabledOption);
      // Still open — the disabled item does not accept the selection.
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  // --- invalid state ---
  describe('invalid', () => {
    it('renders aria-invalid and the corresponding error-token classes on the trigger', () => {
      renderSelect({ invalid: true });
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      // Arbitrary-variant form — Tailwind's built-in `aria-invalid` shorthand is not in
      // `theme.aria` (only busy/checked/disabled/expanded/hidden/pressed/readonly/
      // required/selected are), so `aria-invalid:*` compiles to no CSS at all. This
      // form is the one that actually generates a rule (regression guard for
      // A11Y-SEL-02).
      expect(trigger).toHaveClass('aria-[invalid=true]:border-destructive', 'aria-[invalid=true]:ring-destructive/20');
      expect(trigger.className).not.toMatch(/(?<!\[)aria-invalid:border-/);
    });
  });

  // --- hover state ---
  it('gives the trigger a visible hover treatment', () => {
    renderSelect();
    expect(screen.getByRole('combobox')).toHaveClass('hover:border-border-bold', 'hover:shadow-field-hover');
  });

  // --- hover / keyboard highlight ---
  it('applies the same highlight token to hover and keyboard navigation', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('combobox'));
    const option = await waitFor(() => screen.getByRole('option', { name: 'Apple' }));
    expect(option).toHaveClass('data-[highlighted]:bg-muted', 'focus:bg-muted');
  });
});

describe('Select compact', () => {
  it('renders a dense 32px trigger and keeps 40px by default', () => {
    render(
      <>
        <Select>
          <SelectTrigger compact aria-label="Dense">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
        </Select>
        <Select>
          <SelectTrigger aria-label="Regular">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
        </Select>
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Dense' })).toHaveClass('h-8', 'py-1');
    expect(screen.getByRole('combobox', { name: 'Regular' })).not.toHaveClass('h-8');
    expect(screen.getByRole('combobox', { name: 'Dense' })).not.toHaveAttribute('compact');
  });
});

describe('Select small sizes use the small type size (RA-LIB-06)', () => {
  const trigger = (size?: 'xs' | 'sm' | 'md' | 'lg', preset?: 'zero') => {
    const tree = (
      <Select defaultValue="a">
        <SelectTrigger aria-label="Field" size={size}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    render(preset ? <DesignSystemProvider preset={preset}>{tree}</DesignSystemProvider> : tree);
    return screen.getByRole('combobox');
  };

  it.each(['xs', 'sm'] as const)('size %s has the 13px small control type and no 16px floor below sm', (size) => {
    const el = trigger(size);
    expect(el).toHaveClass('text-ui', 'font-normal');
    expect(el).not.toHaveClass('typography-input-text');
    expect(el.className).not.toContain('max-sm:text-[max(16px');
  });

  it.each(['md', 'lg', undefined] as const)('size %s keeps the field text with the 16px floor below sm', (size) => {
    const el = trigger(size);
    expect(el).toHaveClass('typography-input-text', 'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]');
    expect(el).not.toHaveClass('text-ui');
  });

  it('the zero preset compact trigger (a sm trigger) takes the small type too', () => {
    render(
      <DesignSystemProvider preset="zero">
        <Select defaultValue="a">
          <SelectTrigger aria-label="Field" compact>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('combobox')).toHaveClass('text-ui');
  });

  it('keeps the height of each size', () => {
    expect(trigger('sm')).toHaveClass('h-control-sm');
  });

  it('is a button, so iOS Safari does not zoom on focus, and its native form twin cannot take focus', () => {
    const { container } = render(
      <form>
        <Select name="field" defaultValue="a">
          <SelectTrigger aria-label="Field" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </form>,
    );
    expect(screen.getByRole('combobox').tagName).toBe('BUTTON');
    const native = container.querySelector('select');
    expect(native).not.toBeNull();
    expect(native).toHaveAttribute('aria-hidden', 'true');
    expect(native).toHaveAttribute('tabindex', '-1');
  });
});
