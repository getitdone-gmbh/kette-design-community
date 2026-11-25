'use client';

import { format as formatDate } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { fieldHaloZero, focusRing, focusRingField, openRing, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLabels, useLocale, usePreset, type DesignSystemLocale } from '@/components/ui/labels-context';
// explicit file path; date-fns 2 has no exports map, so directory imports break Node ESM consumers (vitest, SSR)
import de from 'date-fns/locale/de/index.js';

export type { DateRange };

export type DatePickerMode = 'single' | 'range';
export type DatePickerValue = Date | DateRange | undefined;

export interface DatePickerPreset {
  label: string;
  // A date for single mode or a range for range mode.
  value: Date | DateRange;
}

// Token-driven day grid for react-day-picker (the plain Calendar keeps its own look).
export const datePickerCalendarClassNames = {
  months: 'flex flex-col gap-4 sm:flex-row',
  month: 'flex flex-col gap-3',
  caption: 'relative flex h-control-md items-center justify-center',
  caption_label: 'typography-ui-semibold text-foreground',
  nav: 'flex items-center',
  nav_button: cn(
    'inline-flex h-control-sm w-control-sm items-center justify-center rounded-item bg-transparent p-0 text-icon-subtle transition-colors hover:bg-muted hover:text-icon-default motion-reduce:transition-none',
    focusRing,
  ),
  nav_button_previous: 'absolute left-0',
  nav_button_next: 'absolute right-0',
  table: 'w-full border-collapse',
  head_row: 'flex',
  head_cell: 'h-calendar-cell w-calendar-cell typography-ui-medium font-normal text-text-subtle',
  row: 'mt-1 flex w-full',
  cell: 'relative h-calendar-cell w-calendar-cell p-0 text-center',
  day: cn(
    'inline-flex h-calendar-cell w-calendar-cell items-center justify-center rounded-full p-0 typography-ui text-foreground transition-colors hover:bg-muted motion-reduce:transition-none',
    focusRing,
  ),
  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
  day_today: 'border border-solid border-border-bold',
  day_outside: 'text-text-disabled',
  day_disabled: 'pointer-events-none text-text-disabled opacity-disabled',
  day_range_start: '',
  day_range_end: '',
  day_range_middle: '!rounded-none !bg-background-brand-subtle !text-foreground',
  day_hidden: 'invisible',
};

const isRange = (value: DatePickerValue): value is DateRange => value != null && !(value instanceof Date);

const defaultFormat = (date: Date, locale: DesignSystemLocale = 'en') =>
  locale === 'de' ? formatDate(date, 'd. MMM yyyy', { locale: de }) : formatDate(date, 'MMM d, yyyy');

export const formatDatePickerValue = (
  value: DatePickerValue,
  formatValue?: (date: Date) => string,
  locale: DesignSystemLocale = 'en',
): string | undefined => {
  const format = formatValue ?? ((date: Date) => defaultFormat(date, locale));
  if (value == null) return undefined;
  if (value instanceof Date) return format(value);
  if (!value.from) return undefined;
  return value.to ? `${format(value.from)} - ${format(value.to)}` : `${format(value.from)} -`;
};

export interface DatePickerPanelProps {
  mode?: DatePickerMode;
  value?: DatePickerValue;
  onValueChange?: (value: DatePickerValue) => void;
  presets?: DatePickerPreset[];
  // Months shown side by side. Defaults to 2 in range mode, 1 in single mode.
  numberOfMonths?: number;
  // Footer buttons. Provide `onApply` to show the Cancel / Apply row.
  onApply?: () => void;
  onCancel?: () => void;
  applyLabel?: string;
  cancelLabel?: string;
  disabledDays?: React.ComponentProps<typeof Calendar>['disabled'];
  fromDate?: Date;
  toDate?: Date;
  defaultMonth?: Date;
  // First day of the week in the grid, 0 Sunday to 6 Saturday (for example from the user's format settings). Unset keeps the locale rule (German weeks start on Monday).
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

// Figma "_Date picker menu": optional preset list, one or two month grids and an optional action row.
const DatePickerPanel = ({
  mode = 'single',
  value,
  onValueChange,
  presets,
  numberOfMonths,
  onApply,
  onCancel,
  applyLabel: applyLabelProp,
  cancelLabel: cancelLabelProp,
  disabledDays,
  fromDate,
  toDate,
  defaultMonth,
  weekStartsOn,
  className,
}: DatePickerPanelProps) => {
  const l = useLabels();
  const applyLabel = applyLabelProp ?? l.apply;
  const cancelLabel = cancelLabelProp ?? l.cancel;
  const months = numberOfMonths ?? (mode === 'range' ? 2 : 1);
  const calendarProps =
    mode === 'range'
      ? ({ mode: 'range', selected: isRange(value) ? value : undefined, onSelect: (next: DateRange | undefined) => onValueChange?.(next) } as const)
      : ({ mode: 'single', selected: value instanceof Date ? value : undefined, onSelect: (next: Date | undefined) => onValueChange?.(next) } as const);
  const start = defaultMonth ?? (value instanceof Date ? value : isRange(value) ? value.from : undefined);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex flex-col sm:flex-row">
        {presets && presets.length > 0 ? (
          <ul aria-label={l.presets} className="flex flex-row flex-wrap gap-1 border-b border-solid border-border-subtle p-3 sm:w-40 sm:flex-col sm:flex-nowrap sm:border-b-0 sm:border-r">
            {presets.map((preset) => (
              <li key={preset.label}>
                <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => onValueChange?.(preset.value)}>
                  {preset.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <Calendar
          {...(calendarProps as React.ComponentProps<typeof Calendar>)}
          numberOfMonths={months}
          showOutsideDays={false}
          defaultMonth={start}
          {...(weekStartsOn !== undefined ? { weekStartsOn } : {})}
          disabled={disabledDays}
          fromDate={fromDate}
          toDate={toDate}
          classNames={datePickerCalendarClassNames}
          className="p-3"
        />
      </div>
      {onApply ? (
        <div className="flex items-center justify-end gap-2 border-t border-solid border-border-subtle p-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" onClick={onApply}>
            {applyLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
DatePickerPanel.displayName = 'DatePickerPanel';

interface ValueProps {
  mode?: DatePickerMode;
  value?: DatePickerValue;
  defaultValue?: DatePickerValue;
  onValueChange?: (value: DatePickerValue) => void;
}

const useDateValue = ({ value, defaultValue, onValueChange }: ValueProps) => {
  const [inner, setInner] = React.useState<DatePickerValue>(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = (next: DatePickerValue) => {
    setInner(next);
    onValueChange?.(next);
  };
  return [current, set] as const;
};

const isComplete = (mode: DatePickerMode, value: DatePickerValue) => (mode === 'range' ? isRange(value) && Boolean(value.from && value.to) : value instanceof Date);

export interface DatePickerProps extends ValueProps, Omit<DatePickerPanelProps, 'value' | 'onValueChange' | 'onApply' | 'onCancel' | 'className' | 'mode'> {
  placeholder?: string;
  // Text format for the trigger. Receives each date.
  formatValue?: (date: Date) => string;
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  // Shows Cancel / Apply: picking only changes a draft until Apply.
  actions?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Figma "Date picker dropdown": field-like trigger that opens the picker panel in a popover.
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      mode = 'single',
      value,
      defaultValue,
      onValueChange,
      placeholder: placeholderProp,
      formatValue,
      disabled = false,
      invalid = false,
      readOnly = false,
      actions = false,
      open: openProp,
      onOpenChange,
      className,
      name,
      ...rest
    },
    ref,
  ) => {
    const l = useLabels();
    const locale = useLocale();
    const zero = usePreset() === 'zero';
    const placeholder = placeholderProp ?? l.selectDate;
    const [selected, setSelected] = useDateValue({ value, defaultValue, onValueChange });
    const [draft, setDraft] = React.useState<DatePickerValue>(selected);
    const [openInner, setOpenInner] = React.useState(false);
    const open = openProp ?? openInner;
    const setOpen = (next: boolean) => {
      if (next) setDraft(selected);
      setOpenInner(next);
      onOpenChange?.(next);
    };
    const { presets, numberOfMonths, disabledDays, fromDate, toDate, defaultMonth, weekStartsOn, ...ariaRest } = rest;
    const text = formatDatePickerValue(selected, formatValue, locale);

    const handleChange = (next: DatePickerValue) => {
      if (actions) {
        setDraft(next);
        return;
      }
      setSelected(next);
      if (isComplete(mode, next)) setOpen(false);
    };

    return (
      <Popover open={readOnly ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            data-readonly={readOnly || undefined}
            data-invalid={invalid || undefined}
            data-placeholder={text ? undefined : ''}
            className={cn(
              'flex w-full items-center gap-2 rounded-control border border-solid border-input bg-background text-left typography-input-text leading-normal text-foreground',
              // Zero: the md control height with the control padding and the halo focus, the other themes keep the 40px field.
              zero ? 'h-control-md px-control-px-sm py-0' : 'px-4 py-2',
              transitionBase,
              'hover:border-border-bold hover:shadow-field-hover',
              zero ? fieldHaloZero : [focusRingField, openRing],
              'data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/20 data-[invalid=true]:focus-visible:ring-destructive data-[invalid=true]:data-[state=open]:ring-destructive',
              'data-[placeholder]:text-text-subtle',
              'disabled:cursor-not-allowed disabled:opacity-disabled',
              readOnly && 'cursor-default bg-muted hover:border-input hover:shadow-none',
              className,
            )}
            {...ariaRest}
          >
            <CalendarIcon aria-hidden="true" className="h-icon-xs w-icon-xs shrink-0 text-icon-subtle" />
            <span className="min-w-0 flex-1 truncate">{text ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        {name ? <input type="hidden" name={name} value={text ?? ''} /> : null}
        <PopoverContent align="start" className="w-auto p-0">
          <DatePickerPanel
            mode={mode}
            value={actions ? draft : selected}
            onValueChange={handleChange}
            presets={presets}
            numberOfMonths={numberOfMonths}
            disabledDays={disabledDays}
            fromDate={fromDate}
            toDate={toDate}
            defaultMonth={defaultMonth}
            weekStartsOn={weekStartsOn}
            onApply={
              actions
                ? () => {
                    setSelected(draft);
                    setOpen(false);
                  }
                : undefined
            }
            onCancel={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = 'DatePicker';

export interface DatePickerModalProps extends ValueProps, Omit<DatePickerPanelProps, 'value' | 'onValueChange' | 'onApply' | 'onCancel' | 'className' | 'mode'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  onApply?: (value: DatePickerValue) => void;
}

// Figma "Date picker modal": the same panel in a dialog, for small screens. Cancel / Apply always shown.
const DatePickerModal = ({
  mode = 'single',
  value,
  defaultValue,
  onValueChange,
  open,
  onOpenChange,
  title: titleProp,
  description,
  onApply,
  ...panel
}: DatePickerModalProps) => {
  const l = useLabels();
  const title = titleProp ?? l.selectDate;
  const [selected, setSelected] = useDateValue({ value, defaultValue, onValueChange });
  const [draft, setDraft] = React.useState<DatePickerValue>(selected);
  React.useEffect(() => {
    if (open) setDraft(selected);
    // The draft restarts from the committed value each time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto max-w-full gap-0 p-0 sm:max-w-fit">
        <DialogHeader className="p-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DialogDescription>
        </DialogHeader>
        <DatePickerPanel
          {...panel}
          mode={mode}
          value={draft}
          onValueChange={setDraft}
          onApply={() => {
            setSelected(draft);
            onApply?.(draft);
            onOpenChange?.(false);
          }}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
DatePickerModal.displayName = 'DatePickerModal';

export { DatePicker, DatePickerModal, DatePickerPanel };
