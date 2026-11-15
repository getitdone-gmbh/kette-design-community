'use client';

import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import { Children, createContext, forwardRef, useContext, useId, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react';

import { displayVoice, focusRing } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import type { HeadingTag } from '@/components/ui/heading-tag';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// `checkbox` (default) renders checkbox rows. `toggle-links` renders link style add/remove rows (toggle buttons with aria-pressed).
export type FacetSelectionMode = 'checkbox' | 'toggle-links';

// Leading colour dot of a group heading or an option. `bg-*` token classes are applied as classes, anything else (e.g. a project colour from data) as a background colour.
const FacetDot = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    data-facet-dot=""
    className={cn('h-2 w-2 shrink-0 rounded-full', color.startsWith('bg-') ? color : 'bg-current')}
    style={color.startsWith('bg-') ? undefined : { backgroundColor: color }}
  />
);

const FacetSelectionModeContext = createContext<FacetSelectionMode>('checkbox');

export interface FacetOperator {
  value: string;
  label: string;
}

export interface FacetFilterProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  // Heading element of the title, so the filter fits the document outline. Default h2.
  titleAs?: HeadingTag;
  description?: ReactNode;
  // Match operator switch, e.g. Partial and Exact. Omit for no switch.
  operators?: FacetOperator[];
  operator?: string;
  defaultOperator?: string;
  onOperatorChange?: (value: string) => void;
  operatorLabel?: string;
  // Slot below the switch, e.g. a saved filter select.
  saved?: ReactNode;
  // Shows a Reset link at the right of the header and calls this when pressed.
  onReset?: () => void;
  resetLabel?: string;
  // Default row style of all groups. A group can override it.
  selectionMode?: FacetSelectionMode;
  // FacetGroup elements.
  children?: ReactNode;
}

// Filter column with a header, match operator and facet groups. No overlay chrome: it sits in a split view.
const FacetFilter = forwardRef<HTMLElement, FacetFilterProps>(
  (
    { className, title: titleProp, titleAs: Title = 'h2', description, operators, operator, defaultOperator, onOperatorChange, operatorLabel: operatorLabelProp, saved, onReset, resetLabel: resetLabelProp, selectionMode = 'checkbox', children, ...props },
    ref,
  ) => {
    const l = useLabels();
    const title = titleProp ?? l.filters;
    const operatorLabel = operatorLabelProp ?? l.matchMode;
    const resetLabel = resetLabelProp ?? l.reset;
    const zero = usePreset() === 'zero';
    const [inner, setInner] = useState(defaultOperator ?? operators?.[0]?.value ?? '');
    const current = operator ?? inner;
    return (
      <aside
        ref={ref}
        aria-label={typeof title === 'string' ? title : l.filters}
        className={cn('typography-ui flex w-filter-column max-w-full flex-col gap-4 border-0 border-r border-solid border-hairline p-4 text-foreground', className)}
        {...props}
      >
        <header className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <Title className={cn(zero ? 'typography-ui-semibold' : 'typography-ui-lg-semibold', !zero && displayVoice)}>{title}</Title>
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className={cn('typography-link-sm shrink-0 rounded-item text-text-subtle hover:text-text-default hover:underline', focusRing)}
              >
                {resetLabel}
              </button>
            ) : null}
          </div>
          {description ? <p className="typography-text-extra-small text-muted-foreground">{description}</p> : null}
        </header>
        {operators && operators.length > 0 ? (
          <ToggleGroup
            type="single"
            variant="segmented"
            size="sm"
            aria-label={operatorLabel}
            value={current}
            onValueChange={(value) => {
              if (!value) return;
              if (operator === undefined) setInner(value);
              onOperatorChange?.(value);
            }}
            className="grid w-full auto-cols-fr grid-flow-col gap-0 rounded-control bg-muted p-1"
          >
            {operators.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value} className="w-full">
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        {saved}
        <FacetSelectionModeContext.Provider value={selectionMode}>{children}</FacetSelectionModeContext.Provider>
      </aside>
    );
  },
);
FacetFilter.displayName = 'FacetFilter';

export interface FacetGroupProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  label: string;
  // Heading element of the group label, so the filter fits the document outline. Default h3.
  titleAs?: HeadingTag;
  // Leading colour dot before the group label, e.g. a project colour. A `bg-*` token class or a CSS colour.
  dotColor?: string;
  // Result count after the group label. A number, or text such as "99+".
  count?: number | string;
  // Adds a search field that filters the options client side via onQueryChange (controlled).
  searchable?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  searchPlaceholder?: string;
  // Options shown before "Show n more". Omit to show all.
  limit?: number;
  moreLabel?: (hidden: number) => string;
  lessLabel?: string;
  // Makes the heading a button that collapses and expands the group.
  collapsible?: boolean;
  // Initial state when uncontrolled.
  defaultCollapsed?: boolean;
  // Controlled collapsed state. Pair with `onCollapsedChange`.
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Row style of this group, overriding the filter default. `toggle-links` renders add/remove link rows instead of checkboxes.
  selectionMode?: FacetSelectionMode;
  // FacetOption elements.
  children?: ReactNode;
}

const FacetGroup = forwardRef<HTMLElement, FacetGroupProps>(
  (
    { className, label, titleAs: Title = 'h3', dotColor, count, searchable = false, query, onQueryChange, searchPlaceholder: searchPlaceholderProp, limit, moreLabel: moreLabelProp, lessLabel: lessLabelProp, collapsible = false, defaultCollapsed = false, collapsed: collapsedProp, onCollapsedChange, selectionMode: selectionModeProp, children, ...props },
    ref,
  ) => {
    const l = useLabels();
    const inheritedMode = useContext(FacetSelectionModeContext);
    const selectionMode = selectionModeProp ?? inheritedMode;
    const zero = usePreset() === 'zero';
    const searchPlaceholder = searchPlaceholderProp ?? l.search;
    const moreLabel = moreLabelProp ?? l.showMore;
    const lessLabel = lessLabelProp ?? l.showLess;
    const [expanded, setExpanded] = useState(false);
    const listId = useId();
    const bodyId = useId();
    const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
    const collapsed = collapsible && (collapsedProp ?? innerCollapsed);
    const toggleCollapsed = () => {
      if (collapsedProp === undefined) setInnerCollapsed(!collapsed);
      onCollapsedChange?.(!collapsed);
    };
    const options = Children.toArray(children);
    const hidden = limit != null && !expanded ? Math.max(0, options.length - limit) : 0;
    const visible = limit != null && !expanded ? options.slice(0, limit) : options;
    // Without dot and count the heading stays a plain text node.
    const headingContent =
      dotColor || count != null ? (
        <span className="flex min-w-0 items-center gap-2">
          {dotColor ? <FacetDot color={dotColor} /> : null}
          <span className="min-w-0 truncate">{label}</span>
          {count != null ? <span className="typography-text-extra-small tabular-nums text-muted-foreground">{count}</span> : null}
        </span>
      ) : (
        label
      );
    return (
      <section ref={ref} aria-label={label} className={cn('flex flex-col gap-2', className)} {...props}>
        <Title className="typography-ui-medium">
          {collapsible ? (
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              onClick={toggleCollapsed}
              className={cn('typography-ui-medium flex w-full items-center justify-between gap-2 rounded-item text-left', focusRing)}
            >
              {headingContent}
              <ChevronDown aria-hidden="true" className={cn('h-icon-xs w-icon-xs shrink-0 transition-transform motion-reduce:transition-none', collapsed && '-rotate-90')} />
            </button>
          ) : (
            headingContent
          )}
        </Title>
        <div id={bodyId} data-collapsed={collapsed || undefined} className={cn('flex-col gap-2', collapsed ? 'hidden' : 'flex')}>
        {searchable ? (
          <Input variant="search" aria-label={l.searchIn(label)} placeholder={searchPlaceholder} value={query} onChange={(e) => onQueryChange?.(e.target.value)} />
        ) : null}
        <FacetSelectionModeContext.Provider value={selectionMode}>
          <ul id={listId} className={cn('m-0 flex list-none flex-col p-0', zero ? 'gap-0' : 'gap-2')}>
            {visible.map((option, i) => (
              <li key={i}>{option}</li>
            ))}
          </ul>
        </FacetSelectionModeContext.Provider>
        {limit != null && options.length > limit ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((e) => !e)}
            className={cn('typography-ui-medium h-6 self-start rounded-item text-left text-foreground hover:underline', focusRing)}
          >
            {expanded ? lessLabel : moreLabel(hidden || options.length - limit)}
          </button>
        ) : null}
        </div>
      </section>
    );
  },
);
FacetGroup.displayName = 'FacetGroup';

export interface FacetOptionProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'onChange'> {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  // Leading colour dot before the label (after the checkbox or add/remove icon), e.g. a project colour. A `bg-*` token class or a CSS colour.
  dotColor?: string;
  // Result count next to the label. A number, or text such as "99+" or "n/a".
  count?: number | string;
  // Native form field name. Setting it renders a real `<input type="checkbox" name value>` instead of the script-driven checkbox, so a surrounding `<form method="get">` submits the filter without JavaScript. The row still reports changes through `onCheckedChange`. In `toggle-links` mode a hidden input with the same name and value is rendered while the option is selected.
  name?: string;
  // Native form value, sent as `name=value` while checked. Defaults to `on`.
  value?: string;
}

const FacetOption = forwardRef<HTMLLabelElement, FacetOptionProps>(
  ({ className, label, checked, defaultChecked, onCheckedChange, disabled, dotColor, count, name, value, ...props }, ref) => {
    const id = useId();
    const labelId = useId();
    const mode = useContext(FacetSelectionModeContext);
    // Zero: 28px rows with the 16px checkbox.
    const zero = usePreset() === 'zero';
    const [inner, setInner] = useState(defaultChecked ?? false);
    const selected = checked ?? inner;
    if (mode === 'toggle-links') {
      const { onClick, ...rest } = props as HTMLAttributes<HTMLButtonElement>;
      return (
        <>
        {name && selected ? <input type="hidden" name={name} value={value ?? 'on'} /> : null}
        <button
          ref={ref as unknown as Ref<HTMLButtonElement>}
          type="button"
          aria-pressed={selected}
          disabled={disabled}
          data-selected={selected || undefined}
          onClick={(event) => {
            onClick?.(event);
            if (checked === undefined) setInner(!selected);
            onCheckedChange?.(!selected);
          }}
          className={cn(
            'typography-ui flex w-full cursor-pointer items-center gap-2 rounded-item text-left text-link-default hover:text-link-hover hover:underline active:text-link-active disabled:cursor-not-allowed disabled:opacity-disabled',
            zero ? 'h-control-sm' : 'h-6',
            selected && 'font-medium',
            focusRing,
            className,
          )}
          {...rest}
        >
          {selected ? <Minus aria-hidden="true" className="h-icon-xs w-icon-xs shrink-0" /> : <Plus aria-hidden="true" className="h-icon-xs w-icon-xs shrink-0" />}
          {dotColor ? <FacetDot color={dotColor} /> : null}
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {count != null ? <span className="typography-text-extra-small tabular-nums text-muted-foreground">{count}</span> : null}
        </button>
        </>
      );
    }
    if (name) {
      // Native input: submits with a plain GET form before any script runs. The box is drawn from the input state with peer-* variants, same tokens as Checkbox.
      return (
        <label ref={ref} htmlFor={id} className={cn('typography-ui flex cursor-pointer items-center gap-2', zero ? 'h-control-sm' : 'h-6', disabled && 'cursor-not-allowed opacity-disabled', className)} {...props}>
          <span className={cn('relative inline-flex shrink-0', zero ? 'h-checkbox-sm w-checkbox-sm' : 'h-5 w-5')}>
            <input
              id={id}
              type="checkbox"
              name={name}
              value={value ?? 'on'}
              checked={checked}
              defaultChecked={checked === undefined ? defaultChecked : undefined}
              disabled={disabled}
              aria-labelledby={labelId}
              onChange={(event) => {
                if (checked === undefined) setInner(event.target.checked);
                onCheckedChange?.(event.target.checked);
              }}
              className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
              aria-hidden="true"
              data-slot="facet-option-box"
              className="pointer-events-none flex h-full w-full items-center justify-center rounded-tight border border-solid border-checkbox-border-default bg-background text-text-on-brand transition-[color,background-color,border-color,box-shadow] duration-150 peer-hover:border-checkbox-border-hover peer-focus-visible:border-ring peer-focus-visible:ring-focus peer-focus-visible:ring-ring-default peer-focus-visible:ring-offset-focus peer-focus-visible:ring-offset-background peer-checked:border-border-control-checked peer-checked:bg-background-brand-bold-default [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
            >
              <Check aria-hidden className={cn(zero ? 'h-3 w-3' : 'h-4 w-4', '[stroke-width:var(--size-icon-stroke-check,3)]')} />
            </span>
          </span>
          {dotColor ? <FacetDot color={dotColor} /> : null}
          <span id={labelId} className="min-w-0 flex-1 truncate">
            {label}
          </span>
          {count != null ? <span className="typography-text-extra-small tabular-nums text-muted-foreground">{count}</span> : null}
        </label>
      );
    }
    return (
      <label ref={ref} htmlFor={id} className={cn('typography-ui flex cursor-pointer items-center gap-2', zero ? 'h-control-sm' : 'h-6', disabled && 'cursor-not-allowed opacity-disabled', className)} {...props}>
        <Checkbox
          id={id}
          aria-labelledby={labelId}
          size={zero ? 'sm' : 'default'}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        />
        {dotColor ? <FacetDot color={dotColor} /> : null}
        <span id={labelId} className="min-w-0 flex-1 truncate">
          {label}
        </span>
        {count != null ? <span className="typography-text-extra-small tabular-nums text-muted-foreground">{count}</span> : null}
      </label>
    );
  },
);
FacetOption.displayName = 'FacetOption';

export { FacetFilter, FacetGroup, FacetOption };
