'use client';

import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Dispatch, FC, RefObject, SetStateAction, createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { compositeFieldDefault, compositeFieldZero } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { isMobileDevice } from '@/lib/is-mobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/Card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PERSISTENT_LIST } from '@/lib/nested-layer';
import { Spacing } from '@/components/ui/spacing';
import { LabelScope, useLabels, usePreset } from '@/components/ui/labels-context';

export type MultiSelectOptionId = string;

export type MultiSelectOption = {
  label: string;
  id: MultiSelectOptionId;
  // Marks this value as invalid. The shown value uses the destructive look and is announced as invalid.
  invalid?: boolean;
};

// The current value is invalid when the option says so, the consumer marks it, or it is not in the options (unless options are still loading).
const isCurrentValueInvalid = ({
  options,
  selected,
  invalidValues,
  isValueInvalid,
  loading,
}: {
  options: MultiSelectOption[];
  selected: MultiSelectOptionId | null;
  invalidValues?: MultiSelectOptionId[];
  isValueInvalid?: (id: MultiSelectOptionId) => boolean;
  loading?: boolean;
}) => {
  if (!selected) return false;
  const option = options.find((o) => o.id === selected);
  if (!option) return !loading;
  return Boolean(option.invalid) || Boolean(invalidValues?.includes(selected)) || isValueInvalid?.(selected) === true;
};

// Create a context for managing the currently open SingleSelect
export const SingleSelectContext = createContext<{
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
}>({
  openId: null,
  setOpenId: () => {},
});

interface SingleSelectProviderProps {
  children: React.ReactNode;
}

const SingleSelectProvider: FC<SingleSelectProviderProps> = ({ children }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return <SingleSelectContext.Provider value={{ openId, setOpenId }}>{children}</SingleSelectContext.Provider>;
};

const singleSelectLabelId = (id: string) => `${id}-label`;

// The chevron names the field it opens: "Open options" plus the visible label (aria-labelledby, so the text follows the label), or plus the accessible name of the field when there is no visible label.
const toggleName = (openLabel: string, id: string, label: string | undefined, fallbackName: string) =>
  label
    ? ({ id: `${id}-toggle`, 'aria-label': openLabel, 'aria-labelledby': `${id}-toggle ${singleSelectLabelId(id)}` } as const)
    : ({ 'aria-label': `${openLabel} ${fallbackName}` } as const);

// cmdk takes Enter on its root (it selects the highlighted item and prevents the default). A button inside must keep Enter as its own activation while nothing is highlighted.
const letEnterThrough = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') e.stopPropagation();
};

// Clear control of the chosen value: named, 24 x 24 target, keeps the focus in the field on pointer down.
const RemoveSelected: FC<{ label?: string; disabled?: boolean; onRemove: () => void }> = ({ label, disabled, onRemove }) => {
  const l = useLabels();
  return (
    <button
      type="button"
      aria-label={l.remove(label)}
      className={cn(
        'ml-1 flex h-6 w-6 items-center justify-center rounded-item text-icon-subtle outline-none hover:text-icon-default',
        'focus-visible:ring-focus focus-visible:ring-ring-default focus-visible:ring-offset-focus focus-visible:ring-offset-background',
        'disabled:pointer-events-none',
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={letEnterThrough}
      onClick={() => onRemove()}
      disabled={disabled}
    >
      <X aria-hidden="true" className={cn('h-icon-xs w-icon-xs', { hidden: disabled })} />
    </button>
  );
};

export interface SingleSelectProps {
  // Built-in texts. Each wins over the provider text.
  emptyText?: string;
  addHintText?: string;
  loadingText?: string;
  addNewText?: string;
  options: MultiSelectOption[];
  selected: MultiSelectOptionId | null;
  onChange: (id: string | null) => void;
  onAddItemClick?: (item: string) => void;
  placeholder?: string;
  loading?: boolean;
  defaultValue?: string;
  label?: string;
  // DOM id of the field (the combobox element). Label `htmlFor`, `aria-labelledby` and focus restoration point at it. Generated when omitted.
  id?: string;
  disabled?: boolean;
  enableSearch?: boolean;
  disableAddNew?: boolean;
  decentToggle?: boolean;
  disableRemove?: boolean;
  useSheet?: boolean;
  description?: string;
  className?: string;
  customAction?: React.ReactNode;
  isMobile?: boolean;
  /**
   * Forces the error-token treatment (`border-error`) on the trigger and sets `aria-invalid`,
   * mirroring `<SelectTrigger>`'s `aria-[invalid=true]:border-error` (select.tsx) so a required
   * SingleSelect can show the same validation-error state as the base Select (SELECT-MAT-07).
   */
  invalid?: boolean;
  /** Points to the id of an external error message, announced via `aria-describedby`. */
  ariaDescribedBy?: string;
  // Ids to show as invalid when selected. Same as `invalid: true` on the option.
  invalidValues?: MultiSelectOptionId[];
  // Decides whether the current value is invalid. A `selected` id that is missing from `options` is always invalid (unless `loading`).
  isValueInvalid?: (id: MultiSelectOptionId) => boolean;
  // Accessible name of the field when there is no visible `label`. Falls back to the placeholder.
  ariaLabel?: string;
  // Shows the value on the muted read-only surface. Stays focusable (`aria-readonly`), cannot be opened or changed.
  readOnly?: boolean;
}

const SingleSelectField: FC<SingleSelectProps> = ({
  options = [],
  selected = null,
  onChange,
  onAddItemClick,
  placeholder: placeholderProp,
  loading = false,
  defaultValue = '',
  label,
  id: idProp,
  disabled = false,
  enableSearch = false,
  disableAddNew = false,
  decentToggle = false,
  disableRemove = false,
  useSheet = false,
  description,
  className,
  customAction,
  isMobile = false,
  invalid = false,
  ariaDescribedBy,
  ariaLabel,
  invalidValues,
  isValueInvalid,
}: SingleSelectProps) => {
  const l = useLabels();
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const valueInvalid = isCurrentValueInvalid({ options, selected, invalidValues, isValueInvalid, loading });
  const selectedLabel = options.find((option) => option.id === selected)?.label ?? selected;
  const zero = usePreset() === 'zero';
  const placeholder = placeholderProp ?? l.searchEllipsis;
  const { openId, setOpenId } = useContext(SingleSelectContext);
  const [search, setSearch] = useState(defaultValue);
  const [height, setHeight] = useState<number[]>([]);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const labelHeight = label ? 36 : 0;
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false); // Sheet open state
  const initialHeight = 44;

  const open = openId === id;

  // The id sits on the combobox element, which is not a tab stop. Focus (from focus restoration or a label click) moves on to the real control inside.
  const focusField = () => {
    if (disabled) return;
    comboboxRef.current?.querySelector<HTMLElement>('input:not([disabled]), [data-select-toggle]:not([disabled])')?.focus();
  };

  // The id sits on a div, which a native label cannot activate. A click on any label for this field (the own one or one outside the component) moves focus into the field.
  useEffect(() => {
    const handleLabelClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const label = e.target.closest('label');
      if (label && label.getAttribute('for') === id) focusField();
    };
    document.addEventListener('click', handleLabelClick);
    return () => document.removeEventListener('click', handleLabelClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, disabled]);

  useEffect(() => {
    if (search !== '') {
      setOpenId(id);
    }
  }, [search, setOpenId, id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.target instanceof Element && !e.target.closest('.command')) {
        setOpenId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setOpenId]);

  useEffect(() => {
    if (useSheet) return;
    const handleResize = () => {
      if (!comboboxRef.current) return;
      const rectCombobox = comboboxRef.current.getBoundingClientRect();
      const rectDropdown = dropdownRef.current?.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rectCombobox.top > viewportHeight - rectCombobox.bottom) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }

      if (rectCombobox.top < 208 && viewportHeight - rectCombobox.bottom < 208) {
        if (!dropdownRef.current) return;
        dropdownRef.current?.setAttribute(
          'style',
          `position: fixed; top: 0; height: 100% !important; width: ${rectCombobox.width}px !important;`,
        );
        dropdownRef.current
          .querySelector('[role="listbox"]')
          ?.setAttribute(
            'style',
            `max-height: ${disableAddNew ? viewportHeight - 16 : viewportHeight - 16 - 50}px !important;`,
          );
      }

      if (!rectDropdown?.height) return;
    };

    const handleHeight = (entries: ResizeObserverEntry[]) => {
      const heightArr = [initialHeight, initialHeight];
      for (const [index, entry] of entries.entries()) {
        const { height } = entry.contentRect;
        heightArr[index] = height === 0 ? initialHeight : height;
      }
      setHeight(heightArr);
    };

    const observer = new ResizeObserver((entries) => {
      handleHeight(entries);
      handleResize();
    });

    // Capture the nodes so cleanup unobserves exactly what this effect observed
    const combobox = comboboxRef.current;
    const dropdown = dropdownRef.current;
    if (combobox) observer.observe(combobox);

    return () => {
      if (combobox) observer.unobserve(combobox);
      if (dropdown) observer.unobserve(dropdown);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, selected, disableAddNew, useSheet]);

  useEffect(() => {
    if (open && inputRef.current && !isMobile && !useSheet) {
      inputRef.current.focus();
    }
  }, [open, isMobile, useSheet]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.blur();
    }, 0);
  }, []);

  const isNewItem = (item: string) => options?.every((option) => option.label !== item.trim());

  const handleUnselect = () => {
    onChange(null);
    // The remove button leaves the page with the value. Focus goes to the chevron, not to the body.
    setTimeout(focusField, 0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleDialogSubmit = () => {
    if (isNewItem(search)) {
      setDialogOpen(true);
      setNewItemLabel(search.trim());
    }
  };

  const handleAddNewItem = () => {
    if (onAddItemClick && isNewItem(newItemLabel)) {
      onAddItemClick(newItemLabel);
      setNewItemLabel('');
      setDialogOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const hasFilteredMatches = (searchTerm: string) => {
    if (!searchTerm.trim()) return true; // Empty search shows all items
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return options.some((option) => option.label.toLowerCase().includes(normalizedSearch));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && search === '') {
      e.preventDefault();
      onChange(null);
    }

    // Handle Enter key - only trigger add new when there are NO matches
    if (e.key === 'Enter' && search.trim() && !disableAddNew) {
      // Only prevent default and show add dialog if there are no filtered matches
      if (!hasFilteredMatches(search) && isNewItem(search)) {
        e.preventDefault();
        setNewItemLabel(search.trim());
        setDialogOpen(true);
      }
      // Otherwise, let cmdk handle the Enter key to select the first match
    }

    // Note: Arrow keys are handled by cmdk itself for navigation
    // We don't need to handle them manually
  };

  const topDistances = () => {
    if (dropdownDirection === 'up') return undefined;

    const inputHeight = height[0];
    return inputHeight + labelHeight;
  };

  const multiSelectInputProps = {
    valueInvalid,
    setSearch,
    onChange,
    comboboxRef,
    height,
    setOpenId,
    open,
    id,
    disabled,
    placeholder,
    options,
    selected,
    handleUnselect,
    inputRef,
    search,
    handleSearchChange,
    handleKeyDown,
    decentToggle,
    useSheet,
    label,
    ariaLabel,
  };

  const multiSelectDropdownProps = {
    id,
    options,
    selected,
    onChange: (value: string | null) => {
      onChange(value);
      setSheetOpen(false); // Close the sheet when an option is selected
    },
    handleDialogSubmit,
    dropdownRef,
    search,
    setSearch,
    dropdownDirection,
    isNewItem,
    disableAddNew,
    disabled,
    loading,
    open,
    topDistances,
    height,
    inputRef,
    setOpenId,
    useSheet,
    customAction,
  };

  return (
    <>
      {useSheet ? (
        <Spacing direction="column" gap="2" wrap="nowrap">
          {label && (
            <Label id={singleSelectLabelId(id)} htmlFor={id} aria-disabled={disabled || undefined} className={cn('leading-4', disabled && 'opacity-disabled')}>
              {label}
            </Label>
          )}
          <Sheet open={sheetOpen} onOpenChange={(isOpen) => setSheetOpen(isOpen)}>
            <SheetTrigger asChild>
              <div
                ref={comboboxRef}
                // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-labelledby={label ? singleSelectLabelId(id) : undefined}
                aria-disabled={disabled || undefined}
                aria-label={label ? undefined : (ariaLabel ?? placeholder ?? l.selectOptions)}
                aria-invalid={invalid || valueInvalid || undefined}
                aria-describedby={ariaDescribedBy}
                data-id={id}
                id={id}
                tabIndex={-1}
                onFocus={(e) => {
                  if (e.target === e.currentTarget) focusField();
                }}
                className={cn(
                  'flex',
                  'flex-row',
                  'items-center',
                  'bg-background',
                  'w-full',
                  'justify-between',
                  'border',
                  'border-solid',
                  ...(zero ? compositeFieldZero : compositeFieldDefault),
                  'cursor-default',
                  'rounded-default',
                  'relative',
                  'overflow-visible',
                  { 'opacity-disabled cursor-not-allowed': disabled },
                  className,
                )}
                onClick={() => setSheetOpen(true)}
              >
                <div
                  className="flex gap-2 flex-wrap items-center flex-grow-default [&_[cmdk-input-wrapper]]:flex-grow-default"
                  onClick={() => setOpenId(id)}
                >
                  {selected ? (
                    <div className={cn('flex items-center text-sm', valueInvalid && 'text-text-destructive')} data-invalid={valueInvalid || undefined}>
                      {selectedLabel}
                      {valueInvalid && <span className="sr-only">{l.invalidSuffix}</span>}
                      {!disableRemove && (
                        <RemoveSelected label={selectedLabel ?? undefined} disabled={disabled} onRemove={handleUnselect} />
                      )}
                    </div>
                  ) : (
                    // Trigger is outside <Command>, so it must not render cmdk inputs; search lives inside the sheet
                    <span className="text-text-subtle text-sm">{placeholder}</span>
                  )}
                </div>
                <Button
                  type="button"
                  disabled={disabled}
                  variant="ghost"
                  size="sm"
                  {...toggleName(l.openOptions, id, label, ariaLabel ?? placeholder ?? l.selectOptions)}
                  data-select-toggle=""
                  onKeyDown={(e) => {
                    // Closed: Enter opens the list. Open: Enter stays with cmdk and picks the highlighted option.
                    if (!open) letEnterThrough(e);
                  }}
                  className={cn(
                    { 'hover:bg-transparent': decentToggle },
                    'h-control-sm',
                    'w-10',
                    'flex',
                    'items-center',
                    'justify-center',
                    '[&_svg]:text-text-subtle',
                    '[&_svg]:active:text-foreground-accent',
                  )}
                  onClick={() => {
                    setSheetOpen(!sheetOpen);
                  }}
                >
                  <ChevronsUpDown className="h-4 w-4 min-w-[16px]" />
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent
              onOpenAutoFocus={(event) => {
              // A select sheet opens in its search field, not on a chip or the first control.
              const input = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input:not([disabled])');
              if (input) {
                event.preventDefault();
                input.focus();
              }
            }}
            onAfterClose={() => setSearch('')}
              side={isMobile || isMobileDevice() ? 'bottom' : 'right'}
              className={cn('overflow-y-auto', (isMobile || isMobileDevice()) && 'h-[90vh]')}
            >
              <SheetHeader className="mb-6">
                <Spacing direction="row" justifyContent="between" alignItems="center">
                  <SheetTitle>{label}</SheetTitle>
                </Spacing>
                {description && <span className="text-sm text-text-subtle">{description}</span>}
              </SheetHeader>
              <Spacing direction="column" gap="2" className="relative" wrap="nowrap">
                <Command className="w-full command" vimBindings={false} {...{ [PERSISTENT_LIST]: '' }}>
                  <CommandGroup className="[&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:nowrap">
                    <SingleSelectInput {...multiSelectInputProps} useSheet={false} noButton />
                    <SingleSelectDropdown {...multiSelectDropdownProps} />
                  </CommandGroup>
                </Command>
              </Spacing>
            </SheetContent>
          </Sheet>
        </Spacing>
      ) : (
        <Spacing direction="column" gap="2" className="relative" wrap="nowrap">
          {label && (
            <Label id={singleSelectLabelId(id)} htmlFor={id} aria-disabled={disabled || undefined} className={cn('leading-4', disabled && 'opacity-disabled')}>
              {label}
            </Label>
          )}
          <Command className="command w-full overflow-visible" vimBindings={false}>
            <div
              ref={comboboxRef}
              // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-labelledby={label ? singleSelectLabelId(id) : undefined}
              aria-disabled={disabled || undefined}
              aria-label={label ? undefined : (ariaLabel ?? placeholder ?? l.selectOptions)}
              aria-invalid={invalid || valueInvalid || undefined}
              aria-describedby={ariaDescribedBy}
              data-id={id}
              id={id}
              tabIndex={-1}
              onFocus={(e) => {
                if (e.target === e.currentTarget) focusField();
              }}
              className={cn(
                'flex',
                'flex-row',
                'items-center',
                'bg-background',
                'w-full',
                'justify-between',
                'border',
                'border-solid',
                ...(zero ? compositeFieldZero : compositeFieldDefault),
                'cursor-default',
                'rounded-default',
                'relative',
                'overflow-visible',
                { 'opacity-disabled cursor-not-allowed': disabled },
                className,
              )}
            >
              <div
                className="flex gap-2 flex-wrap items-center flex-grow-default [&_[cmdk-input-wrapper]]:flex-grow-default"
                onClick={() => setOpenId(id)}
              >
                {selected ? (
                  <div className={cn('flex items-center text-sm', valueInvalid && 'text-text-destructive')} data-invalid={valueInvalid || undefined}>
                    {selectedLabel}
                    {valueInvalid && <span className="sr-only">{l.invalidSuffix}</span>}
                    {!disableRemove && (
                      <RemoveSelected label={selectedLabel ?? undefined} disabled={disabled} onRemove={handleUnselect} />
                    )}
                  </div>
                ) : (
                  <>{!enableSearch && <span className="text-text-subtle text-sm">{placeholder}</span>}</>
                )}
                {enableSearch && (
                  <CommandInput
                    autoFocus={!isMobileDevice()}
                    placeholder={placeholder}
                    value={search}
                    onValueChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    disabled={disabled}
                    className="flex-grow-default"
                  />
                )}
              </div>
              <Button
                type="button"
                disabled={disabled}
                variant="ghost"
                size="sm"
                {...toggleName(l.openOptions, id, label, ariaLabel ?? placeholder ?? l.selectOptions)}
                data-select-toggle=""
                onKeyDown={(e) => {
                  // Closed: Enter opens the list. Open: Enter stays with cmdk and picks the highlighted option.
                  if (!open) letEnterThrough(e);
                }}
                className={cn(
                  { 'hover:bg-transparent': decentToggle },
                  'h-control-sm',
                  'w-10',
                  'flex',
                  'items-center',
                  'justify-center',
                  '[&_svg]:text-text-subtle',
                  '[&_svg]:active:text-foreground-accent',
                )}
                onClick={() => {
                  open ? setOpenId(null) : setOpenId(id);
                }}
              >
                <ChevronsUpDown className="h-4 w-4 min-w-[16px]" />
              </Button>
            </div>
            {open && (
              <Card
                className={`!gap-0 absolute !h-auto !p-2 z-20 transition-all duration-300 shadow-lg ${
                  open ? 'animate-[fadeInGrow_0.3s_ease-out_forwards]' : 'animate-[fadeOutShrink_0.3s_ease-in_forwards]'
                }`}
                style={{
                  top: topDistances(),
                  bottom: dropdownDirection === 'up' ? height[0] : undefined,
                }}
                ref={dropdownRef}
                shadow
              >
                {(!disableAddNew || customAction) && (
                  <div>
                    <Spacing alignItems="center" direction="row" justifyContent="between">
                      <Spacing direction="row" className="self-end" alignItems="center" gap="2">
                        {!disableAddNew && !customAction && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDialogSubmit}
                            disabled={loading || disabled || !isNewItem(search)}
                            className="px-2 text-sm"
                          >
                            {loading ? (
                              <Spacing direction="row" gap="1" alignItems="center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {l.pleaseWait}
                              </Spacing>
                            ) : (
                              l.addNew
                            )}
                          </Button>
                        )}
                        {customAction}
                      </Spacing>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenId(null)}
                        disabled={disabled}
                        className="px-2 text-sm"
                      >
                        {l.close}
                      </Button>
                    </Spacing>
                    <hr className="mt-2 mb-4" />
                  </div>
                )}
                <div className="max-h-[250px] overflow-auto">
                  <CommandList>
                    <CommandEmpty className="p-2 text-sm text-text-subtle text-center mt-2">
                      <Spacing direction="column">
                        <span>{l.notFound}</span>
                        <span className="opacity-disabled">{l.pressEnterToAdd}</span>
                      </Spacing>
                    </CommandEmpty>
                    {options.map((option) => (
                      <CommandItem
                        className={cn({
                          // Selected/checked item — same token pairing as Select's own
                          // `data-[state=checked]:bg-background-accent` (SELECT-MAT-04).
                          // The previous `aria-selected:!bg-slate-200` `!important` override
                          // is dropped entirely: CommandItem (command.tsx) already applies
                          // `aria-selected:bg-menu-background-hover aria-selected:text-foreground-accent`
                          // for the keyboard/pointer-highlighted row, so no override is needed.
                          'bg-background-accent text-foreground-accent': selected === option.id,
                        })}
                        key={option.id}
                        onSelect={() => {
                          if (!disabled) {
                            onChange(option.id);
                            setOpenId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' && !disabled) {
                            // Space key - select item
                            e.preventDefault();
                            e.stopPropagation();
                            onChange(option.id);
                            setOpenId(null);
                          } else if (e.key === 'Tab' && !e.shiftKey) {
                            // Tab - return to search
                            e.preventDefault();
                            e.stopPropagation();
                            if (enableSearch && inputRef.current) {
                              inputRef.current.focus();
                            }
                          }
                          // Let cmdk handle Enter and arrow keys
                        }}
                      >
                        <Spacing direction="row" alignItems="center" gap="2" wrap="nowrap">
                          {selected === option.id && <Check className="h-4 w-4" />}
                          <Label
                            className={cn('text-left leading-5 p-1 !cursor-pointer', {
                              'font-regular': selected !== option.id,
                            })}
                          >
                            {option.label}
                          </Label>
                        </Spacing>
                      </CommandItem>
                    ))}
                  </CommandList>
                </div>
              </Card>
            )}
          </Command>
        </Spacing>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        {/* Escape closes the dialog like Cancel; focus goes back into the field, since the dialog trigger is empty. */}
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // The inline search field is gone once the list closed with Escape: focus goes to the field itself.
            if (inputRef.current) inputRef.current.focus();
            else focusField();
          }}
        >
          <DialogTitle>{l.add}</DialogTitle>
          <DialogDescription>
            <Input
              placeholder={l.enterNew(label)}
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              className="w-full border border-solid rounded-default px-2 py-1"
              disabled={disabled}
            />
          </DialogDescription>
          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button" size="sm" variant="ghost" className="ml-2" disabled={disabled}>
                {l.cancel}
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNewItem}
              variant="default"
              disabled={disabled || newItemLabel.trim() === ''}
            >
              {l.send}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface SingleSelectInputProps {
  setSearch: Dispatch<SetStateAction<string>>;
  onChange: (id: string | null) => void;
  comboboxRef: RefObject<HTMLDivElement>;
  height: number[];
  setOpenId: Dispatch<SetStateAction<string | null>>;
  open: boolean;
  id: string;
  disabled?: boolean;
  placeholder?: string;
  options: MultiSelectOption[];
  selected: string | null;
  valueInvalid?: boolean;
  handleUnselect: () => void;
  inputRef: RefObject<HTMLInputElement>;
  search: string;
  handleSearchChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  decentToggle?: boolean;
  useSheet?: boolean;
  noButton?: boolean;
  label?: string;
  ariaLabel?: string;
}

const SingleSelectInput: FC<SingleSelectInputProps> = ({
  setSearch,
  onChange,
  comboboxRef,
  height,
  setOpenId,
  open,
  id,
  disabled,
  placeholder,
  options,
  selected,
  handleUnselect,
  inputRef,
  search,
  handleSearchChange,
  handleKeyDown,
  decentToggle,
  useSheet,
  noButton = false,
  label,
  ariaLabel,
  valueInvalid = false,
}) => {
  const l = useLabels();
  const selectedLabel = options.find((option) => option.id === selected)?.label ?? selected;
  const zero = usePreset() === 'zero';
  return (
  <div
    ref={comboboxRef}
    // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-labelledby={label ? singleSelectLabelId(id) : undefined}
    aria-disabled={disabled || undefined}
    aria-label={label ? undefined : (ariaLabel ?? placeholder ?? l.selectOptions)}
    data-id={id}
    className={cn(
      'flex',
      'flex-row',
      'items-center',
      'bg-background',
      'w-full',
      'justify-between',
      'border',
      'border-solid',
      ...(zero ? compositeFieldZero : compositeFieldDefault),
      'cursor-default',
      'rounded-default',
      'relative',
      'overflow-visible',
      { 'opacity-disabled cursor-not-allowed': disabled },
    )}
  >
    <div
      className="flex gap-2 flex-wrap items-center flex-grow-default [&_[cmdk-input-wrapper]]:flex-grow-default"
      onClick={() => setOpenId(id)}
    >
      {selected ? (
        <div className={cn('flex items-center text-sm', valueInvalid && 'text-text-destructive')} data-invalid={valueInvalid || undefined}>
          {selectedLabel}
          {valueInvalid && <span className="sr-only">{l.invalidSuffix}</span>}
          {!disabled && (
            <RemoveSelected label={selectedLabel ?? undefined} disabled={disabled} onRemove={handleUnselect} />
          )}
        </div>
      ) : (
        <>
          {!useSheet && !disabled && !placeholder && (
            <span className="text-text-subtle text-sm">{placeholder}</span>
          )}
        </>
      )}
      {useSheet && <span className="flex-grow-default text-sm leading-button-sm text-text-subtle">{l.addItems}</span>}
      {!useSheet && (
        <CommandInput
          autoFocus={!isMobileDevice()}
          placeholder={placeholder}
          value={search}
          onValueChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          disabled={disabled}
          className="flex-grow-default"
        />
      )}
    </div>
    {!noButton && (
      <Button
        type="button"
        disabled={disabled}
        variant="ghost"
        size="sm"
        {...toggleName(l.openOptions, id, label, ariaLabel ?? placeholder ?? l.selectOptions)}
        data-select-toggle=""
        onKeyDown={(e) => {
          // Closed: Enter opens the list. Open: Enter stays with cmdk and picks the highlighted option.
          if (!open) letEnterThrough(e);
        }}
        className={cn(
          { 'hover:bg-transparent': decentToggle },
          'h-control-sm',
          'w-10',
          'flex',
          'items-center',
          'justify-center',
          '[&_svg]:text-text-subtle',
          '[&_svg]:active:text-foreground-accent',
        )}
        onClick={() => {
          open ? setOpenId(null) : setOpenId(id);
        }}
      >
        <ChevronsUpDown className="h-4 w-4 min-w-[16px]" />
      </Button>
    )}
  </div>
  );
};

interface SingleSelectDropdownProps {
  id: string;
  options: { label: string; id: string }[];
  selected: string | null;
  onChange: (id: string | null) => void;
  handleDialogSubmit: () => void;
  dropdownRef: RefObject<HTMLDivElement>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  dropdownDirection: 'down' | 'up';
  isNewItem: (item: string) => boolean;
  disableAddNew?: boolean;
  disabled?: boolean;
  loading?: boolean;
  open: boolean;
  topDistances: () => number | undefined;
  height: number[];
  inputRef: RefObject<HTMLInputElement>;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  useSheet?: boolean;
  setSheetOpen?: Dispatch<SetStateAction<boolean>>;
  customAction?: React.ReactNode;
}

const SingleSelectDropdown: FC<SingleSelectDropdownProps> = ({
  id,
  options,
  selected,
  onChange,
  handleDialogSubmit,
  dropdownRef,
  search,
  setSearch,
  dropdownDirection,
  isNewItem,
  disableAddNew,
  disabled,
  loading,
  open,
  topDistances,
  height,
  inputRef,
  setOpenId,
  useSheet = false,
  setSheetOpen, // Receive the setSheetOpen prop
  customAction,
}) => {
  const l = useLabels();
  const isVisible = useSheet ? true : open;

  return (
    isVisible && (
      <Card
        className={cn(
          'order-2',
          '!gap-0',
          '!h-auto',
          { '!p-2': !useSheet },
          { '!px-0': useSheet },
          { '!py-2': useSheet },
          'z-30',
          { absolute: !useSheet },
          { 'shadow-lg': !useSheet },
          { 'z-10': useSheet },
          `transition-all duration-300  ${
            isVisible ? 'animate-[fadeInGrow_0.3s_ease-out_forwards]' : 'animate-[fadeOutShrink_0.3s_ease-in_forwards]'
          }`,
        )}
        style={{
          top: topDistances() || 0,
          bottom: dropdownDirection === 'up' ? height[0] : undefined,
        }}
        noBorder={useSheet}
        ref={dropdownRef}
        shadow={!useSheet}
      >
        {(!disableAddNew || customAction) && (
          <div>
            <Spacing alignItems="center" direction="row" justifyContent="between">
              <Spacing direction="row" className="self-end" alignItems="center" gap="2">
                {!disableAddNew && !customAction && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDialogSubmit}
                    disabled={loading || disabled || !isNewItem(search)}
                    className="px-2 text-sm"
                  >
                    {loading ? (
                      <Spacing direction="row" gap="1" alignItems="center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {l.pleaseWait}
                      </Spacing>
                    ) : (
                      l.addNew
                    )}
                  </Button>
                )}
                {customAction}
              </Spacing>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} className="px-2 text-sm">
                  {l.close}
                </Button>
              </SheetTrigger>
            </Spacing>
            <hr className="mt-2 mb-4" />
          </div>
        )}
        <div>
          <CommandList>
            <CommandEmpty className="p-2 text-sm text-text-subtle text-center mt-2">
              <Spacing direction="column">
                <span>{l.notFound}</span>
                <span className="opacity-disabled">{l.pressEnterToAdd}</span>
              </Spacing>
            </CommandEmpty>
            {options.map((option) => (
              <CommandItem
                className={cn({
                  // Same fix as the non-sheet dropdown above (SELECT-MAT-04): token-based
                  // selected treatment, no raw-palette `!important` override.
                  'bg-background-accent text-foreground-accent': selected === option.id,
                })}
                key={option.id}
                onSelect={() => {
                  if (!disabled) {
                    onChange(option.id);
                    setSearch('');
                    setOpenId(null);
                    if (setSheetOpen) setSheetOpen(false); // Close the sheet if setSheetOpen is provided
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    onChange(option.id);
                    setSearch('');
                    setOpenId(null);
                    if (setSheetOpen) setSheetOpen(false); // Close the sheet if setSheetOpen is provided
                  }
                }}
              >
                <Spacing direction="row" alignItems="center" gap="2" wrap="nowrap">
                  {selected === option.id && <Check className="h-4 w-4" />}
                  <Label
                    className={cn('text-left leading-5 p-1 !cursor-pointer', {
                      'font-regular': selected !== option.id,
                    })}
                  >
                    {option.label}
                  </Label>
                </Spacing>
              </CommandItem>
            ))}
          </CommandList>
        </div>
      </Card>
    )
  );
};

const labelScope = (props: { emptyText?: string; addHintText?: string; loadingText?: string; addNewText?: string }) => ({
  ...(props.emptyText !== undefined && { notFound: props.emptyText }),
  ...(props.addHintText !== undefined && { pressEnterToAdd: props.addHintText }),
  ...(props.loadingText !== undefined && { pleaseWait: props.loadingText }),
  ...(props.addNewText !== undefined && { addNew: props.addNewText }),
});

const SingleSelect: FC<SingleSelectProps> = ({ readOnly = false, ...props }) => {
  const l = useLabels();
  const generatedId = useId();
  const zero = usePreset() === 'zero';
  if (!readOnly) {
    return (
      <LabelScope labels={labelScope(props)}>
        <SingleSelectField {...props} />
      </LabelScope>
    );
  }
  const { label, options = [], selected = null, placeholder = l.searchEllipsis, className, invalid = false, ariaDescribedBy } = props;
  const id = props.id ?? generatedId;
  const text = options.find((option) => option.id === selected)?.label ?? selected;
  const valueInvalid = isCurrentValueInvalid({ options, selected, invalidValues: props.invalidValues, isValueInvalid: props.isValueInvalid, loading: props.loading });
  return (
    <Spacing direction="column" gap="2" wrap="nowrap">
      {label && (
        <Label id={singleSelectLabelId(id)} htmlFor={id} className="leading-4">
          {label}
        </Label>
      )}
      <div
        id={id}
        // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
        role="combobox"
        tabIndex={0}
        aria-readonly="true"
        aria-expanded="false"
        aria-haspopup="listbox"
        aria-labelledby={label ? singleSelectLabelId(id) : undefined}
        aria-label={label ? undefined : (props.ariaLabel ?? placeholder)}
        aria-invalid={invalid || valueInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        data-readonly=""
        className={cn(
          'flex w-full items-center border border-solid bg-muted text-sm',
          zero ? 'h-control-md border-input px-control-px-sm' : 'h-10 border-form-border-default px-2',
          'rounded-default focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:border-ring',
          'aria-[invalid=true]:border-error',
          className,
        )}
      >
        {text ? (
          <span className={cn(valueInvalid && 'text-text-destructive')} data-invalid={valueInvalid || undefined}>
            {text}
            {valueInvalid && <span className="sr-only">{l.invalidSuffix}</span>}
          </span>
        ) : (
          <span className="text-text-subtle">{placeholder}</span>
        )}
      </div>
    </Spacing>
  );
};

export { SingleSelect, SingleSelectProvider };
