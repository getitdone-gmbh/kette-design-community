'use client';

import { Lock, MessageSquareText, Star } from 'lucide-react';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from './button';
import { Chip, type ChipProps } from './chip';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Progress, type ProgressProps } from './progress';
import { Textarea } from './textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch, type SwitchProps } from './switch';
import { markTableCell, TableCell, type TableCellProps } from './table';
import { useLabels } from './labels-context';

// Dedicated Figma Table cell styles (set 1222:107305): Trend positive|negative, Progress bar, Star ratings, Action icons, Payment method.
// Each wraps TableCell, so State=Selected/Active/Focused/Error/Disabled come from its props and Hover from the row.

export interface TableTrendCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  // Main figure shown before the chip, e.g. `$1,800`.
  value: React.ReactNode;
  // Change shown in the chip, e.g. `20%`.
  change: React.ReactNode;
  trend: 'positive' | 'negative';
}

// Figma Style=Trend positive|negative: figure in subtle text-small, then a dot chip in the success or error tone.
const TableTrendCell = React.forwardRef<HTMLTableCellElement, TableTrendCellProps>(
  ({ value, change, trend, className, ...props }, ref) => {
    const l = useLabels();
    return (
    <TableCell ref={ref} className={cn('px-6', className)} {...props}>
      <div className="flex items-center gap-3">
        <span className="typography-text-small text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">{value}</span>
        <Chip variant={trend === 'positive' ? 'success' : 'destructive'} size="small" dotLeading data-trend={trend}>
          <span className="sr-only">{trend === 'positive' ? l.trendUp : l.trendDown}</span>
          {change}
        </Chip>
      </div>
    </TableCell>
    );
  },
);
TableTrendCell.displayName = 'TableTrendCell';
markTableCell(TableTrendCell);

export interface TableProgressCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  value: number;
  max?: number;
  // Accessible name of the progress bar, e.g. the row name.
  label: string;
  variant?: ProgressProps['variant'];
}

// Figma Style=Progress bar: flexible 8px bar with the percentage on the right.
const TableProgressCell = React.forwardRef<HTMLTableCellElement, TableProgressCellProps>(
  ({ value, max, label, variant, className, ...props }, ref) => (
    <TableCell ref={ref} className={cn('px-6', className)} {...props}>
      <Progress value={value} max={max} variant={variant} label="right" aria-label={label} />
    </TableCell>
  ),
);
TableProgressCell.displayName = 'TableProgressCell';
markTableCell(TableProgressCell);

export interface TableRatingCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  // Filled stars, 0 to `max`.
  value: number;
  max?: number;
  // Accessible name prefix, default `Rating`.
  label?: string;
}

// Figma Style=Star ratings: five 20px stars, filled up to the value. Read only.
const TableRatingCell = React.forwardRef<HTMLTableCellElement, TableRatingCellProps>(
  ({ value, max = 5, label: labelProp, className, ...props }, ref) => {
    const l = useLabels();
    const label = labelProp ?? l.rating;
    const filled = Math.min(Math.max(Math.round(value), 0), max);
    return (
      <TableCell ref={ref} className={className} {...props}>
        <span role="img" aria-label={l.ratingOf(label, filled, max)} className="inline-flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              aria-hidden="true"
              data-filled={i < filled ? '' : undefined}
              className={cn('h-icon-md w-icon-md shrink-0', i < filled ? 'fill-current text-icon-warning' : 'text-icon-disabled')}
            />
          ))}
        </span>
      </TableCell>
    );
  },
);
TableRatingCell.displayName = 'TableRatingCell';
markTableCell(TableRatingCell);

export interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export interface TableActionsCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  actions: TableAction[];
}

// Figma Style=Action icons: ghost icon buttons (40px, 20px glyph). Every action needs a label for assistive tech.
const TableActionsCell = React.forwardRef<HTMLTableCellElement, TableActionsCellProps>(
  ({ actions, className, ...props }, ref) => {
    const l = useLabels();
    return (
    <TableCell ref={ref} className={className} {...props}>
      <div role="group" aria-label={l.rowActions} className={cn('flex items-center gap-1', props.align === 'right' && 'justify-end')}>
        {actions.map((a) => (
          <Button
            key={a.label}
            type="button"
            variant="ghost"
            size="no-size"
            aria-label={a.label}
            disabled={a.disabled || props.disabled}
            onClick={a.onClick}
            className="h-control-md w-control-md shrink-0 text-icon-subtle hover:text-icon-default [&>svg]:h-icon-md [&>svg]:w-icon-md"
          >
            {a.icon}
          </Button>
        ))}
      </div>
    </TableCell>
  );
  },
);
TableActionsCell.displayName = 'TableActionsCell';
markTableCell(TableActionsCell, 'hidden');

export interface TablePaymentCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  // Card or bank logo slot, e.g. an inline SVG. Decorative: the name identifies the method.
  icon: React.ReactNode;
  name: React.ReactNode;
  supportingText?: React.ReactNode;
}

// Figma Style=Payment method: 46x32 method icon, then title and supporting line.
const TablePaymentCell = React.forwardRef<HTMLTableCellElement, TablePaymentCellProps>(
  ({ icon, name, supportingText, className, ...props }, ref) => (
    <TableCell ref={ref} className={cn('px-6', className)} {...props}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="inline-flex h-control-md w-12 shrink-0 items-center justify-center overflow-hidden rounded-item border border-solid border-border-default bg-background">
          {icon}
        </span>
        <span className="flex flex-col items-start typography-text-small">
          <span className="text-text-default">{name}</span>
          {supportingText && <span className="text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">{supportingText}</span>}
        </span>
      </div>
    </TableCell>
  ),
);
TablePaymentCell.displayName = 'TablePaymentCell';
markTableCell(TablePaymentCell);

export interface TableLockTextCellProps extends Omit<TableCellProps, 'tag'> {
  // Text after the lock, e.g. `Required, cannot be turned off`.
  children: React.ReactNode;
}

// Figma Style=Lock text: lock glyph (icon-xs, subtle) and a subtle extra-small text, gap space/1.
const TableLockTextCell = React.forwardRef<HTMLTableCellElement, TableLockTextCellProps>(({ children, className, ...props }, ref) => (
  <TableCell ref={ref} className={className} {...props}>
    <span className="inline-flex items-center gap-1">
      <Lock aria-hidden="true" data-slot="lock" className="h-icon-xs w-icon-xs shrink-0 text-icon-subtle" />
      <span className="typography-text-extra-small text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">{children}</span>
    </span>
  </TableCell>
));
TableLockTextCell.displayName = 'TableLockTextCell';
markTableCell(TableLockTextCell);

export interface TableToggleCellProps
  extends Omit<TableCellProps, 'children' | 'tag' | 'onChange'>,
    Pick<SwitchProps, 'checked' | 'defaultChecked' | 'onCheckedChange' | 'readOnly' | 'name' | 'size'> {
  // Accessible name of the switch, e.g. `Email notifications for Alex`.
  label: string;
}

// Figma Toggle only cell: a switch (controlled via `checked` + `onCheckedChange`, or uncontrolled via `defaultChecked`). A disabled cell disables the switch.
const TableToggleCell = React.forwardRef<HTMLTableCellElement, TableToggleCellProps>(
  ({ label, checked, defaultChecked, onCheckedChange, readOnly, name, size = 'sm', className, ...props }, ref) => (
    <TableCell ref={ref} className={className} {...props}>
      <Switch
        aria-label={label}
        size={size}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        disabled={props.disabled}
      />
    </TableCell>
  ),
);
TableToggleCell.displayName = 'TableToggleCell';
markTableCell(TableToggleCell, 'hidden');

export interface TableButtonCellProps extends Omit<TableCellProps, 'children' | 'tag' | 'onClick'> {
  // Visible button text, e.g. `Open`.
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  // Outline is the Figma default, ghost is the quiet alternative.
  variant?: Extract<ButtonProps['variant'], 'outline' | 'ghost'>;
  // Accessible name when the visible text alone is ambiguous across rows, e.g. `Open Nordwind Handel GmbH`.
  'aria-label'?: string;
}

// Figma Style=Button: outlined small button. A disabled cell disables the button.
const TableButtonCell = React.forwardRef<HTMLTableCellElement, TableButtonCellProps>(
  ({ children, onClick, variant = 'outline', 'aria-label': ariaLabel, className, ...props }, ref) => (
    <TableCell ref={ref} className={className} {...props}>
      <Button type="button" variant={variant} size="sm" aria-label={ariaLabel} disabled={props.disabled} onClick={onClick}>
        {children}
      </Button>
    </TableCell>
  ),
);
TableButtonCell.displayName = 'TableButtonCell';
markTableCell(TableButtonCell, 'hidden');

export interface TableSelectCellOption {
  value: string;
  label: React.ReactNode;
}

export interface TableSelectCellProps extends Omit<TableCellProps, 'children' | 'tag' | 'onChange' | 'defaultValue'> {
  options: TableSelectCellOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  // Accessible name of the dropdown, e.g. `Level for Spanish`. Required: the cell has no visible label.
  label: string;
  name?: string;
}

// Figma Style=Select: a compact dropdown in the cell, no label or hint. A disabled cell disables the dropdown. An invalid cell marks it invalid.
const TableSelectCell = React.forwardRef<HTMLTableCellElement, TableSelectCellProps>(
  ({ options, value, defaultValue, onValueChange, placeholder, label, name, className, ...props }, ref) => (
    <TableCell ref={ref} className={className} {...props}>
      <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange} name={name} disabled={props.disabled}>
        <SelectTrigger compact aria-label={label} aria-invalid={props.invalid || undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
  ),
);
TableSelectCell.displayName = 'TableSelectCell';
markTableCell(TableSelectCell);

export interface TableLeadBadgeCellProps extends Omit<TableCellProps, 'tag'> {
  // Title text of the row, e.g. a notification name.
  children: React.ReactNode;
  // Chip text after the title, e.g. `New` or `Required`.
  badge?: string;
  // Chip tone. Blue is `info` (default), the warning tone suits `Required`.
  badgeVariant?: Extract<ChipProps['variant'], 'info' | 'warning' | 'success' | 'destructive'>;
  // Subtle line under the title.
  supportingText?: React.ReactNode;
}

// Figma Style=Lead text badge: medium title with a small tinted chip, then an optional subtle supporting line.
const TableLeadBadgeCell = React.forwardRef<HTMLTableCellElement, TableLeadBadgeCellProps>(
  ({ children, badge, badgeVariant = 'info', supportingText, className, ...props }, ref) => (
    <TableCell ref={ref} className={className} {...props}>
      <div className="flex flex-col items-start">
        <span className="inline-flex items-center gap-2">
          <span className="typography-ui-medium text-text-default">{children}</span>
          {badge ? <Chip size="small" variant={badgeVariant} tinted label={badge} /> : null}
        </span>
        {supportingText ? <span className="typography-text-extra-small text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">{supportingText}</span> : null}
      </div>
    </TableCell>
  ),
);
TableLeadBadgeCell.displayName = 'TableLeadBadgeCell';
markTableCell(TableLeadBadgeCell);

export interface TableEditCellProps extends Omit<TableCellProps, 'children' | 'tag' | 'onChange' | 'defaultValue'> {
  // Committed value shown in display mode.
  value: string;
  // Name of the field, used for the accessible names of the display button and the input, e.g. `Name`.
  label: string;
  // Called with the draft when Enter or blur saves a changed value.
  onCommit?: (value: string) => void;
  // Called when Escape or a no-op leaves edit mode without saving.
  onCancel?: () => void;
  // Shown in display mode when the value is empty.
  placeholder?: string;
  // Controlled edit mode. Omit it to let the cell manage the mode itself.
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  // Text shown under the input while the draft is invalid. Sets the cell to the error state.
  errorMessage?: string;
  // Native input attributes for the editor, e.g. `inputMode`, `maxLength`, `type`.
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'aria-label'>;
  // `click` (default) shows the value as a button that opens an input. `always` renders a typeable input at all times, for entry grids such as time sheets. `editing`, `defaultEditing`, `onEditingChange` and `onCancel` do nothing in `always` mode.
  mode?: 'click' | 'always';
  // `always` mode: also commit this many ms after the last keystroke. Omit to commit on blur and Enter only.
  commitDelay?: number;
  // `always` mode: where Enter moves focus after committing. Shift+Enter moves the opposite way. `none` keeps focus. Default `down`.
  nextCellOnEnter?: TableEditCellDirection | 'none';
  // `always` mode: what Shift+Enter does. `reverse` (default) moves the opposite way, `same` behaves like Enter.
  shiftEnter?: 'reverse' | 'same';
  // `always` mode: called after Enter with the direction used and whether a next editable cell took focus. When `moved` is false the cell was the last one, so the consumer can add a row.
  onNavigate?: (direction: TableEditCellDirection, moved: boolean) => void;
  // `always` mode: decides per candidate cell whether Enter may land there. Return false to skip it, e.g. a read-only total or a derived column. Cells with a `data-edit-skip` attribute and disabled inputs are always skipped.
  isCellNavigable?: (cell: HTMLTableCellElement, target: HTMLElement) => boolean;
  // `always` mode: whether left and right continue in the next or previous row at the row end. `false` stops at the row end and reports `moved: false` to `onNavigate`. Up and down are not affected. Default `true`.
  wrapRows?: boolean;
  // `always` mode: small secondary note editor in a popover next to the input.
  note?: TableEditCellNote;
}

export type TableEditCellDirection = 'down' | 'up' | 'right' | 'left';

export interface TableEditCellNote {
  // Committed note.
  value?: string;
  // Called with the note when the popover field commits (Enter or blur) and the text changed.
  onCommit: (note: string) => void;
  // Controlled open state of the editor. Works without a note, e.g. to open it from Enter in the hours field: set it to true from the consumer's key handler. Omit it to let the cell manage the state.
  open?: boolean;
  // Initial open state when `open` is not controlled. Default false.
  defaultOpen?: boolean;
  // Called when the editor opens or closes, by the user or after a submit.
  onOpenChange?: (open: boolean) => void;
  // Where focus starts when the editor opens. `field` is the first field of the render slot (or the note field when there is no slot), `note` is the note field itself. Default `field`.
  initialFocus?: 'field' | 'note';
  // Ctrl or Cmd+Enter in the editor (and Enter in a single-line note) commits, closes and moves to the next cell like Enter in the cell does, with the same direction, skipping and row end rules. Shift reverses the direction. When there is no next cell, or `nextCellOnEnter` is `none`, focus returns to the note button. Set `false` for the 0.20 behavior (focus always returns to the note button). Default `true`.
  submitNavigates?: boolean;
  // What Escape does with a draft that was not committed yet. `commit` flushes it, so typing that was already visible is kept. `discard` closes and restores the last committed note. Default `commit` with `commitOnChange`, otherwise `discard`.
  escape?: 'discard' | 'commit';
  // Tab order of the note button. `-1` takes it out of the Tab sequence; it stays clickable and opens through the controlled `open`, e.g. from Enter in the field.
  tabIndex?: number;
  // Placeholder of the note field.
  placeholder?: string;
  // Native attributes for the note field, e.g. `maxLength`. With `multiline` they apply to the textarea.
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'aria-label'>;
  // Multi-line note in a textarea. Enter adds a line, Ctrl or Cmd+Enter commits and closes. Default single line (Enter commits and closes).
  multiline?: boolean;
  // Also commit while typing, `commitDelay` ms after the last keystroke, not only on close. Escape then only closes: what was already committed stays.
  commitOnChange?: boolean;
  // Debounce of `commitOnChange` in ms. Default 400.
  commitDelay?: number;
  // Shows the note inside the cell. `line` is a truncated line under the input, `indicator` a dot on the note button with the full text in a tooltip. Both also describe the note button for screen readers. Default `none`.
  preview?: 'none' | 'line' | 'indicator';
  // Custom preview content under the input, e.g. a From and To range like `09:00-11:30`. Called with the committed note on every render. Return null, undefined or false to show nothing. It replaces the `line` text, works with every `preview` value and also shows when the note is empty. It describes the note button for screen readers.
  renderPreview?: (note: string) => React.ReactNode;
  // Extra fields in the editor above the note field, e.g. From and To time inputs. The consumer owns their state and recalculates the cell value in its own callbacks. Keep the fields labelled; focus starts in the first one.
  render?: (context: TableEditCellNoteContext) => React.ReactNode;
}

export interface TableEditCellNoteContext {
  // Name of the cell, e.g. for labelling extra fields.
  label: string;
  // Current note draft and its setter, for fields that write into the note.
  draft: string;
  setDraft: (note: string) => void;
  // Commits the draft now when it changed.
  commit: () => void;
  // Commits and closes the editor. Focus returns to the note button.
  close: () => void;
  // Commits, closes and moves to the next cell like Enter in the cell. Falls back to the note button when there is no next cell.
  submit: () => void;
}

const EDIT_TARGET = '[data-table-edit-target]';

interface EditTargetOptions {
  isNavigable?: (cell: HTMLTableCellElement, target: HTMLElement) => boolean;
  wrapRows: boolean;
}

// Finds the next editable cell input in the table, wrapping to the next or previous row for left and right unless wrapRows is off. Skips cells marked data-edit-skip, disabled inputs and cells the consumer rejects.
const findNextEditTarget = (cell: HTMLTableCellElement, direction: TableEditCellDirection, { isNavigable, wrapRows }: EditTargetOptions): HTMLElement | null => {
  const row = cell.parentElement as HTMLTableRowElement | null;
  if (!row) return null;
  const column = cell.cellIndex;
  const inCell = (target: HTMLTableCellElement | undefined | null) => {
    if (!target || target.hasAttribute('data-edit-skip')) return null;
    const found = target.querySelector<HTMLElement>(EDIT_TARGET);
    if (!found || (found as HTMLInputElement).disabled) return null;
    if (isNavigable && !isNavigable(target, found)) return null;
    return found;
  };
  if (direction === 'down' || direction === 'up') {
    let next = (direction === 'down' ? row.nextElementSibling : row.previousElementSibling) as HTMLTableRowElement | null;
    while (next) {
      const found = inCell(next.cells?.[column]);
      if (found) return found;
      next = (direction === 'down' ? next.nextElementSibling : next.previousElementSibling) as HTMLTableRowElement | null;
    }
    return null;
  }
  const step = direction === 'right' ? 1 : -1;
  let current: HTMLTableRowElement | null = row;
  let index = column + step;
  while (current) {
    while (index >= 0 && index < current.cells.length) {
      const found = inCell(current.cells[index]);
      if (found) return found;
      index += step;
    }
    if (!wrapRows) return null;
    current = (step === 1 ? current.nextElementSibling : current.previousElementSibling) as HTMLTableRowElement | null;
    index = step === 1 ? 0 : (current?.cells.length ?? 0) - 1;
  }
  return null;
};

const reverseDirection: Record<TableEditCellDirection, TableEditCellDirection> = { down: 'up', up: 'down', right: 'left', left: 'right' };

const TableEditCellAlways = React.forwardRef<HTMLTableCellElement, TableEditCellProps>(
  ({ value, label, onCommit, placeholder, errorMessage, inputProps, disabled, invalid, focused, className, commitDelay, nextCellOnEnter = 'down', shiftEnter = 'reverse', onNavigate, isCellNavigable, wrapRows = true, note, mode: _mode, editing: _editing, defaultEditing: _defaultEditing, onEditingChange: _onEditingChange, onCancel: _onCancel, ...props }, ref) => {
    const l = useLabels();
    const [draft, setDraft] = React.useState(value);
    const [noteDraft, setNoteDraft] = React.useState(note?.value ?? '');
    const [noteOpenState, setNoteOpenState] = React.useState(note?.defaultOpen ?? false);
    const noteOpenControlled = note?.open !== undefined;
    const noteOpen = noteOpenControlled ? Boolean(note?.open) : noteOpenState;
    const [noteTipOpen, setNoteTipOpen] = React.useState(false);
    const noteDraftRef = React.useRef(note?.value ?? '');
    const noteSent = React.useRef(note?.value ?? '');
    const noteTimer = React.useRef<ReturnType<typeof setTimeout>>();
    const noteCancelled = React.useRef(false);
    const noteInputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    // Next cell input that takes focus once the popover has closed, instead of the note button.
    const noteHandoff = React.useRef<HTMLElement | null>(null);
    const noteSettled = React.useRef(false);
    const wasNoteOpen = React.useRef(noteOpen);
    const noteId = React.useId();
    const cellRef = React.useRef<HTMLTableCellElement | null>(null);
    const committed = React.useRef(value);
    const timer = React.useRef<ReturnType<typeof setTimeout>>();
    const errorId = React.useId();

    // A new committed value from outside replaces the draft.
    React.useEffect(() => {
      committed.current = value;
      setDraft(value);
    }, [value]);

    React.useEffect(() => {
      noteSent.current = note?.value ?? '';
      if (!noteOpen) {
        noteDraftRef.current = note?.value ?? '';
        setNoteDraft(note?.value ?? '');
      }
    }, [note?.value, noteOpen]);

    React.useEffect(
      () => () => {
        clearTimeout(timer.current);
        clearTimeout(noteTimer.current);
      },
      [],
    );

    const commit = (next: string) => {
      clearTimeout(timer.current);
      if (next === committed.current) return;
      committed.current = next;
      onCommit?.(next);
    };

    const hasError = Boolean(invalid || errorMessage);
    const noteText = note?.value ?? '';
    const commitNote = () => {
      clearTimeout(noteTimer.current);
      const next = noteDraftRef.current;
      if (next === noteSent.current) return;
      noteSent.current = next;
      note?.onCommit(next);
    };
    const changeNote = (next: string) => {
      noteDraftRef.current = next;
      setNoteDraft(next);
      clearTimeout(noteTimer.current);
      if (note?.commitOnChange) noteTimer.current = setTimeout(commitNote, note.commitDelay ?? 400);
    };
    const setNoteOpen = (next: boolean) => {
      if (!noteOpenControlled) setNoteOpenState(next);
      note?.onOpenChange?.(next);
    };
    // Closing keeps the draft (commit) or drops it (discard). Escape follows note.escape, every other way out commits.
    const settleNote = () => {
      noteSettled.current = true;
      if (noteCancelled.current) {
        clearTimeout(noteTimer.current);
        noteDraftRef.current = noteSent.current;
        setNoteDraft(noteSent.current);
      } else commitNote();
      noteCancelled.current = false;
    };
    const closeNote = () => {
      commitNote();
      noteSettled.current = true;
      setNoteOpen(false);
    };
    const escapeMode = note?.escape ?? (note?.commitOnChange ? 'commit' : 'discard');
    // The editor was closed from outside (controlled open): settle it like a user close, before the draft is reset to the committed note.
    React.useLayoutEffect(() => {
      if (wasNoteOpen.current && !noteOpen && !noteSettled.current) settleNote();
      if (noteOpen) noteSettled.current = false;
      wasNoteOpen.current = noteOpen;
    });

    const resolveNext = (shiftKey: boolean) => {
      if (nextCellOnEnter === 'none') return null;
      const direction = shiftKey && shiftEnter === 'reverse' ? reverseDirection[nextCellOnEnter] : nextCellOnEnter;
      const target = cellRef.current ? findNextEditTarget(cellRef.current, direction, { isNavigable: isCellNavigable, wrapRows }) : null;
      return { direction, target };
    };
    const focusTarget = (target: HTMLElement) => {
      target.focus();
      if (target instanceof HTMLInputElement) target.select();
    };
    // Commits, closes and hands focus to the next cell. Without a next cell focus returns to the note button.
    const submitNote = (shiftKey: boolean) => {
      commitNote();
      noteSettled.current = true;
      const next = note?.submitNavigates === false ? null : resolveNext(shiftKey);
      noteHandoff.current = next?.target ?? null;
      setNoteOpen(false);
      if (next) onNavigate?.(next.direction, Boolean(next.target));
    };
    const preview = note?.preview ?? 'none';
    const previewId = `${noteId}-preview`;
    const customPreview = note?.renderPreview?.(noteText);
    const hasCustomPreview = customPreview != null && customPreview !== false;
    const describesNote = hasCustomPreview || (Boolean(noteText) && preview !== 'none');

    return (
      <TableCell
        ref={(node) => {
          cellRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={className}
        disabled={disabled}
        focused={focused}
        invalid={hasError}
        data-mode="always"
        {...props}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <Input
              {...inputProps}
              compact
              data-table-edit-target=""
              value={draft}
              disabled={disabled}
              placeholder={placeholder}
              aria-label={label}
              aria-invalid={hasError || undefined}
              aria-describedby={errorMessage ? errorId : undefined}
              onChange={(event) => {
                const next = event.target.value;
                setDraft(next);
                clearTimeout(timer.current);
                if (commitDelay != null && commitDelay > 0) timer.current = setTimeout(() => commit(next), commitDelay);
              }}
              onFocus={inputProps?.onFocus}
              onBlur={(event) => {
                inputProps?.onBlur?.(event);
                commit(event.target.value);
              }}
              onKeyDown={(event) => {
                inputProps?.onKeyDown?.(event);
                if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                event.preventDefault();
                commit(draft);
                const next = resolveNext(event.shiftKey);
                if (!next) return;
                if (next.target) focusTarget(next.target);
                onNavigate?.(next.direction, Boolean(next.target));
              }}
            />
            {note ? (
              <TooltipProvider delayDuration={300}>
                <Popover
                  open={noteOpen}
                  onOpenChange={(next) => {
                    if (!next) settleNote();
                    setNoteOpen(next);
                  }}
                >
                  <Tooltip open={preview === 'indicator' && noteText !== '' && !noteOpen && noteTipOpen} onOpenChange={setNoteTipOpen}>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          tabIndex={note.tabIndex}
                          disabled={disabled}
                          data-has-note={noteText ? '' : undefined}
                          aria-label={noteText ? l.editNote(label) : l.addNote(label)}
                          aria-describedby={describesNote ? previewId : undefined}
                          className={cn(
                            'relative inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-control transition-colors',
                            'hover:bg-muted active:bg-muted-strong disabled:cursor-not-allowed disabled:opacity-disabled',
                            noteText ? 'text-icon-brand' : 'text-icon-subtle hover:text-icon-default',
                            focusRing,
                          )}
                        >
                          <MessageSquareText aria-hidden="true" className="h-icon-sm w-icon-sm" />
                          {preview === 'indicator' && noteText ? <span aria-hidden="true" data-note-indicator="" className="absolute right-0 top-0 h-2 w-2 rounded-full border border-solid border-background bg-current" /> : null}
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    {preview === 'indicator' && noteText ? (
                      <TooltipContent className="max-w-64 whitespace-pre-line break-words">
                        {noteText}
                      </TooltipContent>
                    ) : null}
                  </Tooltip>
                  <PopoverContent
                    align="end"
                    aria-label={l.noteField(label)}
                    className={cn('flex flex-col gap-2 p-3', note.render || note.multiline ? 'w-72' : 'w-64')}
                    onEscapeKeyDown={() => {
                      noteCancelled.current = escapeMode === 'discard';
                    }}
                    onOpenAutoFocus={(event) => {
                      if (note.initialFocus !== 'note' || !noteInputRef.current) return;
                      event.preventDefault();
                      const field = noteInputRef.current;
                      field.focus();
                      field.setSelectionRange?.(field.value.length, field.value.length);
                    }}
                    onCloseAutoFocus={(event) => {
                      const target = noteHandoff.current;
                      noteHandoff.current = null;
                      if (!target) return;
                      event.preventDefault();
                      focusTarget(target);
                    }}
                    onKeyDown={(event) => {
                      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
                      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        submitNote(event.shiftKey);
                      }
                    }}
                  >
                    {note.render?.({ label, draft: noteDraft, setDraft: changeNote, commit: commitNote, close: closeNote, submit: () => submitNote(false) })}
                    {note.multiline ? (
                      <Textarea
                        {...(note.inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        ref={noteInputRef as React.Ref<HTMLTextAreaElement>}
                        minRows={3}
                        value={noteDraft}
                        placeholder={note.placeholder}
                        aria-label={l.noteField(label)}
                        onChange={(event) => changeNote(event.target.value)}
                        onKeyDown={(event) => {
                          note.inputProps?.onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLInputElement>);
                        }}
                      />
                    ) : (
                      <Input
                        {...note.inputProps}
                        ref={noteInputRef as React.Ref<HTMLInputElement>}
                        compact
                        value={noteDraft}
                        placeholder={note.placeholder}
                        aria-label={l.noteField(label)}
                        onChange={(event) => changeNote(event.target.value)}
                        onKeyDown={(event) => {
                          note.inputProps?.onKeyDown?.(event);
                          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
                          if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
                            event.preventDefault();
                            submitNote(event.shiftKey);
                          }
                        }}
                      />
                    )}
                  </PopoverContent>
                </Popover>
              </TooltipProvider>
            ) : null}
          </div>
          {note && hasCustomPreview ? (
            <div id={previewId} data-note-preview="" data-note-preview-custom="" className="typography-text-extra-small truncate text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">
              {customPreview}
            </div>
          ) : null}
          {note && !hasCustomPreview && noteText && preview === 'line' ? (
            <p id={previewId} data-note-preview="" className="typography-text-extra-small truncate text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted">
              {noteText}
            </p>
          ) : null}
          {note && !hasCustomPreview && noteText && preview === 'indicator' ? (
            <span id={previewId} className="sr-only">
              {noteText}
            </span>
          ) : null}
          {errorMessage ? (
            <p id={errorId} className="typography-text-extra-small text-text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </TableCell>
    );
  },
);
TableEditCellAlways.displayName = 'TableEditCellAlways';

const TableEditCellClick = React.forwardRef<HTMLTableCellElement, TableEditCellProps>(
  ({ value, label, onCommit, onCancel, placeholder, editing: editingProp, defaultEditing = false, onEditingChange, errorMessage, inputProps, disabled, invalid, focused, className, mode: _mode, commitDelay: _commitDelay, nextCellOnEnter: _nextCellOnEnter, onNavigate: _onNavigate, isCellNavigable: _isCellNavigable, wrapRows: _wrapRows, note: _note, ...props }, ref) => {
    const l = useLabels();
    const controlled = editingProp !== undefined;
    const [innerEditing, setInnerEditing] = React.useState(defaultEditing);
    const editing = controlled ? editingProp : innerEditing;
    const [draft, setDraft] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const restoreFocus = React.useRef(false);
    const errorId = React.useId();

    const setEditing = (next: boolean) => {
      if (!controlled) setInnerEditing(next);
      onEditingChange?.(next);
    };

    React.useEffect(() => {
      if (editing) {
        setDraft(value);
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (restoreFocus.current) {
        restoreFocus.current = false;
        buttonRef.current?.focus();
      }
      // The draft only resets when edit mode opens or closes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    const finish = (save: boolean, refocus: boolean) => {
      if (!editing) return;
      restoreFocus.current = refocus;
      if (save && draft !== value) onCommit?.(draft);
      else onCancel?.();
      setEditing(false);
    };

    const hasError = Boolean(invalid || errorMessage);
    return (
      <TableCell ref={ref} className={className} disabled={disabled} focused={focused || editing} invalid={hasError} data-editing={editing || undefined} {...props}>
        {editing ? (
          <div className="flex min-w-0 flex-col gap-1">
            <Input
              {...inputProps}
              ref={inputRef}
              compact
              value={draft}
              aria-label={label}
              aria-invalid={hasError || undefined}
              aria-describedby={errorMessage ? errorId : undefined}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                inputProps?.onKeyDown?.(event);
                if (event.defaultPrevented) return;
                if (event.key === 'Enter') {
                  event.preventDefault();
                  finish(true, true);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  finish(false, true);
                }
              }}
              onBlur={(event) => {
                inputProps?.onBlur?.(event);
                finish(true, false);
              }}
            />
            {errorMessage ? (
              <p id={errorId} className="typography-text-extra-small text-text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            ref={buttonRef}
            type="button"
            data-table-edit-target=""
            disabled={disabled}
            aria-label={l.editCell(label, value || placeholder || '')}
            onClick={() => setEditing(true)}
            className={cn(
              'block w-full min-w-0 cursor-text truncate rounded-input text-left typography-text-small transition-colors hover:bg-muted disabled:cursor-not-allowed',
              focusRing,
              value ? 'text-text-default' : 'text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted',
            )}
          >
            {value || placeholder}
          </button>
        )}
      </TableCell>
    );
  },
);
TableEditCellClick.displayName = 'TableEditCellClick';

// Inline edit cell. Default `click` mode: the value as a button, Enter, Space or a click opens an input; Enter or blur saves, Escape cancels, focus returns to the cell button. `always` mode: a typeable input at all times that commits on blur, Enter or after `commitDelay`, moves focus on Enter and can carry a note editor.
const TableEditCell = React.forwardRef<HTMLTableCellElement, TableEditCellProps>((props, ref) =>
  props.mode === 'always' ? <TableEditCellAlways ref={ref} {...props} /> : <TableEditCellClick ref={ref} {...props} />,
);
TableEditCell.displayName = 'TableEditCell';
markTableCell(TableEditCell);

export {
  TableActionsCell,
  TableButtonCell,
  TableEditCell,
  TableLeadBadgeCell,
  TableLockTextCell,
  TablePaymentCell,
  TableProgressCell,
  TableRatingCell,
  TableSelectCell,
  TableToggleCell,
  TableTrendCell,
};
