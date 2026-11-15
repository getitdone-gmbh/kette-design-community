'use client';

import { Plus, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Chip } from './chip';
import { useLabels } from './labels-context';

export interface FilterChipItem {
  id: string;
  // "Key: value" text, for example "Status: open".
  label: string;
  // Link mode: the chip is an anchor that removes the filter by navigating to this URL (the listing without this filter). Works without JavaScript. The remove button is not rendered for a chip with `href`; the chip's accessible name is the removal text.
  href?: string;
}

export interface FilterChipBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  // Applied filters. Plain strings are used as both id and label.
  chips: Array<FilterChipItem | string>;
  onRemove?: (id: string) => void;
  // Shows the reset link while at least one filter is applied.
  reset?: boolean;
  resetLabel?: string;
  onReset?: () => void;
  // Link mode: the reset control is a real link (`<a href>`) to the listing without any filter, so it works without JavaScript (pair it with chips that have `href`). Wins over `onReset` as the element. The label is `resetLabel`, for example "Clear all".
  resetHref?: string;
  // Renders the dashed "add filter" chip when provided.
  onAdd?: () => void;
  addLabel?: string;
  // Spacing context only: in an action bar the row sits in a single line, above a list it wraps freely.
  placement?: 'in-action-bar' | 'above-list';
  // Text announced when the filter set changes to nothing.
  emptyLabel?: string;
}

const normalize = (chip: FilterChipItem | string): FilterChipItem => (typeof chip === 'string' ? { id: chip, label: chip } : chip);

const FilterChipBar = React.forwardRef<HTMLDivElement, FilterChipBarProps>(
  (
    {
      className,
      chips,
      onRemove,
      reset = true,
      resetLabel: resetLabelProp,
      onReset,
      resetHref,
      onAdd,
      addLabel: addLabelProp,
      placement = 'above-list',
      emptyLabel: emptyLabelProp,
      'aria-label': ariaLabelProp,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const resetLabel = resetLabelProp ?? l.reset;
    const addLabel = addLabelProp ?? l.addFilter;
    const emptyLabel = emptyLabelProp ?? l.noFiltersApplied;
    const ariaLabel = ariaLabelProp ?? l.appliedFilters;
    const items = chips.map(normalize);
    const count = items.length;
    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        data-placement={placement}
        data-empty={count === 0 || undefined}
        className={cn('flex flex-wrap items-center gap-2', placement === 'in-action-bar' && 'flex-nowrap overflow-x-auto', className)}
        {...props}
      >
        {items.map((chip) =>
          chip.href ? (
            <Chip
              key={chip.id}
              variant="outline"
              size="control"
              href={chip.href}
              label={chip.label}
              aria-label={l.removeFilter(chip.label)}
              data-filter-chip-link=""
            >
              <X aria-hidden="true" className="-mr-1 h-icon-xs w-icon-xs shrink-0 text-icon-subtle" />
            </Chip>
          ) : (
            <Chip
              key={chip.id}
              variant="outline"
              size="control"
              label={chip.label}
              removeLabel={l.removeFilter(chip.label)}
              onRemove={onRemove ? () => onRemove(chip.id) : undefined}
            />
          ),
        )}
        {onAdd ? (
          <Chip
            size="control"
            variant="outline"
            dashed
            icon={<Plus aria-hidden="true" />}
            label={addLabel}
            onClick={onAdd}
          />
        ) : null}
        {reset && count > 0 && resetHref ? (
          <Button asChild variant="link" size="no-size" className="typography-ui text-text-brand underline-offset-4">
            <a href={resetHref}>{resetLabel}</a>
          </Button>
        ) : reset && count > 0 && onReset ? (
          <Button type="button" variant="link" size="no-size" className="typography-ui text-text-brand underline-offset-4" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : null}
        <span role="status" className="sr-only">
          {count === 0 ? emptyLabel : l.filtersApplied(count)}
        </span>
      </div>
    );
  },
);
FilterChipBar.displayName = 'FilterChipBar';

export { FilterChipBar };
