'use client';

import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive, useCommandState } from 'cmdk';
import { ArrowRight, Search } from 'lucide-react';
import { Fragment, ReactNode, forwardRef, useCallback, useEffect, useRef } from 'react';

import { useDanglingControls } from '../../lib/dangling-controls';
import { cn } from '../../lib/utils';
import { useLabels, usePreset } from './labels-context';
import { Dialog, DialogContent } from './dialog';

const Command = forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-surface bg-popover text-popover-foreground',
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

// Dialog props plus the cmdk root props (shouldFilter, filter, loop, value, label ...), forwarded to Command.
interface CommandDialogProps
  extends DialogProps,
    Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive>, 'children' | 'className' | keyof DialogProps> {
  // Extra classes for the Command root.
  commandClassName?: string;
}

// The 48px search row centres at 24px, so the 40px close button sits at top-1 (not the default top-3) and lines up with the field
const CommandDialog = ({ children, open, defaultOpen, onOpenChange, modal, commandClassName, ...commandProps }: CommandDialogProps) => {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <DialogContent className="overflow-hidden p-0" closeClassName="top-1">
        <Command {...commandProps} className={cn("[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5", commandClassName)}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    icon?: ReactNode;
    /** Trailing shortcut hint, e.g. `<CommandKbd>⌘/</CommandKbd>`. */
    shortcut?: ReactNode;
    // Whether the popup the input controls is open. Without it aria-expanded follows whether the list exists.
    expanded?: boolean;
    // No hairline under the field, for a field that sits in its own bordered surface (MultiSelect).
    borderless?: boolean;
  }
>(({ className, icon, shortcut, expanded, borderless, 'aria-labelledby': labelledBy, ...props }, ref) => {
  const l = useLabels();
  const inner = useRef<HTMLInputElement | null>(null);
  // cmdk always points aria-labelledby at its own label. A given aria-labelledby wins over it.
  const labelledByRef = useRef(labelledBy);
  labelledByRef.current = labelledBy;
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inner.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref],
  );
  useDanglingControls(
    inner,
    (node) => node.closest('[cmdk-root]'),
    // cmdk keeps aria-expanded true; it follows the list instead, or the `expanded` prop when set.
    (node, exists) => node.setAttribute('aria-expanded', String(expandedRef.current ?? exists)),
  );
  // cmdk sets aria-activedescendant from a snapshot that is stale when the list mounts after the input (opened by key, filtered by typing). The attribute follows the highlighted item here, so assistive technology hears what Enter will pick. An empty cmdk label (a Command without `label`) would leave the field without a name, so the field is named by its aria-label then.
  useEffect(() => {
    const input = inner.current;
    const root = input?.closest('[cmdk-root]');
    if (!input || !root) return undefined;
    const sync = () => {
      const active = root.querySelector('[cmdk-item][aria-selected="true"]');
      if (active?.id) input.setAttribute('aria-activedescendant', active.id);
      else input.removeAttribute('aria-activedescendant');
      if (labelledByRef.current) input.setAttribute('aria-labelledby', labelledByRef.current);
      else if (!root.querySelector('[cmdk-label]')?.textContent?.trim()) input.removeAttribute('aria-labelledby');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected'] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (expanded !== undefined) inner.current?.setAttribute('aria-expanded', String(expanded));
  }, [expanded]);
  useEffect(() => {
    if (labelledBy) inner.current?.setAttribute('aria-labelledby', labelledBy);
  }, [labelledBy]);
  return (
    <div className={cn('flex items-center px-3', !borderless && 'border-b border-solid border-hairline')} cmdk-input-wrapper="">
      {icon ? icon : <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />}
      <CommandPrimitive.Input
        ref={setRefs}
        aria-label={props['aria-label'] ?? (typeof props.placeholder === 'string' && props.placeholder ? props.placeholder : l.search)}
        className={cn(
          'flex h-11 min-w-0 w-full text-ellipsis rounded-control bg-transparent py-3 typography-input-text max-sm:text-[max(16px,var(--typo-input-text-size,1rem))] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-disabled',
          className,
        )}
        {...props}
      />
      {shortcut}
    </div>
  );
});

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('overflow-y-auto overflow-x-hidden p-1', className)} {...props} />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        'overflow-hidden py-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-[6px] [&_[cmdk-group-heading]]:text-muted-foreground !block',
        zero ? '[&_[cmdk-group-heading]]:typography-kpi-label-strong' : '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  );
});

CommandGroup.displayName = CommandPrimitive.Group.displayName;

// Not the cmdk separator: it forces role="separator", which is not allowed as a direct child of the listbox (aria-required-children). The decorative line is hidden from assistive technology and follows the same rule as cmdk (hidden while searching).
const CommandSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { alwaysRender?: boolean }>(
  ({ className, alwaysRender, ...props }, ref) => {
    const idle = useCommandState((state) => !state.search);
    if (!alwaysRender && !idle) return null;
    return <div ref={ref} role="none" cmdk-separator="" className={cn('-mx-1 h-px bg-border-subtle', className)} {...props} />;
  },
);
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'relative',
        'flex',
        'cursor-pointer',
        'select-none',
        'items-center',
        zero ? 'h-row-compact gap-3 rounded-control px-3 typography-ui font-regular' : 'gap-[10px] rounded-item px-2 py-[6px] text-sm font-medium',
        'outline-none',
        'hover:bg-muted',
        'aria-selected:bg-muted',
        'data-[disabled=true]:pointer-events-none',
        'data-[disabled=true]:opacity-disabled',
        className,
      )}
      {...props}
    />
  );
});

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />;
};
CommandShortcut.displayName = 'CommandShortcut';

// Key chip for a shortcut (Figma "_Command shortcut"). Decorative: the item carries the accessible name.
const CommandKbd = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <kbd
    aria-hidden
    className={cn(
      'typography-micro inline-flex h-5 min-w-icon-lg items-center justify-center rounded-item bg-muted px-1 font-sans text-text-muted',
      className,
    )}
    {...props}
  />
);
CommandKbd.displayName = 'CommandKbd';

// Keys of one shortcut, joined by an arrow for sequences: `<CommandKeys keys={['⌘K', 'P']} />`.
const CommandKeys = ({ keys, className }: { keys: string[]; className?: string }) => (
  <span className={cn('ml-auto flex items-center gap-1', className)}>
    {keys.map((key, index) => (
      <Fragment key={`${key}-${index}`}>
        {index > 0 && <ArrowRight aria-hidden className="h-icon-2xs w-icon-2xs text-icon-subtle" />}
        <CommandKbd>{key}</CommandKbd>
      </Fragment>
    ))}
  </span>
);
CommandKeys.displayName = 'CommandKeys';

// Two-line item body: title with supporting text underneath (Figma Text=Stacked).
const CommandItemText = ({
  title,
  description,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) => (
  <span className={cn('flex min-w-0 flex-col', className)}>
    <span className="typography-ui-medium truncate text-text-default">{title}</span>
    {description && <span className="typography-ui-sm truncate text-text-subtle-on-muted">{description}</span>}
  </span>
);
CommandItemText.displayName = 'CommandItemText';

// Empty result with a message and optional follow-up actions (Figma Type=Empty state).
const CommandEmptyState = ({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div role="status" className={cn('flex flex-col items-center gap-2 px-6 py-8 text-center', className)}>
    <p className="typography-ui-semibold m-0 text-text-default">{title}</p>
    {description && <p className="typography-ui m-0 text-text-subtle">{description}</p>}
    {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
  </div>
);
CommandEmptyState.displayName = 'CommandEmptyState';

export {
  CommandEmptyState,
  CommandItemText,
  CommandKbd,
  CommandKeys,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
