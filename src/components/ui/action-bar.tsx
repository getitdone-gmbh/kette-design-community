'use client';

import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { focusRing, transitionBase } from './../../lib/recipes';
import { cn } from './../../lib/utils';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Chip } from './chip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { useLabels, usePreset } from './labels-context';
import { Input, type InputProps } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

// Section header action bar family (Figma "Section header": Action bar list / bulk / overflow).
// ActionBar stacks its rows vertically (gap 8): an optional tab row, the toolbar row, the filter row
// and the BatchBar that replaces the toolbar while rows are selected.

const ActionBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex w-full flex-col gap-2', className)} {...props} />,
);
ActionBar.displayName = 'ActionBar';

// One horizontal row of the bar. Put tabs, search, filters or actions inside; `ActionBarSpacer` pushes the rest to the end.
const ActionBarRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-h-action-bar-row w-full flex-wrap items-center gap-2', className)} {...props} />
  ),
);
ActionBarRow.displayName = 'ActionBarRow';

const ActionBarSpacer = () => <span aria-hidden className="flex-1" />;

export type ActionBarSearchProps = Omit<InputProps, 'variant' | 'size' | 'aria-label'> & {
  // Required accessible name, for example `Search`.
  'aria-label': string;
};

// Search field of the action bar (Figma Input Variant=Search sm): control-sm height in a row of control-sm controls, 200 wide. The width reads --size-search once the token exists and falls back to 200.
const ActionBarSearch = React.forwardRef<HTMLInputElement, ActionBarSearchProps>(({ className, ...props }, ref) => (
  <Input ref={ref} variant="search" size="sm" className={cn('w-[var(--size-search,12.5rem)] shrink-0', className)} {...props} />
));
ActionBarSearch.displayName = 'ActionBarSearch';

/* -------------------------------------------------------------------------------------------------
 * Filter tags
 * -----------------------------------------------------------------------------------------------*/

export interface ActionBarFilterTag {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface ActionBarFilterTagsProps extends React.HTMLAttributes<HTMLUListElement> {
  tags: ActionBarFilterTag[];
  /** Renders the Reset link when provided and at least one tag exists. */
  onReset?: () => void;
  resetLabel?: string;
}

const ActionBarFilterTags = React.forwardRef<HTMLUListElement, ActionBarFilterTagsProps>(
  ({ className, tags, onReset, resetLabel: resetLabelProp, 'aria-label': ariaLabelProp, ...props }, ref) => {
    const l = useLabels();
    const resetLabel = resetLabelProp ?? l.reset;
    const ariaLabel = ariaLabelProp ?? l.activeFilters;
    const zero = usePreset() === 'zero';
    if (tags.length === 0) return null;
    return (
      <ul ref={ref} aria-label={ariaLabel} className={cn('m-0 flex list-none flex-wrap items-center gap-2 p-0', className)} {...props}>
        {tags.map((tag) => (
          <li key={tag.id}>
            <Chip variant="outline" size="control" label={tag.label} onRemove={tag.onRemove} />
          </li>
        ))}
        {onReset && (
          <li>
            <button
              type="button"
              onClick={onReset}
              className={cn(
                'text-text-subtle',
                zero
                  ? 'typography-link-sm min-h-[var(--size-control-xs)] rounded-item hover:text-text-default'
                  : 'typography-ui-medium h-control-sm rounded-item px-2 hover:bg-muted hover:text-text-default',
                transitionBase,
                focusRing,
              )}
            >
              {resetLabel}
            </button>
          </li>
        )}
      </ul>
    );
  },
);
ActionBarFilterTags.displayName = 'ActionBarFilterTags';

/* -------------------------------------------------------------------------------------------------
 * Batch bar (bulk actions)
 * -----------------------------------------------------------------------------------------------*/

export interface BatchBarAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  // Not needed when `render` opens a popover instead.
  onSelect?: () => void;
  // The action goes to another page: it renders as a real link (an `<a>` in the More menu, a link styled as the outline button inline) instead of a button with a click handler. `onSelect` still runs first.
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
  // Render slot for inline actions. Receives the action button, returns what to render in its place, e.g. a `Popover` whose `PopoverTrigger asChild` wraps the button. Actions in the More menu ignore it.
  render?: (button: React.ReactElement) => React.ReactNode;
}

export interface BatchBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of selected rows. Mount the bar only while at least one row is selected. */
  selectedCount: number;
  /** Called by Clear and by the leading checkbox. */
  onClear: () => void;
  /** Inline actions, shown as outlined buttons up to `maxInline`; the rest moves into the More menu. */
  actions?: BatchBarAction[];
  /** Always in the More menu. */
  moreActions?: BatchBarAction[];
  /** Inline actions shown before overflowing into the More menu. Default 3. */
  maxInline?: number;
  /** Text of the count, `{count} selected` by default. */
  countLabel?: (count: number) => string;
  clearLabel?: string;
  moreLabel?: string;
  /** Chip slot after the count, for example a `Chip` naming the selection scope ("All 120 matches") or its status. Pass visible text. */
  chip?: React.ReactNode;
}

const BatchBar = React.forwardRef<HTMLDivElement, BatchBarProps>(
  (
    {
      className,
      selectedCount,
      onClear,
      actions = [],
      moreActions = [],
      maxInline = 3,
      countLabel: countLabelProp,
      clearLabel: clearLabelProp,
      moreLabel: moreLabelProp,
      chip,
      'aria-label': ariaLabelProp,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const countLabel = countLabelProp ?? l.selectedCount;
    const clearLabel = clearLabelProp ?? l.clear;
    const moreLabel = moreLabelProp ?? l.moreActions;
    const ariaLabel = ariaLabelProp ?? l.bulkActions;
    const inline = actions.slice(0, Math.max(0, maxInline));
    const menu = [...actions.slice(Math.max(0, maxInline)), ...moreActions];
    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label={ariaLabel}
        className={cn(
          'flex min-h-action-bar-row w-full flex-wrap items-center gap-2 rounded-surface border border-solid border-border-brand bg-background-brand-subtle py-1 pl-3 pr-2 text-text-default',
          className,
        )}
        {...props}
      >
        <Checkbox checked aria-label={l.deselectAll} onCheckedChange={() => onClear()} />
        <span role="status" aria-live="polite" className="typography-ui-semibold">
          {countLabel(selectedCount)}
        </span>
        {chip != null && chip !== false ? (
          <span data-batch-chip="" className="flex shrink-0 items-center">
            {chip}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'typography-ui-medium h-control-sm rounded-item px-2 text-text-default hover:bg-background-brand-subtle-hover',
            transitionBase,
            focusRing,
          )}
        >
          {clearLabel}
        </button>
        <ActionBarSpacer />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {inline.map((action) => {
            const destructiveClass = action.destructive && 'border-border-destructive-subtle text-text-destructive-on-subtle hover:bg-background-destructive-subtle';
            const button = action.href !== undefined && !action.disabled ? (
              <Button key={action.id} asChild variant="outline" size="control-sm" icon={action.icon as React.ReactElement | undefined} className={cn(destructiveClass)}>
                <a href={action.href} onClick={action.onSelect}>
                  {action.label}
                </a>
              </Button>
            ) : (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                size="control-sm"
                icon={action.icon as React.ReactElement | undefined}
                disabled={action.disabled}
                onClick={action.onSelect}
                className={cn(destructiveClass)}
              >
                {action.label}
              </Button>
            );
            return action.render ? <React.Fragment key={action.id}>{action.render(button)}</React.Fragment> : button;
          })}
          {menu.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={moreLabel}
                  className={cn(
                    'inline-flex h-control-sm w-control-sm items-center justify-center rounded-control text-icon-default hover:bg-background-brand-subtle-hover',
                    transitionBase,
                    focusRing,
                  )}
                >
                  <MoreHorizontal className="h-icon-sm w-icon-sm" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menu.map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    disabled={action.disabled}
                    href={action.disabled ? undefined : action.href}
                    onSelect={action.onSelect}
                    className={cn(action.destructive && 'text-text-destructive')}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  },
);
BatchBar.displayName = 'BatchBar';

export interface ActionBarDataSwitchOption {
  value: string;
  label: string;
}

export interface ActionBarDataSwitchProps {
  options: ActionBarDataSwitchOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // Leading icon (icon-xs), for example a building for the data context.
  icon?: React.ReactNode;
  // Required accessible name, for example `Data context`.
  'aria-label': string;
  className?: string;
}

// Data context switch of the action bar (Figma Section header, Data switch): a control-sm Select trigger with a leading icon.
const ActionBarDataSwitch = ({ options, value, defaultValue, onValueChange, icon, 'aria-label': ariaLabel, className }: ActionBarDataSwitchProps) => (
  <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
    <SelectTrigger
      aria-label={ariaLabel}
      leading={icon}
      className={cn('typography-detail h-control-sm w-auto gap-gap-control px-[var(--size-control-padding-x-sm)] py-0', className)}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
ActionBarDataSwitch.displayName = 'ActionBarDataSwitch';

export { ActionBar, ActionBarDataSwitch, ActionBarFilterTags, ActionBarRow, ActionBarSearch, ActionBarSpacer, BatchBar };
