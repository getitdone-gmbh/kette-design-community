import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { CreditCard, Download, Pencil, Trash2 } from 'lucide-react';

import { Chip } from './chip';
import { Input } from './input';
import { Label } from './label';
import { Table, TableBadgeCell, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableLeadCell, TableRow } from './table';
import { TableEditCell, TableLeadBadgeCell, TableSelectCell, TableActionsCell, TableButtonCell, TableLockTextCell, TableToggleCell, TablePaymentCell, TableProgressCell, TableRatingCell, TableTrendCell } from './table-cells';

const meta = {
  id: 'patterns-table-cells',
  title: 'Patterns · Data/Table cells',
  component: TableTrendCell,
  tags: ['autodocs'],
} satisfies Meta<typeof TableTrendCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ name, ...state }: { name: string; selected?: boolean; disabled?: boolean }) => (
  <TableRow selected={state.selected}>
    <TableLeadCell name={name} {...state} />
    <TableTrendCell value="$1,800" change="20%" trend="positive" rowHeight="two-line" {...state} />
    <TableProgressCell value={60} label={`${name} progress`} rowHeight="two-line" {...state} />
    <TableRatingCell value={4} rowHeight="two-line" {...state} />
    <TablePaymentCell icon={<CreditCard className="h-icon-md w-icon-md" />} name="Visa ending in 1234" supportingText="Expiry 06/2024" rowHeight="two-line" {...state} />
    <TableActionsCell
      rowHeight="two-line"
      actions={[
        { label: `Edit ${name}`, icon: <Pencil /> },
        { label: `Download ${name}`, icon: <Download /> },
        { label: `Delete ${name}`, icon: <Trash2 /> },
      ]}
      {...state}
    />
  </TableRow>
);

export const Default: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => (
    <Table>
      <TableCaption>Accounts with every dedicated cell style</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Row name="Default" />
        <Row name="Selected" selected />
        <Row name="Disabled" disabled />
      </TableBody>
    </Table>
  ),
};

export const Negative: Story = {
  args: { value: '$900', change: '5%', trend: 'negative' },
  render: (args) => (
    <Table>
      <TableBody>
        <TableRow>
          <TableTrendCell {...args} />
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// Figma Style=Lock text, Toggle only, Button and Badge cells.
export const NotificationCells: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => (
    <Table>
      <TableCaption>Notification settings with lock, toggle, button and badge cells</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Channel</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableLeadCell name="Security alerts" />
          <TableLockTextCell>Required, cannot be turned off</TableLockTextCell>
          <TableBadgeCell><Chip variant="outline" size="small" dotLeading dotColor="bg-general-success-default">Active</Chip></TableBadgeCell>
          <TableButtonCell aria-label="Open Security alerts">Open</TableButtonCell>
        </TableRow>
        <TableRow>
          <TableLeadCell name="Product updates" />
          <TableToggleCell label="Email for Product updates" defaultChecked />
          <TableBadgeCell><Chip variant="outline" size="small" dotLeading dotColor="bg-general-warning-default">Paused</Chip></TableBadgeCell>
          <TableButtonCell aria-label="Open Product updates">Open</TableButtonCell>
        </TableRow>
        <TableRow>
          <TableLeadCell name="Digest" disabled />
          <TableToggleCell label="Email for Digest" disabled />
          <TableBadgeCell disabled><Chip variant="outline" size="small" dotLeading disabled>Off</Chip></TableBadgeCell>
          <TableButtonCell disabled aria-label="Open Digest">Open</TableButtonCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

const EditableRows = () => {
  const [names, setNames] = React.useState(['Acme GmbH', 'Globex', '']);
  return (
    <Table>
      <TableCaption>Click a name or press Enter to edit. Enter saves, Escape cancels.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {names.map((name, index) => (
          <TableRow key={index}>
            <TableEditCell
              label="Name"
              value={name}
              placeholder="Add name"
              errorMessage={undefined}
              onCommit={(next) => setNames((all) => all.map((n, i) => (i === index ? next : n)))}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Inline edit cell: display value, Enter or click to edit, Enter saves, Escape cancels.
export const EditCell: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => <EditableRows />,
};

export const EditCellInvalid: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => (
    <Table>
      <TableCaption>Cell in edit mode with a validation error</TableCaption>
      <TableBody>
        <TableRow>
          <TableEditCell label="Name" value="A" defaultEditing errorMessage="Use at least 2 characters" />
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// Figma Style=Select and Style=Lead text badge.
export const SelectAndLeadBadge: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => (
    <Table>
      <TableCaption>Language levels and notification names with a lead badge</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Notification</TableHead>
          <TableHead>Level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableLeadBadgeCell badge="New" supportingText="Sent when a demand is created">
            New demand
          </TableLeadBadgeCell>
          <TableSelectCell
            label="Level for English"
            defaultValue="c1"
            options={[
              { value: 'b2', label: 'B2' },
              { value: 'c1', label: 'C1' },
              { value: 'native', label: 'Native' },
            ]}
          />
        </TableRow>
        <TableRow>
          <TableLeadBadgeCell badge="Required" badgeVariant="warning">
            Security alerts
          </TableLeadBadgeCell>
          <TableSelectCell label="Level for Spanish" placeholder="Choose level" options={[{ value: 'b2', label: 'B2' }]} />
        </TableRow>
        <TableRow disabled>
          <TableLeadBadgeCell disabled>Digest</TableLeadBadgeCell>
          <TableSelectCell disabled label="Level for French" defaultValue="b2" options={[{ value: 'b2', label: 'B2' }]} />
        </TableRow>
      </TableBody>
    </Table>
  ),
};

const times = [
  ['Website relaunch', '4', '6'],
  ['Mobile app', '2', ''],
  ['Maintenance', '', '1'],
];

const AlwaysEditableGrid = () => {
  const [rows, setRows] = React.useState(times);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const setCell = (r: number, c: number, value: string) => setRows((all) => all.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row)));
  return (
    <Table>
      <TableCaption>Always editable: type directly, Enter saves and moves down (Shift+Enter up). Notes open from the note button.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Mon (h)</TableHead>
          <TableHead>Tue (h)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, r) => (
          <TableRow key={row[0]}>
            <TableCell>{row[0]}</TableCell>
            {[1, 2].map((c) => (
              <TableEditCell
                key={c}
                mode="always"
                label={`${row[0]} ${c === 1 ? 'Monday' : 'Tuesday'}`}
                value={row[c]}
                placeholder="0"
                commitDelay={600}
                inputProps={{ inputMode: 'decimal' }}
                onCommit={(next) => setCell(r, c, next)}
                note={{ value: notes[`${r}-${c}`], onCommit: (note) => setNotes((all) => ({ ...all, [`${r}-${c}`]: note })), placeholder: 'What did you do?' }}
              />
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Time-tracking grid: inputs are always rendered, saved on blur, Enter or after a pause, with an inline note per cell.
export const EditCellAlways: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => <AlwaysEditableGrid />,
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

type Slot = { from: string; to: string; note: string };

// Hours are derived from the From and To fields of the note editor.
const hoursOf = (from: string, to: string) => {
  const a = toMinutes(from);
  const b = toMinutes(to);
  return a == null || b == null || b <= a ? '' : String(Math.round(((b - a) / 60) * 100) / 100);
};

const NoteEditorGrid = () => {
  const [slots, setSlots] = React.useState<Record<string, Slot>>({
    mon: { from: '09:00', to: '12:30', note: 'Workshop with the team\nPrepared the agenda' },
    tue: { from: '', to: '', note: '' },
  });
  const update = (day: string, patch: Partial<Slot>) => setSlots((all) => ({ ...all, [day]: { ...all[day], ...patch } }));
  const hours = (day: string) => hoursOf(slots[day].from, slots[day].to);
  return (
    <Table>
      <TableCaption>
        Note editor: Enter or Space on the note button opens it. The note is multi-line (Enter adds a line, Ctrl or Cmd+Enter saves, closes and moves to the next cell, Escape keeps what was typed), saves while typing after a short pause, and shows the From and To range under the hours via renderPreview. The From and To fields come from the render slot and recalculate the hours.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Mon (h)</TableHead>
          <TableHead>Tue (h)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Website relaunch</TableCell>
          {(['mon', 'tue'] as const).map((day) => (
            <TableEditCell
              key={day}
              mode="always"
              label={`Website relaunch ${day === 'mon' ? 'Monday' : 'Tuesday'}`}
              value={hours(day)}
              placeholder="0"
              inputProps={{ inputMode: 'decimal' }}
              onCommit={() => undefined}
              note={{
                value: slots[day].note,
                onCommit: (note) => update(day, { note }),
                placeholder: 'What did you do?',
                multiline: true,
                commitOnChange: true,
                commitDelay: 500,
                preview: 'line',
                initialFocus: 'note',
                renderPreview: () => (slots[day].from && slots[day].to ? `${slots[day].from}-${slots[day].to}` : null),
                render: ({ label }) => (
                  <div className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <Label htmlFor={`${day}-from`}>From</Label>
                      <Input id={`${day}-from`} compact type="time" aria-label={`From, ${label}`} value={slots[day].from} onChange={(event) => update(day, { from: event.target.value })} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <Label htmlFor={`${day}-to`}>To</Label>
                      <Input id={`${day}-to`} compact type="time" aria-label={`To, ${label}`} value={slots[day].to} onChange={(event) => update(day, { to: event.target.value })} />
                    </div>
                  </div>
                ),
              }}
            />
          ))}
        </TableRow>
        <TableRow>
          <TableCell>Maintenance (indicator preview)</TableCell>
          <TableEditCell mode="always" label="Maintenance Monday" value="1" note={{ value: 'Patched the build server', onCommit: () => undefined, preview: 'indicator' }} />
          <TableEditCell mode="always" label="Maintenance Tuesday" value="" note={{ value: '', onCommit: () => undefined, preview: 'indicator' }} />
        </TableRow>
      </TableBody>
    </Table>
  );
};

// Note editor options: `multiline`, `commitOnChange` with `commitDelay`, `preview` ('none' | 'line' | 'indicator'), `renderPreview` for custom cell content, `initialFocus`, `submitNavigates`, `escape` and the `render` slot for extra fields such as From and To.
export const EditCellNoteEditor: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => <NoteEditorGrid />,
};

const KeyboardEntryGrid = () => {
  const [openRow, setOpenRow] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState<Record<number, string>>({});
  const projects = ['Website relaunch', 'Mobile app', 'Maintenance'];
  return (
    <Table>
      <TableCaption>
        Keyboard entry: Enter in the hours field opens the note (controlled open), Ctrl or Cmd+Enter in the note saves and moves on to the next hours field. The total column is skipped with data-edit-skip, and right and left stop at the row end.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((name, r) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableEditCell
              mode="always"
              label={`${name} hours`}
              value=""
              placeholder="0"
              wrapRows={false}
              inputProps={{
                inputMode: 'decimal',
                onKeyDown: (event) => {
                  if (event.key !== 'Enter' || event.shiftKey) return;
                  event.preventDefault();
                  setOpenRow(r);
                },
              }}
              note={{
                value: notes[r],
                onCommit: (note) => setNotes((all) => ({ ...all, [r]: note })),
                placeholder: 'What did you do?',
                multiline: true,
                initialFocus: 'note',
                open: openRow === r,
                onOpenChange: (open) => setOpenRow(open ? r : null),
              }}
            />
            <TableCell data-edit-skip="">0</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Entry grid driven by the keyboard: `note.open` and `onOpenChange` open the editor from the hours field, `initialFocus="note"` starts in the note, `submitNavigates` moves on, `data-edit-skip`, `isCellNavigable` and `wrapRows` shape the Enter navigation.
export const EditCellKeyboardEntry: Story = {
  args: { value: '$1,800', change: '20%', trend: 'positive' },
  render: () => <KeyboardEntryGrid />,
};
