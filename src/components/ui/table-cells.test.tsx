import { act, screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { Table, TableBadgeCell, TableBody, TableRow } from './table';
import { Chip } from './chip';
import { TableEditCell, TableLeadBadgeCell, TableSelectCell, TableButtonCell, TableLockTextCell, TableToggleCell, TableActionsCell, TablePaymentCell, TableProgressCell, TableRatingCell, TableTrendCell } from './table-cells';

// jsdom has no ResizeObserver, pointer capture or scrollIntoView, which Radix Select touches.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const inRow = (cells: React.ReactNode, rowProps: React.ComponentProps<typeof TableRow> = {}) =>
  render(
    <Table>
      <TableBody>
        <TableRow {...rowProps}>{cells}</TableRow>
      </TableBody>
    </Table>,
  );

describe('TableTrendCell', () => {
  it('positive and negative use the success and destructive chip with a non-colour cue', () => {
    inRow(
      <>
        <TableTrendCell value="$1,800" change="20%" trend="positive" />
        <TableTrendCell value="$900" change="5%" trend="negative" />
      </>,
    );
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('$1,800Up 20%');
    expect(cells[1]).toHaveTextContent('$900Down 5%');
    expect(cells[0].querySelector('[data-trend="positive"]')).toHaveClass('bg-general-success-hover');
    expect(cells[1].querySelector('[data-trend="negative"]')).toHaveClass('bg-general-error-default');
    expect(cells[0]).toHaveClass('px-6');
  });

  it('inherits cell states', () => {
    inRow(<TableTrendCell value="1" change="2%" trend="positive" selected disabled rowHeight="two-line" />);
    expect(screen.getByRole('cell')).toHaveClass('bg-table-background-selected', 'opacity-disabled', 'h-row-two-line');
  });
});

describe('TableProgressCell', () => {
  it('renders a named progressbar with the percentage on the right', () => {
    inRow(<TableProgressCell value={60} label="Onboarding" />);
    const bar = screen.getByRole('progressbar', { name: 'Onboarding' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByRole('cell')).toHaveTextContent('60%');
    expect(bar).toHaveClass('h-progress-md');
  });
});

describe('TableRatingCell', () => {
  it('is an image named with the rating and fills the right number of stars', () => {
    inRow(<TableRatingCell value={4} />);
    const img = screen.getByRole('img', { name: 'Rating: 4 of 5' });
    expect(img.querySelectorAll('[data-filled]')).toHaveLength(4);
    expect(img.querySelectorAll('svg')).toHaveLength(5);
  });

  it('clamps out of range values', () => {
    inRow(<TableRatingCell value={9} max={5} label="Score" />);
    expect(screen.getByRole('img', { name: 'Score: 5 of 5' })).toBeInTheDocument();
  });
});

describe('TableActionsCell', () => {
  it('renders labelled icon buttons that fire and can be disabled', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    inRow(
      <TableActionsCell
        actions={[
          { label: 'Edit', icon: <svg />, onClick: onEdit },
          { label: 'Delete', icon: <svg />, onClick: onDelete, disabled: true },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Row actions' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('h-control-md', 'w-control-md');
  });

  it('cell disabled disables every action and keyboard reaches them in order', async () => {
    inRow(<TableActionsCell disabled actions={[{ label: 'A', icon: <svg /> }]} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
  });

  it('tab moves through enabled actions', async () => {
    inRow(
      <TableActionsCell
        actions={[
          { label: 'One', icon: <svg /> },
          { label: 'Two', icon: <svg /> },
        ]}
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });
});

describe('TablePaymentCell', () => {
  it('shows the method icon decoratively with title and supporting text', () => {
    inRow(<TablePaymentCell icon={<svg data-testid="visa" />} name="Visa ending in 1234" supportingText="Expiry 06/2024" />);
    expect(screen.getByTestId('visa').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('cell')).toHaveTextContent('Visa ending in 1234Expiry 06/2024');
  });

  it('works without a supporting line', () => {
    inRow(<TablePaymentCell icon={<svg />} name="SEPA" />);
    expect(screen.getByRole('cell')).toHaveTextContent(/^SEPA$/);
  });
});

describe('TableLockTextCell', () => {
  it('shows a decorative lock and the text', () => {
    inRow(<TableLockTextCell>Required, cannot be turned off</TableLockTextCell>);
    const cell = screen.getByRole('cell');
    expect(cell).toHaveTextContent('Required, cannot be turned off');
    expect(cell.querySelector('[data-slot="lock"]')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('TableToggleCell', () => {
  it('is a named switch that reports changes when controlled', async () => {
    const onCheckedChange = vi.fn();
    inRow(<TableToggleCell label="Email for Alex" checked={false} onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole('switch', { name: 'Email for Alex' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles from the keyboard when uncontrolled and is disabled with the cell', async () => {
    const { unmount } = inRow(<TableToggleCell label="Digest" defaultChecked />);
    const sw = screen.getByRole('switch', { name: 'Digest' });
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    unmount();
    inRow(<TableToggleCell label="Digest" disabled />);
    expect(screen.getByRole('switch', { name: 'Digest' })).toBeDisabled();
  });
});

describe('TableButtonCell', () => {
  it('renders an outlined small button that fires onClick and respects disabled', async () => {
    const onClick = vi.fn();
    const { unmount } = inRow(<TableButtonCell onClick={onClick}>Open</TableButtonCell>);
    const btn = screen.getByRole('button', { name: 'Open' });
    expect(btn).toHaveClass('h-control-sm');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    unmount();
    inRow(<TableButtonCell disabled>Open</TableButtonCell>);
    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled();
  });
});

describe('TableBadgeCell with a colour dot chip', () => {
  it('renders a chip with a decorative colour dot and the text', () => {
    inRow(<TableBadgeCell><Chip variant="outline" size="small" dotLeading dotColor="bg-general-success-default">Active</Chip></TableBadgeCell>);
    const cell = screen.getByRole('cell');
    expect(cell).toHaveTextContent('Active');
    expect(cell.querySelector('[aria-hidden="true"].bg-general-success-default')).toBeInTheDocument();
  });
});

describe('TableActionsCell align', () => {
  it('end-aligns the action group when align is right', () => {
    inRow(<TableActionsCell align="right" actions={[{ label: 'Edit', icon: <span /> }]} />);
    expect(screen.getByRole('group')).toHaveClass('justify-end');
  });
});

describe('TableEditCell', () => {
  it('shows the value as a named button and edits with Enter, saving on Enter', async () => {
    const onCommit = vi.fn();
    inRow(<TableEditCell label="Name" value="Nordwind Handel" onCommit={onCommit} />);
    const button = screen.getByRole('button', { name: 'Edit Name: Nordwind Handel' });
    expect(button).toHaveTextContent('Nordwind Handel');
    button.focus();
    await userEvent.keyboard('{Enter}');
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveFocus();
    expect(screen.getByRole('cell')).toHaveClass('ring-inset');
    await userEvent.keyboard('{Control>}a{/Control}Example Studio{Enter}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('Example Studio');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Name/ })).toHaveFocus();
  });

  it('opens on click and cancels with Escape without saving', async () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    inRow(<TableEditCell label="Name" value="Nordwind Handel" onCommit={onCommit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name: Nordwind Handel' }));
    await userEvent.keyboard('X{Escape}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Edit Name: Nordwind Handel' })).toHaveFocus();
  });

  it('saves a changed draft on blur (the text is preselected)', async () => {
    const onCommit = vi.fn();
    inRow(<TableEditCell label="Name" value="Nordwind Handel" onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name: Nordwind Handel' }));
    await userEvent.keyboard('s');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith('s');
  });

  it('does not commit an unchanged value', async () => {
    const onCommit = vi.fn();
    inRow(<TableEditCell label="Name" value="Nordwind Handel" onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name: Nordwind Handel' }));
    await userEvent.keyboard('{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('shows a placeholder, the error state and a disabled cell', async () => {
    inRow(<TableEditCell label="Name" value="" placeholder="Add name" disabled />);
    const button = screen.getByRole('button', { name: 'Edit Name: Add name' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Add name');
  });

  it('exposes the error message to the input', () => {
    inRow(<TableEditCell label="Name" value="x" defaultEditing errorMessage="Too short" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Too short');
    expect(screen.getByRole('cell')).toHaveAttribute('aria-invalid', 'true');
  });

  it('can be driven from outside', async () => {
    const onEditingChange = vi.fn();
    inRow(<TableEditCell label="Name" value="Nordwind Handel" editing onEditingChange={onEditingChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onEditingChange).toHaveBeenCalledWith(false);
  });
});

describe('TableSelectCell', () => {
  const options = [
    { value: 'a1', label: 'A1' },
    { value: 'b2', label: 'B2' },
  ];

  it('renders a named combobox with the chosen value', () => {
    inRow(<TableSelectCell label="Level for Spanish" options={options} defaultValue="b2" />);
    const trigger = screen.getByRole('combobox', { name: 'Level for Spanish' });
    expect(trigger).toHaveTextContent('B2');
  });

  it('reports a pick through onValueChange', async () => {
    const onValueChange = vi.fn();
    inRow(<TableSelectCell label="Level" options={options} defaultValue="a1" onValueChange={onValueChange} />);
    screen.getByRole('combobox', { name: 'Level' }).focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('b2');
  });

  it('a disabled cell disables the dropdown and an invalid cell marks it', () => {
    inRow(
      <>
        <TableSelectCell label="Off" options={options} disabled />
        <TableSelectCell label="Bad" options={options} invalid />
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Off' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Bad' })).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('TableLeadBadgeCell', () => {
  it('shows the title, the small tinted chip and the supporting line', () => {
    inRow(
      <TableLeadBadgeCell badge="New" supportingText="Sent when a demand is created">
        New demand
      </TableLeadBadgeCell>,
    );
    const cell = screen.getByRole('cell');
    expect(cell).toHaveTextContent('New demandNewSent when a demand is created');
    expect(screen.getByText('New').closest('div')).toHaveClass('bg-general-info-container');
    expect(screen.getByText('New demand')).toHaveClass('typography-ui-medium');
    expect(screen.getByText('Sent when a demand is created')).toHaveClass('text-text-subtle');
  });

  it('omits chip and supporting line when not given and supports the warning tone', () => {
    const { rerender } = inRow(<TableLeadBadgeCell>Plain</TableLeadBadgeCell>);
    expect(screen.getByRole('cell')).toHaveTextContent(/^Plain$/);
    rerender(
      <Table>
        <TableBody>
          <TableRow>
            <TableLeadBadgeCell badge="Required" badgeVariant="warning">
              Security
            </TableLeadBadgeCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Required').closest('div')).toHaveClass('bg-general-warning-container');
  });
});

describe('TableEditCell mode="always"', () => {
  const Grid = ({ onCommit = vi.fn(), onNavigate, nextCellOnEnter, commitDelay }: { onCommit?: (r: number, c: number, v: string) => void; onNavigate?: (d: string, moved: boolean) => void; nextCellOnEnter?: 'down' | 'right' | 'none'; commitDelay?: number }) => (
    <Table>
      <TableBody>
        {[0, 1].map((r) => (
          <TableRow key={r}>
            {[0, 1].map((c) => (
              <TableEditCell key={c} mode="always" label={`R${r}C${c}`} value="" onCommit={(v) => onCommit(r, c, v)} onNavigate={onNavigate} nextCellOnEnter={nextCellOnEnter} commitDelay={commitDelay} />
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  it('does not draw the cell ring while the input has focus (the input keeps its own indicator)', async () => {
    render(<Grid />);
    const input = screen.getByRole('textbox', { name: 'R0C0' });
    await userEvent.click(input);
    expect(input).toHaveFocus();
    expect(input.closest('td')?.className).not.toContain('ring-border-focus');
  });

  it('draws the cell ring when the consumer marks the cell focused', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableEditCell mode="always" focused label="F" value="" onCommit={() => {}} />
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('textbox', { name: 'F' }).closest('td')?.className).toContain('ring-border-focus');
  });

  it('renders typeable inputs without click-to-edit', async () => {
    render(<Grid />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'R0C0' }), '7');
    expect(screen.getByRole('textbox', { name: 'R0C0' })).toHaveValue('7');
  });

  it('commits on blur once, and not for an unchanged value', async () => {
    const onCommit = vi.fn();
    render(<Grid onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'R0C0' }));
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox', { name: 'R0C0' }), '4');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(0, 0, '4');
  });

  it('Enter commits and moves down by default, Shift+Enter moves up', async () => {
    const onCommit = vi.fn();
    const onNavigate = vi.fn();
    render(<Grid onCommit={onCommit} onNavigate={onNavigate} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'R0C1' }), '2{Enter}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: 'R1C1' })).toHaveFocus();
    expect(onNavigate).toHaveBeenLastCalledWith('down', true);
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    expect(screen.getByRole('textbox', { name: 'R0C1' })).toHaveFocus();
    expect(onNavigate).toHaveBeenLastCalledWith('up', true);
  });

  it('moves right and wraps to the next row, and reports the end of the grid', async () => {
    const onNavigate = vi.fn();
    render(<Grid nextCellOnEnter="right" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'R0C0' }));
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('textbox', { name: 'R0C1' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('textbox', { name: 'R1C0' })).toHaveFocus();
    await userEvent.keyboard('{Enter}{Enter}');
    expect(screen.getByRole('textbox', { name: 'R1C1' })).toHaveFocus();
    expect(onNavigate).toHaveBeenLastCalledWith('right', false);
  });

  it('keeps focus with nextCellOnEnter="none"', async () => {
    render(<Grid nextCellOnEnter="none" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'R0C0' }), '1{Enter}');
    expect(screen.getByRole('textbox', { name: 'R0C0' })).toHaveFocus();
  });

  it('saves after commitDelay while typing and not again on blur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onCommit = vi.fn();
    render(<Grid onCommit={onCommit} commitDelay={300} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'R0C0' }), '12', { advanceTimers: vi.advanceTimersByTime });
    expect(onCommit).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(0, 0, '12');
    await userEvent.tab({ advanceTimers: vi.advanceTimersByTime });
    expect(onCommit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('supports an inline note editor in a popover', async () => {
    const onNote = vi.fn();
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: onNote, placeholder: 'Note' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    const field = screen.getByRole('textbox', { name: 'Note for Monday' });
    await userEvent.type(field, 'Workshop{Enter}');
    expect(onNote).toHaveBeenCalledWith('Workshop');
    expect(screen.queryByRole('textbox', { name: 'Note for Monday' })).not.toBeInTheDocument();
  });

  it('marks a cell that has a note and offers editing it', () => {
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Workshop', onCommit: () => {} }} />);
    expect(screen.getByRole('button', { name: 'Edit note for Monday' })).toHaveAttribute('data-has-note');
  });

  it('shows the error message and a disabled state', () => {
    inRow(<TableEditCell mode="always" label="Monday" value="4" errorMessage="Max 24" disabled />);
    const input = screen.getByRole('textbox', { name: 'Monday' });
    expect(input).toHaveAccessibleDescription('Max 24');
    expect(input).toBeDisabled();
  });

  it('picks up a new committed value from outside', () => {
    const { rerender } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableEditCell mode="always" label="Monday" value="4" />
          </TableRow>
        </TableBody>
      </Table>,
    );
    rerender(
      <Table>
        <TableBody>
          <TableRow>
            <TableEditCell mode="always" label="Monday" value="6" />
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('textbox', { name: 'Monday' })).toHaveValue('6');
  });
});

describe('TableEditCell note editor (0.20)', () => {
  it('opens the editor with Enter and with Space on the note button and moves focus into it', async () => {
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: () => {} }} />);
    const button = screen.getByRole('button', { name: 'Add note for Monday' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('textbox', { name: 'Note for Monday' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Note for Monday' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(await screen.findByRole('textbox', { name: 'Note for Monday' })).toBeInTheDocument();
  });

  it('names the editor as a dialog', async () => {
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: () => {} }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    expect(screen.getByRole('dialog', { name: 'Note for Monday' })).toBeInTheDocument();
  });

  it('does not commit the draft when Escape discards it', async () => {
    const onNote = vi.fn();
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Kept', onCommit: onNote }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit note for Monday' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Note for Monday' }), ' more{Escape}');
    expect(onNote).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Edit note for Monday' }));
    expect(screen.getByRole('textbox', { name: 'Note for Monday' })).toHaveValue('Kept');
  });

  it('multiline: renders a textarea, Enter adds a line and Ctrl+Enter commits and closes', async () => {
    const onNote = vi.fn();
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: onNote, multiline: true }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    const field = screen.getByRole('textbox', { name: 'Note for Monday' });
    expect(field.tagName).toBe('TEXTAREA');
    await userEvent.type(field, 'one{Enter}two');
    expect(onNote).not.toHaveBeenCalled();
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onNote).toHaveBeenCalledWith('one\ntwo');
    expect(screen.queryByRole('textbox', { name: 'Note for Monday' })).not.toBeInTheDocument();
  });

  it('commitOnChange: commits after the delay while typing, once per change, and not again on close', async () => {
    vi.useFakeTimers();
    const onNote = vi.fn();
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: onNote, commitOnChange: true, commitDelay: 300 }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }), { advanceTimers: vi.advanceTimersByTime });
    await userEvent.type(screen.getByRole('textbox', { name: 'Note for Monday' }), 'Work', { advanceTimers: vi.advanceTimersByTime });
    expect(onNote).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(onNote).toHaveBeenCalledTimes(1);
    expect(onNote).toHaveBeenCalledWith('Work');
    await userEvent.keyboard('{Enter}', { advanceTimers: vi.advanceTimersByTime });
    expect(onNote).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('commitOnChange: flushes a pending change when the editor closes before the delay ran out', async () => {
    const onNote = vi.fn();
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: onNote, commitOnChange: true, commitDelay: 5000 }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Note for Monday' }), 'Quick{Enter}');
    expect(onNote).toHaveBeenCalledTimes(1);
    expect(onNote).toHaveBeenCalledWith('Quick');
  });

  it('render slot: shows consumer fields in the editor that can recalculate the cell hours', async () => {
    const onCommit = vi.fn();
    const Fields = () => {
      const [from, setFrom] = React.useState('09:00');
      const [to, setTo] = React.useState('12:00');
      return (
        <TableEditCell
          mode="always"
          label="Monday"
          value="3"
          onCommit={onCommit}
          note={{
            value: '',
            onCommit: () => {},
            render: ({ label }) => (
              <>
                <input aria-label={`From ${label}`} value={from} onChange={(e) => setFrom(e.target.value)} />
                <input
                  aria-label={`To ${label}`}
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    onCommit(String(Number(e.target.value.slice(0, 2)) - Number(from.slice(0, 2))));
                  }}
                />
              </>
            ),
          }}
        />
      );
    };
    inRow(<Fields />);
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    const to = screen.getByRole('textbox', { name: 'To Monday' });
    expect(screen.getByRole('textbox', { name: 'From Monday' })).toHaveFocus();
    await userEvent.clear(to);
    await userEvent.type(to, '17:00');
    expect(onCommit).toHaveBeenLastCalledWith('8');
    expect(screen.getByRole('textbox', { name: 'Note for Monday' })).toBeInTheDocument();
  });

  it('render slot context: setDraft writes the note and close commits it', async () => {
    const onNote = vi.fn();
    inRow(
      <TableEditCell
        mode="always"
        label="Monday"
        value="4"
        note={{
          value: '',
          onCommit: onNote,
          render: ({ setDraft, close }) => (
            <button type="button" onClick={() => { setDraft('09:00 to 13:00'); close(); }}>
              Use preset
            </button>
          ),
        }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use preset' }));
    expect(onNote).toHaveBeenCalledWith('09:00 to 13:00');
  });

  it('preview line: shows the note truncated in the cell and describes the note button with it', () => {
    inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Workshop with the team', onCommit: () => {}, preview: 'line' }} />);
    const line = screen.getByText('Workshop with the team');
    expect(line).toHaveAttribute('data-note-preview');
    expect(line).toHaveClass('truncate');
    expect(screen.getByRole('button', { name: 'Edit note for Monday' })).toHaveAccessibleDescription('Workshop with the team');
  });

  it('preview indicator: marks the button, keeps the text for screen readers and shows it in a tooltip on focus', async () => {
    const { container } = inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Workshop', onCommit: () => {}, preview: 'indicator' }} />);
    expect(container.querySelector('[data-note-indicator]')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Edit note for Monday' });
    expect(button).toHaveAccessibleDescription('Workshop');
    await userEvent.tab();
    await userEvent.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Workshop');
  });

  it('shows no preview by default and none without a note text', () => {
    const { container } = inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Workshop', onCommit: () => {} }} />);
    expect(container.querySelector('[data-note-preview]')).toBeNull();
    expect(container.querySelector('[data-note-indicator]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit note for Monday' })).not.toHaveAttribute('aria-describedby');
  });
});

describe('TableEditCell note and navigation additions (0.21)', () => {
  type CellOverrides = Partial<React.ComponentProps<typeof TableEditCell>>;
  const Grid = ({ rows = 2, note, cell, skipFirst = false }: { rows?: number; note?: Partial<NonNullable<CellOverrides['note']>>; cell?: CellOverrides; skipFirst?: boolean }) => (
    <Table>
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r}>
            {[0, 1, 2].map((c) => (
              <TableEditCell
                key={c}
                mode="always"
                label={`R${r}C${c}`}
                value=""
                data-edit-skip={skipFirst && c === 1 ? '' : undefined}
                note={c === 0 ? { value: '', onCommit: () => {}, ...note } : undefined}
                {...(c === 0 ? cell : { nextCellOnEnter: cell?.nextCellOnEnter, wrapRows: cell?.wrapRows, isCellNavigable: cell?.isCellNavigable })}
              />
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  const field = (name: string) => screen.getByRole('textbox', { name });

  describe('renderPreview', () => {
    it('shows custom content under the input, even without a note, and describes the note button with it', () => {
      inRow(<TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: () => {}, renderPreview: () => '09:00-11:30' }} />);
      const preview = screen.getByText('09:00-11:30');
      expect(preview).toHaveAttribute('data-note-preview');
      expect(screen.getByRole('button', { name: 'Add note for Monday' })).toHaveAttribute('aria-describedby', preview.id);
    });

    it('receives the committed note, replaces the line preview and shows nothing for null or false', () => {
      const renderPreview = vi.fn((note: string) => (note ? `Note: ${note}` : null));
      const { rerender } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableEditCell mode="always" label="Monday" value="4" note={{ value: 'Workshop', onCommit: () => {}, preview: 'line', renderPreview }} />
            </TableRow>
          </TableBody>
        </Table>,
      );
      expect(renderPreview).toHaveBeenCalledWith('Workshop');
      expect(screen.getByText('Note: Workshop')).toBeInTheDocument();
      expect(screen.queryByText('Workshop')).not.toBeInTheDocument();
      rerender(
        <Table>
          <TableBody>
            <TableRow>
              <TableEditCell mode="always" label="Monday" value="4" note={{ value: '', onCommit: () => {}, preview: 'line', renderPreview }} />
            </TableRow>
          </TableBody>
        </Table>,
      );
      expect(document.querySelector('[data-note-preview]')).toBeNull();
    });
  });

  describe('open state', () => {
    it('opens the editor from the consumer without a note and reports closing', async () => {
      const onOpenChange = vi.fn();
      const Host = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableEditCell
                  mode="always"
                  label="Hours"
                  value=""
                  inputProps={{
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        setOpen(true);
                      }
                    },
                  }}
                  note={{ value: '', onCommit: () => {}, open, onOpenChange: (next) => { onOpenChange(next); setOpen(next); } }}
                />
              </TableRow>
            </TableBody>
          </Table>
        );
      };
      render(<Host />);
      await userEvent.type(field('Hours'), '{Enter}');
      expect(await screen.findByRole('textbox', { name: 'Note for Hours' })).toHaveFocus();
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.queryByRole('textbox', { name: 'Note for Hours' })).not.toBeInTheDocument();
    });

    it('commits the draft when the consumer closes a controlled editor', async () => {
      const onNote = vi.fn();
      const make = (open: boolean) => (
        <Table>
          <TableBody>
            <TableRow>
              <TableEditCell mode="always" label="Hours" value="" note={{ value: '', onCommit: onNote, open }} />
            </TableRow>
          </TableBody>
        </Table>
      );
      const { rerender } = render(make(true));
      await userEvent.type(await screen.findByRole('textbox', { name: 'Note for Hours' }), 'Kept');
      rerender(make(false));
      expect(onNote).toHaveBeenCalledWith('Kept');
    });

    it('starts open with defaultOpen', async () => {
      inRow(<TableEditCell mode="always" label="Hours" value="" note={{ value: '', onCommit: () => {}, defaultOpen: true }} />);
      expect(await screen.findByRole('textbox', { name: 'Note for Hours' })).toBeInTheDocument();
    });
  });

  describe('Enter navigation', () => {
    it('skips cells marked data-edit-skip', async () => {
      render(<Grid skipFirst cell={{ nextCellOnEnter: 'right' }} />);
      await userEvent.type(field('R0C0'), '{Enter}');
      expect(field('R0C2')).toHaveFocus();
    });

    it('skips cells the consumer rejects and disabled inputs', async () => {
      const isCellNavigable = vi.fn((cell: HTMLTableCellElement) => cell.cellIndex !== 1);
      render(<Grid cell={{ nextCellOnEnter: 'right', isCellNavigable }} />);
      await userEvent.type(field('R0C0'), '{Enter}');
      expect(field('R0C2')).toHaveFocus();
      expect(isCellNavigable).toHaveBeenCalled();
    });

    it('skips disabled inputs downwards', async () => {
      render(
        <Table>
          <TableBody>
            {['a', 'b', 'c'].map((r) => (
              <TableRow key={r}>
                <TableEditCell mode="always" label={`Row ${r}`} value="" disabled={r === 'b'} />
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      );
      await userEvent.type(field('Row a'), '{Enter}');
      expect(field('Row c')).toHaveFocus();
    });

    it('wraps to the next row by default and stops at the row end with wrapRows={false}', async () => {
      const onNavigate = vi.fn();
      const { unmount } = render(<Grid cell={{ nextCellOnEnter: 'right', onNavigate }} />);
      await userEvent.click(field('R0C2'));
      await userEvent.keyboard('{Enter}');
      expect(field('R1C0')).toHaveFocus();
      unmount();
      const stop = vi.fn();
      render(<Grid cell={{ nextCellOnEnter: 'right', wrapRows: false, onNavigate: stop }} />);
      await userEvent.click(field('R0C2'));
      await userEvent.keyboard('{Enter}');
      expect(field('R0C2')).toHaveFocus();
      // The row end is reported by the last cell, which has no navigation props of its own, so the first cell proves the move still works.
      await userEvent.click(field('R0C0'));
      await userEvent.keyboard('{Enter}');
      expect(field('R0C1')).toHaveFocus();
      expect(stop).toHaveBeenLastCalledWith('right', true);
    });

    it('reports moved false at the row end with wrapRows={false}', async () => {
      const onNavigate = vi.fn();
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableEditCell mode="always" label="A" value="" nextCellOnEnter="right" wrapRows={false} onNavigate={onNavigate} />
            </TableRow>
            <TableRow>
              <TableEditCell mode="always" label="B" value="" />
            </TableRow>
          </TableBody>
        </Table>,
      );
      await userEvent.type(field('A'), '{Enter}');
      expect(field('A')).toHaveFocus();
      expect(onNavigate).toHaveBeenLastCalledWith('right', false);
    });
  });

  describe('initialFocus', () => {
    const slot = ({ label }: { label: string }) => <input aria-label={`From ${label}`} />;
    it('focuses the first render slot field by default', async () => {
      inRow(<TableEditCell mode="always" label="Monday" value="" note={{ value: 'Hi', onCommit: () => {}, render: slot }} />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit note for Monday' }));
      expect(await screen.findByRole('textbox', { name: 'From Monday' })).toHaveFocus();
    });

    it('focuses the note field with initialFocus="note", caret at the end', async () => {
      inRow(<TableEditCell mode="always" label="Monday" value="" note={{ value: 'Hi', onCommit: () => {}, render: slot, multiline: true, initialFocus: 'note' }} />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit note for Monday' }));
      const note = (await screen.findAllByRole('textbox', { name: 'Note for Monday' }))[0] as HTMLTextAreaElement;
      expect(note).toHaveFocus();
      expect(note.selectionStart).toBe(2);
    });
  });

  describe('submit', () => {
    const open = async (name = 'Add note for R0C0') => {
      await userEvent.click(screen.getByRole('button', { name }));
      return screen.findByRole('textbox', { name: 'Note for R0C0' });
    };

    it('Ctrl+Enter in a multi-line note commits, closes and moves to the next cell instead of the note button', async () => {
      const onNote = vi.fn();
      const onNavigate = vi.fn();
      render(<Grid note={{ onCommit: onNote, multiline: true }} cell={{ onNavigate }} />);
      await userEvent.type(await open(), 'one{Enter}two{Control>}{Enter}{/Control}');
      expect(onNote).toHaveBeenCalledWith('one\ntwo');
      expect(screen.queryByRole('textbox', { name: 'Note for R0C0' })).not.toBeInTheDocument();
      expect(field('R1C0')).toHaveFocus();
      expect(onNavigate).toHaveBeenLastCalledWith('down', true);
    });

    it('uses the same direction, skipping and Shift reversal as Enter in the cell', async () => {
      render(<Grid note={{ multiline: true }} cell={{ nextCellOnEnter: 'right' }} skipFirst />);
      await userEvent.type(await open(), 'x{Control>}{Enter}{/Control}');
      expect(field('R0C2')).toHaveFocus();
    });

    it('Enter in a single-line note navigates too', async () => {
      render(<Grid />);
      await userEvent.type(await open(), 'x{Enter}');
      expect(field('R1C0')).toHaveFocus();
    });

    it('falls back to the note button on the last row and reports it', async () => {
      const onNavigate = vi.fn();
      render(<Grid rows={1} note={{ multiline: true }} cell={{ onNavigate }} />);
      await userEvent.type(await open(), 'x{Meta>}{Enter}{/Meta}');
      await vi.waitFor(() => expect(screen.getByRole('button', { name: /note for R0C0/ })).toHaveFocus());
      expect(onNavigate).toHaveBeenLastCalledWith('down', false);
    });

    it('keeps the 0.20 behavior with submitNavigates={false}', async () => {
      render(<Grid note={{ multiline: true, submitNavigates: false }} />);
      await userEvent.type(await open(), 'x{Control>}{Enter}{/Control}');
      await vi.waitFor(() => expect(screen.getByRole('button', { name: /note for R0C0/ })).toHaveFocus());
    });

    it('keeps focus on the note button with nextCellOnEnter="none"', async () => {
      render(<Grid note={{ multiline: true }} cell={{ nextCellOnEnter: 'none' }} />);
      await userEvent.type(await open(), 'x{Control>}{Enter}{/Control}');
      await vi.waitFor(() => expect(screen.getByRole('button', { name: /note for R0C0/ })).toHaveFocus());
    });

    it('offers submit() to render slot fields', async () => {
      const onNote = vi.fn();
      render(
        <Grid
          note={{
            onCommit: onNote,
            render: ({ setDraft, submit }) => (
              <input
                aria-label="From"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
            ),
          }}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Add note for R0C0' }));
      await userEvent.type(await screen.findByRole('textbox', { name: 'From' }), '09:00{Enter}');
      expect(onNote).toHaveBeenCalledWith('09:00');
      expect(field('R1C0')).toHaveFocus();
    });
  });

  describe('Escape', () => {
    const typeThenEscape = async (note: object) => {
      const onNote = vi.fn();
      inRow(<TableEditCell mode="always" label="Monday" value="" note={{ value: '', onCommit: onNote, ...note }} />);
      await userEvent.click(screen.getByRole('button', { name: 'Add note for Monday' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Note for Monday' }), 'Typed{Escape}');
      return onNote;
    };

    it('commitOnChange flushes a draft that is still inside the delay window', async () => {
      const onNote = await typeThenEscape({ commitOnChange: true, commitDelay: 5000 });
      expect(onNote).toHaveBeenCalledTimes(1);
      expect(onNote).toHaveBeenCalledWith('Typed');
    });

    it('discards in the default mode without commitOnChange', async () => {
      const onNote = await typeThenEscape({});
      expect(onNote).not.toHaveBeenCalled();
    });

    it('escape="commit" keeps the draft without commitOnChange', async () => {
      const onNote = await typeThenEscape({ escape: 'commit' });
      expect(onNote).toHaveBeenCalledWith('Typed');
    });

    it('escape="discard" drops the pending draft even with commitOnChange, and keeps what was committed', async () => {
      const onNote = await typeThenEscape({ commitOnChange: true, commitDelay: 5000, escape: 'discard' });
      expect(onNote).not.toHaveBeenCalled();
    });
  });
});

describe('TableEditCell shiftEnter and note tabIndex', () => {
  const Grid = ({ shiftEnter, noteTabIndex }: { shiftEnter?: 'reverse' | 'same'; noteTabIndex?: number }) => (
    <Table>
      <TableBody>
        {[0, 1].map((r) => (
          <TableRow key={r}>
            <TableEditCell
              mode="always"
              label={`R${r}`}
              value=""
              onCommit={() => {}}
              shiftEnter={shiftEnter}
              note={{ value: '', onCommit: () => {}, tabIndex: noteTabIndex }}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  it('shiftEnter="same" moves down on Shift+Enter like Enter', async () => {
    render(<Grid shiftEnter="same" />);
    await userEvent.click(screen.getByRole('textbox', { name: 'R0' }));
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    expect(screen.getByRole('textbox', { name: 'R1' })).toHaveFocus();
  });

  it('shiftEnter defaults to reverse', async () => {
    render(<Grid />);
    await userEvent.click(screen.getByRole('textbox', { name: 'R1' }));
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    expect(screen.getByRole('textbox', { name: 'R0' })).toHaveFocus();
  });

  it('note.tabIndex -1 takes the note button out of the Tab order but keeps it clickable', async () => {
    render(<Grid noteTabIndex={-1} />);
    const button = screen.getAllByRole('button', { name: /note/i })[0];
    expect(button).toHaveAttribute('tabindex', '-1');
    await userEvent.click(screen.getByRole('textbox', { name: 'R0' }));
    await userEvent.tab();
    expect(button).not.toHaveFocus();
    await userEvent.click(button);
    expect(screen.getByRole('textbox', { name: /note/i })).toBeInTheDocument();
  });
});
