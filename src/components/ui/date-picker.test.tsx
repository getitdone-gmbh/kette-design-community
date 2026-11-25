import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { DatePicker, DatePickerModal, DatePickerPanel, formatDatePickerValue } from './date-picker';
import { DesignSystemProvider } from './design-system-provider';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const jan = new Date(2022, 0, 6);

describe('formatDatePickerValue', () => {
  it('formats single dates and ranges', () => {
    expect(formatDatePickerValue(undefined)).toBeUndefined();
    expect(formatDatePickerValue(jan)).toBe('Jan 6, 2022');
    expect(formatDatePickerValue({ from: jan, to: new Date(2022, 0, 9) })).toBe('Jan 6, 2022 - Jan 9, 2022');
    expect(formatDatePickerValue({ from: jan })).toBe('Jan 6, 2022 -');
  });
});

describe('DatePicker', () => {
  it('shows the placeholder and the formatted value', () => {
    const { rerender } = render(<DatePicker aria-label="Start" />);
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Select date');
    rerender(<DatePicker aria-label="Start" value={jan} />);
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Jan 6, 2022');
  });

  it('opens a popover grid, selects a day and closes (uncontrolled)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Start" defaultValue={jan} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    const grid = screen.getByRole('grid');
    await user.click(within(grid).getByRole('gridcell', { name: '15' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect((onValueChange.mock.calls[0][0] as Date).getDate()).toBe(15);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Jan 15, 2022');
  });

  it('opens with the keyboard', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Start" defaultValue={jan} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('range mode needs both ends before it closes and shows two months', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Period" mode="range" defaultValue={{ from: undefined, to: undefined }} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Period' }));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    const [first] = screen.getAllByRole('grid');
    await user.click(within(first).getAllByRole('gridcell', { name: '10' })[0]);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await user.click(within(first).getAllByRole('gridcell', { name: '12' })[0]);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalled();
  });

  it('actions mode keeps a draft until Apply and discards on Cancel', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Start" actions defaultValue={jan} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(within(screen.getByRole('grid')).getByRole('gridcell', { name: '20' }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Jan 6, 2022');
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(within(screen.getByRole('grid')).getByRole('gridcell', { name: '20' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Jan 20, 2022');
  });

  it('presets set the value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Period"
        mode="range"
        presets={[{ label: 'Last week', value: { from: new Date(2022, 0, 1), to: new Date(2022, 0, 7) } }]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Period' }));
    await user.click(screen.getByRole('button', { name: 'Last week' }));
    expect(onValueChange).toHaveBeenCalledWith({ from: new Date(2022, 0, 1), to: new Date(2022, 0, 7) });
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [v, setV] = useState<Date | undefined>(jan);
      return <DatePicker aria-label="Start" value={v} onValueChange={(next) => setV(next as Date)} />;
    };
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(within(screen.getByRole('grid')).getByRole('gridcell', { name: '3' }));
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Jan 3, 2022');
  });

  it('disabled and read only do not open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DatePicker aria-label="Start" disabled />);
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    rerender(<DatePicker aria-label="Start" readOnly />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('flags invalid and submits a form value', () => {
    const { container } = render(<DatePicker aria-label="Start" invalid value={jan} name="start" />);
    expect(screen.getByRole('button', { name: 'Start' })).toHaveAttribute('data-invalid', 'true');
    expect(container.querySelector('input[type=hidden][name=start]')).toHaveValue('Jan 6, 2022');
  });
});

describe('DatePickerPanel', () => {
  it('renders without a popover', () => {
    render(<DatePickerPanel value={jan} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});

describe('DatePickerModal', () => {
  it('opens as a dialog and applies the draft', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onOpenChange = vi.fn();
    render(<DatePickerModal open onOpenChange={onOpenChange} defaultValue={jan} onApply={onApply} />);
    expect(screen.getByRole('dialog', { name: 'Select date' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('grid')).getByRole('gridcell', { name: '9' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect((onApply.mock.calls[0][0] as Date).getDate()).toBe(9);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('cancel closes without applying', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onOpenChange = vi.fn();
    render(<DatePickerModal open onOpenChange={onOpenChange} onApply={onApply} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// R-LIB-14 (L-11): the week start of the user's format settings reaches the month grid.
describe('DatePicker weekStartsOn (R-LIB-14)', () => {
  const firstWeekday = () => (screen.getAllByRole('columnheader')[0] as HTMLElement).getAttribute('aria-label');

  it('starts the panel week on Sunday with weekStartsOn 0, also in German', () => {
    render(
      <DesignSystemProvider locale="de">
        <DatePickerPanel weekStartsOn={0} defaultMonth={new Date(2026, 10, 1)} />
      </DesignSystemProvider>,
    );
    expect(firstWeekday()).toBe('Sonntag');
  });

  it('starts the panel week on Wednesday with weekStartsOn 3', () => {
    render(<DatePickerPanel weekStartsOn={3} defaultMonth={new Date(2026, 10, 1)} />);
    expect(firstWeekday()).toBe('Wednesday');
  });

  it('keeps the locale rule without the prop (German weeks start on Monday)', () => {
    render(
      <DesignSystemProvider locale="de">
        <DatePickerPanel defaultMonth={new Date(2026, 10, 1)} />
      </DesignSystemProvider>,
    );
    expect(firstWeekday()).toBe('Montag');
  });

  it('passes weekStartsOn from DatePicker to its panel', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Start" weekStartsOn={3} defaultMonth={new Date(2026, 10, 1)} />);
    await user.click(screen.getByRole('button', { name: /Start/ }));
    expect(firstWeekday()).toBe('Wednesday');
  });
});
