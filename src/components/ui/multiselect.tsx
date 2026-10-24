'use client';

import { ChevronsUpDown, GripVertical, Loader2, PlusIcon, X } from 'lucide-react';
import { Dispatch, FC, ReactNode, SetStateAction, createContext, useContext, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { compositeFieldDefault, compositeFieldZero } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { isMobileDevice } from '../../lib/is-mobile';
import { Button } from './button';
import { Card } from './card/Card';
import { Checkbox } from './checkbox';
import { Chip } from './chip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Spacing } from './spacing';
import { LabelScope, useLabels, usePreset } from './labels-context';

export type MultiSelectOptionId = string;

export type MultiSelectOption = {
  label: string;
  id: MultiSelectOptionId;
  // Marks this value as invalid. Its chip uses the destructive look and is announced as invalid.
  invalid?: boolean;
};

type InvalidValueProps = {
  invalidValues?: MultiSelectOptionId[];
  isValueInvalid?: (id: MultiSelectOptionId) => boolean;
  loading?: boolean;
};

// A selected id that is not in the options is shown with its id as label (never an empty chip).
const resolveSelectedOption = (options: MultiSelectOption[] | undefined, id: MultiSelectOptionId): MultiSelectOption =>
  options?.find((option) => option.id === id) ?? { id, label: id };

// A selected value is invalid when the option says so, the consumer marks it, or it is not in the options (unless options are still loading).
const isSelectedValueInvalid = (options: MultiSelectOption[] | undefined, id: MultiSelectOptionId, { invalidValues, isValueInvalid, loading }: InvalidValueProps) => {
  const option = options?.find((o) => o.id === id);
  if (!option) return !loading;
  return Boolean(option.invalid) || Boolean(invalidValues?.includes(id)) || isValueInvalid?.(id) === true;
};

// Create a context for managing the currently open MultiSelect
export const MultiSelectContext = createContext<{
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
}>({
  openId: null,
  setOpenId: () => {},
});

interface MultiSelectProviderProps {
  children: React.ReactNode;
}

const MultiSelectProvider: FC<MultiSelectProviderProps> = ({ children }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return <MultiSelectContext.Provider value={{ openId, setOpenId }}>{children}</MultiSelectContext.Provider>;
};

export interface MultiSelectProps {
  // `sm` puts the field on the Button sm height (control-sm token: 32, zero 28): one row, compact search input and toggle. Chips inside wrap with a tighter gap and padding. `default` keeps the control-md field.
  size?: 'default' | 'sm';
  // Built-in texts. Each wins over the provider text.
  emptyText?: string;
  addHintText?: string;
  loadingText?: string;
  addNewText?: string;
  options: MultiSelectOption[];
  selected: MultiSelectOptionId[];
  onChange: Dispatch<SetStateAction<string[]>>;
  onAddItemClick?: (item: string) => void;
  placeholder?: string;
  loading?: boolean;
  defaultValue?: string;
  label?: string;
  id: string;
  disabled?: boolean;
  disableSearch?: boolean;
  chipsInside?: boolean;
  disableAddNew?: boolean;
  decentToggle?: boolean;
  useSheet?: boolean;
  useDragAndDrop?: boolean;
  dropdownClassName?: string;
  chipsAsCol?: boolean;
  disableCheckbox?: boolean;
  hideCheckedItems?: boolean;
  selectedOptionsAsText?: boolean;
  renderItem?: (option: MultiSelectOption) => React.ReactNode;
  onUpdateOrder?: (options: MultiSelectOption[]) => void;
  onlyCheckOnCheckbox?: boolean;
  orderCheckedOnTop?: boolean;
  selectedOptionsAsListItems?: boolean;
  chipVariant?: 'default' | 'secondary' | 'info' | 'success' | 'destructive';
  customAction?: React.ReactNode;
  customAddAction?: React.ReactNode;
  description?: string;
  useSheetText?: string;
  useSheetTrigger?: React.ReactNode;
  disableCheckAll?: boolean;
  highlightChipById?: MultiSelectOptionId[];
  isMobile?: boolean;
  icon?: ReactNode;
  mode?: 'default' | 'persistent';
  applyButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  disableBackdropClose?: boolean;
  truncateChips?: boolean;
  disableMaxChips?: boolean;
  maxChipsToShow?: number;
  /**
   * Forces the error-token treatment (`border-error`) on the trigger and sets `aria-invalid`,
   * mirroring `<SelectTrigger>`'s `aria-[invalid=true]:border-error` (select.tsx) so a required
   * MultiSelect can show the same validation-error state as the base Select (SELECT-MAT-07).
   */
  invalid?: boolean;
  /** Points to the id of an external error message, announced via `aria-describedby`. */
  ariaDescribedBy?: string;
  // Ids of selected values to show as invalid (destructive chip, announced as invalid). Same as `invalid: true` on the option.
  invalidValues?: MultiSelectOptionId[];
  // Decides per selected id whether the value is invalid. A selected id that is missing from `options` is always invalid (unless `loading`).
  isValueInvalid?: (id: MultiSelectOptionId) => boolean;
  // Accessible name of the field when there is no visible `label`. Falls back to the placeholder.
  ariaLabel?: string;
  // Shows the chosen values as plain chips on the muted read-only surface. Stays focusable (`aria-readonly`), cannot be opened or changed.
  readOnly?: boolean;
}

const multiSelectLabelId = (id?: string) => (id ? `${id}-label` : undefined);

const MultiSelectLabel: FC<{ label?: string; disabled?: boolean; htmlFor?: string }> = ({
  label,
  disabled = false,
  htmlFor = 'multiselect',
}) =>
  label ? (
    <Label id={multiSelectLabelId(htmlFor)} htmlFor={htmlFor} aria-disabled={disabled || undefined} className={cn('leading-4', disabled && 'opacity-disabled')}>
      {label}
    </Label>
  ) : (
    <></>
  );

const MultiSelectInput: FC<
  MultiSelectProps & {
    comboboxRef: React.RefObject<HTMLDivElement>;
    chipsInside?: boolean;
    height: number[];
    setOpenId: Dispatch<SetStateAction<string | null>>;
    open: boolean;
    id: string;
    disabled?: boolean;
    placeholder?: string;
    options?: MultiSelectOption[];
    selected?: MultiSelectOptionId[];
    handleUnselect: (item: MultiSelectOptionId) => void;
    disableSearch?: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    handleSearchChange: (value: string) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    decentToggle?: boolean;
    noButton?: boolean;
    onUpdateOrder: (options: MultiSelectOption[]) => void;
    useSheetText?: string;
    useSheetTrigger?: React.ReactNode;
    disableMaxChips?: boolean;
    maxChipsToShow?: number;
  }
> = ({
  comboboxRef,
  chipsInside,
  height,
  setOpenId,
  open,
  id,
  disabled,
  placeholder,
  options,
  selected,
  handleUnselect,
  disableSearch,
  inputRef,
  search,
  handleSearchChange,
  handleKeyDown,
  decentToggle,
  useSheet,
  useDragAndDrop,
  noButton = false,
  onChange,
  onUpdateOrder,
  chipVariant,
  useSheetText,
  useSheetTrigger,
  icon,
  disableMaxChips,
  maxChipsToShow = 3,
  invalid,
  ariaDescribedBy,
  label,
  ariaLabel,
  invalidValues,
  isValueInvalid,
  loading,
  size = 'default',
}) => {
  const l = useLabels();
  const zero = usePreset() === 'zero';
  const sm = size === 'sm';
  const invalidProps = { invalidValues, isValueInvalid, loading };
  const anyValueInvalid = (selected ?? []).some((id) => isSelectedValueInvalid(options, id, invalidProps));
  return (
  <div
    ref={comboboxRef}
    // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-labelledby={label ? multiSelectLabelId(id) : undefined}
    aria-disabled={disabled || undefined}
    aria-label={label ? undefined : (ariaLabel ?? placeholder ?? l.selectOptions)}
    aria-invalid={invalid || anyValueInvalid || undefined}
    aria-describedby={ariaDescribedBy}
    data-id={id}
    className={cn(
      'z-20',
      'flex',
      'flex-row',
      'items-center',
      'bg-background',
      'w-full',
      'justify-between',
      'border',
      'border-solid',
      ...(zero ? compositeFieldZero : compositeFieldDefault),
      // Size sm: min height is the control-sm token (border included), after the composite recipe so it wins.
      { 'min-h-[var(--size-control-sm)]': sm },
      { 'cursor-text': !useSheet },
      { 'cursor-pointer': useSheet },
      'rounded-default',
      'relative',
      'overflow-visible',
      { 'opacity-disabled cursor-not-allowed': disabled },
      { 'py-2': chipsInside && !sm && height[0] > 44 },
      { 'py-1': chipsInside && sm && height[0] > 32 },
    )}
  >
    <div
      className={cn(
        'flex flex-wrap items-center flex-grow-default [&_[cmdk-input-wrapper]]:flex-grow-default',
        sm ? 'gap-1' : 'gap-2',
        zero || sm ? 'min-h-0' : 'min-h-[40px]',
      )}
      onClick={() => setOpenId(id)}
    >
      {chipsInside &&
        (() => {
          const visibleItems = disableMaxChips ? selected : selected?.slice(0, maxChipsToShow) || [];
          const remainingCount = disableMaxChips ? 0 : (selected?.length || 0) - maxChipsToShow;

          return (
            <>
              {visibleItems.map((item, index) => (
                <DraggableChip
                  key={item}
                  option={resolveSelectedOption(options, item)}
                  index={index}
                  selected={selected}
                  onChange={onChange}
                  handleUnselect={handleUnselect}
                  disabled={disabled}
                  useDragAndDrop={useDragAndDrop}
                  options={options}
                  onUpdateOrder={onUpdateOrder}
                  chipVariant={chipVariant}
                  invalid={isSelectedValueInvalid(options, item, invalidProps)}
                />
              ))}
              {remainingCount > 0 && (
                <div
                  className={cn(
                    'flex items-center px-2 py-1 text-xs rounded-default bg-background-neutral-default text-text-subtle-on-muted',
                    'select-none',
                  )}
                >
                  +{remainingCount} {l.itemCount(remainingCount)}
                </div>
              )}
            </>
          );
        })()}
      {useSheet && (
        <span className="flex-grow-default text-sm leading-button-sm text-text-subtle">
          {useSheetText || l.addItems}
        </span>
      )}
      {!useSheet && !disableSearch && (
        <CommandInput
          icon={icon}
          id={'multiselect-input' + id}
          placeholder={placeholder}
          value={search}
          onValueChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          disabled={disabled}
          className={cn('flex-grow-default', sm ? 'h-6 py-0' : 'h-7')}
          autoFocus={false}
        />
      )}
    </div>
    {useSheet ? (
      <Button
        asChild
        disabled={disabled}
        variant="ghost"
        size="sm"
        className={cn(
          { 'hover:bg-transparent': decentToggle },
          'text-sm',
          sm ? 'h-control-xs' : 'h-control-sm',
          'p-2',
          'flex',
          'items-center',
          'justify-center',
          '[&_svg]:text-text-subtle',
          '[&_svg]:active:text-foreground-accent',
          'text-text-subtle',
          'active:text-foreground-accent',
          'flex flex-row gap-1',
        )}
        onClick={() => {
          open ? setOpenId(null) : setOpenId(id);
        }}
      >
        <span>
          {useSheetTrigger || (
            <>
              <PlusIcon className="h-4 w-4 min-w-[16px]" />
              Add
            </>
          )}
        </span>
      </Button>
    ) : (
      <>
        {!noButton && (
          <Button
            asChild
            disabled={disabled}
            variant="ghost"
            size="sm"
            className={cn(
              { 'hover:bg-transparent': decentToggle },
              sm ? 'h-control-xs' : 'h-control-sm',
              sm ? 'w-control-xs' : 'w-10',
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
            <span>
              <ChevronsUpDown className="h-4 w-4 min-w-[16px]" />
            </span>
          </Button>
        )}
      </>
    )}
  </div>
  );
};

const DraggableChip: FC<{
  option: MultiSelectOption;
  index: number;
  selected: MultiSelectOptionId[];
  onChange: Dispatch<SetStateAction<string[]>>;
  handleUnselect: (item: MultiSelectOptionId) => void;
  disabled?: boolean;
  useDragAndDrop?: boolean;
  selectedOptionsAsText?: boolean;
  chipsAsCol?: boolean;
  onUpdateOrder: (updatedOptions: MultiSelectOption[]) => void;
  options: MultiSelectOption[];
  selectedOptionsAsListItems?: boolean;
  chipVariant?: 'default' | 'secondary' | 'info' | 'success' | 'destructive';
  truncateChips?: boolean;
  invalid?: boolean;
}> = ({
  option,
  index,
  handleUnselect,
  disabled,
  useDragAndDrop,
  selectedOptionsAsText,
  chipsAsCol,
  onUpdateOrder,
  options,
  selectedOptionsAsListItems,
  chipVariant,
  truncateChips,
  invalid,
}) => {
  const l = useLabels();
  const zero = usePreset() === 'zero';
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'chip',
    hover(item: { index: number }) {
      if (item.index === index) return;

      const updatedOptions = [...options];
      const draggedOption = updatedOptions.splice(item.index, 1)[0];
      updatedOptions.splice(index, 0, draggedOption);

      onUpdateOrder(updatedOptions);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'chip',
    item: { type: 'chip', index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (useDragAndDrop) {
    drag(drop(ref));
  }

  return (
    <>
      {useDragAndDrop && (
        <div
          className={cn(
            { 'border-2 border-solid border-primary rounded-checkbox': isDragging },
            { 'h-auto': isDragging && !chipsAsCol },
            { 'w-full': isDragging && chipsAsCol },
          )}
        />
      )}
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          { 'list-item list-disc ml-4': selectedOptionsAsListItems },
          { 'cursor-move': useDragAndDrop },
          { ' w-fit': !chipsAsCol },
          { ' w-full': chipsAsCol },
          { 'p-0': selectedOptionsAsText },
          { ' px-2 py-1': useDragAndDrop && !selectedOptionsAsText },
          { 'bg-background-neutral-default rounded-default': isDragging },
        )}
      >
        {useDragAndDrop && <GripVertical className="min-w-[15px] mr-2 text-text-subtle cursor-move" />}
        {selectedOptionsAsText ? (
          <div
            key={option?.id}
            aria-invalid={invalid || undefined}
            data-invalid={invalid || undefined}
            className={cn(
              'leading-0 text-sm flex flex-row items-center',
              { 'text-text-destructive': invalid },
              { 'cursor-move': useDragAndDrop },
              { 'cursor-text': !useDragAndDrop },
              { disabled: 'text-text-subtle' },
            )}
          >
            {option?.label}
            {invalid && <span className="sr-only">{l.invalidSuffix}</span>}
            <button
              type="button"
              aria-label={l.remove(option?.label)}
              className={cn(
                'ml-1',
                'h-6',
                'w-6',
                'rounded-item',
                'outline-none',
                'focus-visible:ring-focus',
                'focus-visible:ring-ring-default',
                'focus-visible:ring-offset-focus',
                'focus-visible:ring-offset-background',
                'flex justify-center items-center',
                'text-icon-subtle hover:text-icon-default',
                'disabled:pointer-events-none',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(option?.id)}
              disabled={disabled}
            >
              <X aria-hidden="true" className={cn('h-icon-xs', 'w-icon-xs', { hidden: disabled })} />
            </button>
          </div>
        ) : (
          <Chip
            key={option?.id}
            variant={chipVariant}
            invalid={invalid}
            tinted={invalid ? true : undefined}
            size={zero ? 'compact' : undefined}
            className={cn(
              'items-center',
              { 'cursor-move': useDragAndDrop },
              { 'cursor-text': !useDragAndDrop },
              { 'max-w-[200px]': truncateChips },
              { 'border-error': invalid },
            )}
            disabled={disabled}
            label={option?.label}
            onRemove={disabled ? undefined : () => handleUnselect(option?.id)}
            removeLabel={l.remove(option?.label)}
          />
        )}
      </div>
    </>
  );
};

const MultiSelectDropdownActions: FC<{
  disableAddNew?: boolean;
  disabled?: boolean;
  loading?: boolean;
  handleDialogSubmit: () => void;
  search: string;
  isNewItem: (item: string) => boolean;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  useSheet?: boolean;
  disableCheckAll?: boolean;
  options: MultiSelectOption[];
  selected: MultiSelectOptionId[];
  onChange: Dispatch<SetStateAction<string[]>>;
  mode?: 'default' | 'persistent';
  hasChanges?: boolean;
  onApply?: () => void;
  onCancel?: () => void;
  applyButtonText?: string;
  cancelButtonText?: string;
  disableBackdropClose?: boolean;
  customAction?: React.ReactNode;
  customAddAction?: React.ReactNode;
}> = ({
  disableAddNew,
  disabled,
  loading,
  handleDialogSubmit,
  search,
  isNewItem,
  setOpenId,
  useSheet,
  disableCheckAll,
  options,
  selected,
  onChange,
  mode,
  hasChanges,
  onApply,
  onCancel,
  applyButtonText,
  cancelButtonText,
  disableBackdropClose,
  customAction,
  customAddAction,
}) => {
  const l = useLabels();
  const handleCheckAll = () => {
    const allSelected = options.map((option) => option.id);
    onChange(allSelected);
  };

  const handleUncheckAll = () => {
    onChange([]);
  };

  const getCheckboxState = () => {
    if (selected.length === options.length) {
      return 'checked';
    } else if (selected.length > 0) {
      return 'indeterminate';
    } else {
      return 'unchecked';
    }
  };

  return (
    <>
      <Spacing alignItems="center" direction="row" justifyContent="between">
        <Spacing direction="row" alignItems="center" justifyContent="start">
          {!disableCheckAll && (
            <div className="flex justify-end">
              {getCheckboxState() === 'checked' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUncheckAll}
                  disabled={disabled}
                  className="text-sm px-2"
                >
                  {l.uncheckAll}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleCheckAll} disabled={disabled} className="text-sm px-2">
                  {getCheckboxState() === 'indeterminate'
                    ? l.checkAll
                    : getCheckboxState() === 'unchecked'
                    ? l.checkAll
                    : l.uncheckAll}
                </Button>
              )}
            </div>
          )}
          {!disableAddNew && !customAction && !customAddAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDialogSubmit}
              disabled={loading || disabled || !isNewItem(search)}
              className="text-sm px-2"
            >
              {loading ? (
                <Spacing direction="row" gap="1" alignItems="center" className="text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {l.pleaseWait}
                </Spacing>
              ) : (
                l.add
              )}
            </Button>
          )}
          {customAddAction}
        </Spacing>
        <Spacing direction="row" className="self-end" alignItems="center">
          {mode === 'persistent' ? (
            <>
              <Button variant="outline" size="sm" onClick={onCancel} className="text-sm px-2 mr-2">
                {cancelButtonText || l.cancel}
              </Button>
              <Button variant="default" size="sm" onClick={onApply} className="text-sm px-2" disabled={!hasChanges}>
                {applyButtonText || l.apply}
              </Button>
            </>
          ) : (
            <>
              {useSheet ? (
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" onClick={() => setOpenId(null)} className="text-sm px-2">
                    {l.close} <span className="ml-1 font-regular">{l.autosaveHint}</span>
                  </Button>
                </SheetClose>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setOpenId(null)} className="text-sm px-2">
                  {l.close} <span className="ml-1 font-regular">{l.autosaveHint}</span>
                </Button>
              )}
            </>
          )}
        </Spacing>
      </Spacing>
      {/*
        `text-general-warning-hover` — the same warning-role token Alert's `warning` variant
        uses for its text (alert.tsx), not a raw `amber-600` swatch (SELECT-MAT-04).
      */}
      {mode === 'persistent' && hasChanges && (
        <div className="mt-2 text-sm text-general-warning-hover text-center">{l.unsavedChanges}</div>
      )}
      <hr className="mt-2 mb-4" />
    </>
  );
};

const MultiSelectDropdown: FC<
  MultiSelectProps & {
    id: string;
    options: MultiSelectOption[];
    selected: MultiSelectOptionId[];
    onChange: Dispatch<SetStateAction<string[]>>;
    handleDialogSubmit: () => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
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
    inputRef: React.RefObject<HTMLInputElement>;
    setOpenId: Dispatch<SetStateAction<string | null>>;
    useSheet?: boolean;
    useDragAndDrop?: boolean;
    mode?: 'default' | 'persistent';
    hasChanges?: boolean;
    onApply?: () => void;
    onCancel?: () => void;
    applyButtonText?: string;
    cancelButtonText?: string;
    disableBackdropClose?: boolean;
    customAddAction?: React.ReactNode;
  }
> = ({
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
  disableCheckbox,
  hideCheckedItems,
  renderItem,
  onlyCheckOnCheckbox,
  orderCheckedOnTop, // New prop
  isMobile,
  disableCheckAll,
  mode,
  hasChanges,
  onApply,
  onCancel,
  applyButtonText,
  cancelButtonText,
  disableBackdropClose,
  customAction,
  customAddAction,
}) => {
  const l = useLabels();
  const isVisible = useSheet ? true : open;

  const multiSelectDropdownActionsProps = {
    disableAddNew,
    disableCheckAll,
    disabled,
    loading,
    handleDialogSubmit,
    search,
    isNewItem,
    setOpenId,
    useSheet,
    onlyCheckOnCheckbox,
    options,
    selected,
    onChange,
    mode,
    hasChanges,
    onApply,
    onCancel,
    applyButtonText,
    cancelButtonText,
    disableBackdropClose,
    customAction,
    customAddAction,
  };

  const multiSelectCommandItemProps = {
    selected,
    onChange,
    setSearch,
    inputRef,
    setOpenId,
    id,
    disabled,
    disableCheckbox,
    renderItem,
    onlyCheckOnCheckbox,
    isMobile,
  };

  const sortedOptions = orderCheckedOnTop
    ? options.slice().sort((a, b) => {
        const aSelected = selected.includes(a.id);
        const bSelected = selected.includes(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return 0;
      })
    : options;

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
          { 'mt-[-4px] z-10': useSheet },
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
        <div>
          <MultiSelectDropdownActions {...multiSelectDropdownActionsProps} />

          <CommandList>
            <CommandEmpty className="px-2 pt-2 pb-4 text-sm text-text-subtle text-center">
              <Spacing direction="column">
                <span>{l.notFound}</span>
                <span className="opacity-disabled">{l.pressEnterToAdd}</span>
              </Spacing>
            </CommandEmpty>
            {sortedOptions.length > 0 &&
              sortedOptions
                .filter((option) => !hideCheckedItems || !selected.includes(option.id))
                .map((option) => (
                  <MultiSelectCommandItem {...multiSelectCommandItemProps} option={option} key={option.id} />
                ))}
          </CommandList>
        </div>
      </Card>
    )
  );
};

const MultiSelectCommandItem: FC<{
  option: MultiSelectOption;
  selected: MultiSelectOptionId[];
  onChange: Dispatch<SetStateAction<string[]>>;
  setSearch: Dispatch<SetStateAction<string>>;
  inputRef: React.RefObject<HTMLInputElement>;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  id: string;
  disabled?: boolean;
  disableCheckbox?: boolean;
  renderItem?: (option: MultiSelectOption) => React.ReactNode;
  onlyCheckOnCheckbox?: boolean;
  isMobile?: boolean;
}> = ({
  option,
  selected,
  onChange,
  setSearch,
  inputRef,
  setOpenId,
  id,
  disabled,
  disableCheckbox,
  renderItem,
  onlyCheckOnCheckbox,
  isMobile,
}) => {
  return (
    <CommandItem
      className={cn(
        // Selected/checked item — same token pairing as Select's own
        // `data-[state=checked]:bg-background-accent` (SELECT-MAT-04). The previous
        // `aria-selected:!bg-slate-200`/`!border-slate-300` `!important` overrides are
        // dropped entirely: CommandItem (command.tsx) already applies
        // `aria-selected:bg-menu-background-hover aria-selected:text-foreground-accent` for
        // the keyboard/pointer-highlighted row, and Checkbox already carries its own
        // `border-checkbox-border-default` token for the unchecked state — no override needed.
        { 'bg-background-accent text-foreground-accent': !onlyCheckOnCheckbox && selected?.includes(option.id) },
        { '!bg-transparent !cursor-text': onlyCheckOnCheckbox },
        'w-full',
      )}
      key={option.id}
      onSelect={
        onlyCheckOnCheckbox
          ? undefined
          : () => {
              if (!disabled) {
                onChange((prevSelected) =>
                  prevSelected.includes(option.id)
                    ? prevSelected.filter((item) => item !== option.id)
                    : [...prevSelected, option.id],
                );
                // Keep search and selection state
                setOpenId(id);
              }
            }
      }
      onKeyDown={(e) => {
        if (e.key === ' ' && !disabled) {
          // Space key - toggle selection
          e.preventDefault();
          e.stopPropagation();
          onChange((prevSelected) =>
            prevSelected.includes(option.id)
              ? prevSelected.filter((item) => item !== option.id)
              : [...prevSelected, option.id],
          );
          setOpenId(id);
        } else if (e.key === 'Tab' && !e.shiftKey) {
          // Tab - return to search
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.focus();
        }
        // Let cmdk handle Enter and arrow keys
      }}
    >
      <Spacing direction="row" alignItems="center" gap="2" wrap="nowrap" className="w-full">
        {!disableCheckbox && (
          <Checkbox
            className="ml-2"
            checked={selected?.includes(option.id)}
            disabled={disabled}
            onClick={
              onlyCheckOnCheckbox
                ? () => {
                    if (!disabled) {
                      onChange((prevSelected) =>
                        prevSelected.includes(option.id)
                          ? prevSelected.filter((item) => item !== option.id)
                          : [...prevSelected, option.id],
                      );
                      // Keep search and selection state when clicking checkbox
                      setOpenId(id);
                    }
                  }
                : undefined
            }
          />
        )}
        {renderItem ? (
          renderItem(option)
        ) : (
          <Label
            className={cn(
              { 'font-regular ': !selected?.includes(option.id) },
              'text-left leading-5 p-1 !cursor-pointer truncate',
            )}
            title={option.label}
          >
            {option.label}
          </Label>
        )}
      </Spacing>
    </CommandItem>
  );
};

const MultiSelectField: FC<MultiSelectProps> = ({
  options = [],
  selected = [],
  onChange,
  onAddItemClick,
  placeholder: placeholderProp,
  loading = false,
  defaultValue = '',
  label,
  id,
  disabled = false,
  disableSearch = false,
  chipsInside = false,
  disableAddNew = false,
  decentToggle = false,
  useSheet = false,
  useDragAndDrop = false,
  dropdownClassName = '[&_[cmdk-list-sizer]]:max-h-[250px]',
  chipsAsCol = false,
  disableCheckbox = false,
  hideCheckedItems = false,
  selectedOptionsAsText = false,
  selectedOptionsAsListItems = false,
  renderItem,
  onUpdateOrder = () => {},
  onlyCheckOnCheckbox = false,
  orderCheckedOnTop = false,
  chipVariant = 'info',
  customAction = null,
  customAddAction = null,
  description,
  useSheetText,
  useSheetTrigger,
  disableCheckAll = false,
  highlightChipById = [],
  isMobile = false,
  icon,
  mode = 'default',
  applyButtonText: applyButtonTextProp,
  cancelButtonText: cancelButtonTextProp,
  onCancel,
  disableBackdropClose = false,
  truncateChips = false,
  disableMaxChips = false,
  maxChipsToShow = 3,
  invalid = false,
  ariaDescribedBy,
  ariaLabel,
  invalidValues,
  isValueInvalid,
  size = 'default',
}) => {
  const l = useLabels();
  const placeholder = placeholderProp ?? l.searchEllipsis;
  const applyButtonText = applyButtonTextProp ?? l.apply;
  const cancelButtonText = cancelButtonTextProp ?? l.cancel;
  const { openId, setOpenId } = useContext(MultiSelectContext);
  const [search, setSearch] = useState(defaultValue);
  const [height, setHeight] = useState<number[]>([]);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const labelHeight = label ? 36 : 0;
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const chipWrapperRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const initialHeight = size === 'sm' ? 32 : 44;

  // State for persistent mode
  const [tempSelected, setTempSelected] = useState<string[]>(selected);
  const [hasChanges, setHasChanges] = useState(false);

  const open = openId === id;

  // Update temp selections when selected prop changes (for persistent mode)
  useEffect(() => {
    if (mode === 'persistent') {
      setTempSelected(selected);
      setHasChanges(false);
    }
  }, [selected, mode]);

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
          `position: fixed; top: 0; height: 100% !important; width: ${
            rectCombobox.width ? rectCombobox.width : 0
          }px !important;`,
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
    const chipWrapper = chipWrapperRef.current;
    const dropdown = dropdownRef.current;
    if (combobox) observer.observe(combobox);
    if (chipWrapper) observer.observe(chipWrapper);

    return () => {
      if (combobox) observer.unobserve(combobox);
      if (chipWrapper) observer.unobserve(chipWrapper);
      if (dropdown) observer.unobserve(dropdown);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, selected, disableAddNew, useSheet, initialHeight]);

  useEffect(() => {
    const isMobileDev = isMobileDevice();
    if (open && inputRef.current && !isMobileDev && !useSheet) {
      inputRef.current.focus();
    }
  }, [open, useSheet]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.blur();
    }, 0);
  }, []);

  // Check for changes in persistent mode
  useEffect(() => {
    if (mode === 'persistent') {
      const hasChanges = JSON.stringify(tempSelected.sort()) !== JSON.stringify(selected.sort());
      setHasChanges(hasChanges);
    }
  }, [tempSelected, selected, mode]);

  const handleUnselect = (item: MultiSelectOptionId) => {
    if (mode === 'persistent') {
      setTempSelected((prevSelected) => prevSelected.filter((i) => i !== item));
    } else {
      onChange((prevSelected) => prevSelected.filter((i) => i !== item));
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    if (!disableBackdropClose) {
      setOpenId(null);
    }
    setHasChanges(false);
  };

  const handleCancel = () => {
    setTempSelected(selected);
    setHasChanges(false);
    if (onCancel) {
      onCancel();
    } else if (!disableBackdropClose) {
      setOpenId(null);
    }
  };

  const isNewItem = (item: string) => options?.every((option) => option.label !== item.trim());

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
      if (mode === 'persistent') {
        setTempSelected((prevSelected) => prevSelected.slice(0, -1));
      } else {
        onChange((prevSelected) => prevSelected.slice(0, -1));
      }
    }

    // Handle Enter key - only trigger add new when there are NO matches
    if (e.key === 'Enter' && search.trim() && !disableAddNew) {
      // Only prevent default and show add dialog if there are no filtered matches
      if (!hasFilteredMatches(search) && isNewItem(search)) {
        e.preventDefault();
        setNewItemLabel(search.trim());
        setDialogOpen(true);
      }
      // Otherwise, let cmdk handle the Enter key to select/toggle the first match
    }

    // Note: Arrow keys are handled by cmdk itself for navigation
    // We don't need to handle them manually
  };

  const topDistances = () => {
    if (dropdownDirection === 'up') return undefined;

    const inputHeight = height[0];
    const chipsHeight = height[1];
    const chipsOutside = !chipsInside;

    if (chipsOutside) {
      const currentSelected = mode === 'persistent' ? tempSelected : selected;
      if (currentSelected.length === 0) {
        return inputHeight + labelHeight;
      } else {
        return inputHeight + chipsHeight + labelHeight + 4;
      }
    }

    if (chipsInside) {
      return inputHeight < initialHeight ? inputHeight + labelHeight : inputHeight + labelHeight + (size === 'sm' ? 4 : 12);
    }
  };

  const multiSelectInputProps = {
    setSearch,
    onChange: mode === 'persistent' ? setTempSelected : onChange,
    comboboxRef,
    chipsInside,
    height,
    setOpenId,
    open,
    id,
    disabled,
    placeholder,
    options,
    selected: mode === 'persistent' ? tempSelected : selected,
    handleUnselect,
    disableSearch,
    inputRef,
    search,
    handleSearchChange,
    handleKeyDown,
    decentToggle,
    useSheet,
    onUpdateOrder,
    chipVariant,
    useSheetText,
    useSheetTrigger,
    icon,
    disableMaxChips,
    maxChipsToShow,
    invalid,
    ariaDescribedBy,
    label,
    ariaLabel,
    invalidValues,
    isValueInvalid,
    loading,
    size,
  };

  const multiSelectChipsProps = {
    selected: mode === 'persistent' ? tempSelected : selected,
    options,
    handleUnselect,
    chipWrapperRef,
    disabled,
    chipsInside,
    onChange: mode === 'persistent' ? setTempSelected : onChange,
    useDragAndDrop,
    id,
    chipsAsCol,
    selectedOptionsAsText,
    onUpdateOrder,
    selectedOptionsAsListItems,
    chipVariant,
    highlightChipById,
    truncateChips,
    disableMaxChips,
    maxChipsToShow,
    invalidValues,
    isValueInvalid,
    loading,
  };

  const multiSelectDropdownProps = {
    id,
    options,
    selected: mode === 'persistent' ? tempSelected : selected,
    onChange: mode === 'persistent' ? setTempSelected : onChange,
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
    useDragAndDrop,
    dropdownClassName,
    disableCheckbox,
    hideCheckedItems,
    renderItem,
    onUpdateOrder,
    onlyCheckOnCheckbox,
    orderCheckedOnTop,
    disableCheckAll,
    isMobile,
    mode,
    hasChanges,
    onApply: handleApply,
    onCancel: handleCancel,
    applyButtonText,
    cancelButtonText,
    customAction,
    customAddAction,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {useSheet ? (
        <Sheet>
          <Spacing direction="column" gap="2" wrap="nowrap">
            {customAction ? (
              <Spacing direction="row" justifyContent="between" alignItems="center">
                <MultiSelectLabel label={label} disabled={disabled} htmlFor={id} />
                {customAction}
              </Spacing>
            ) : (
              <MultiSelectLabel label={label} disabled={disabled} htmlFor={id} />
            )}
            {description && <span className="text-sm text-text-subtle leading-lg">{description}</span>}
            {!chipsInside && <MultiSelectChips {...multiSelectChipsProps} />}
            <SheetTrigger className="w-full text-left">
              <MultiSelectInput {...multiSelectInputProps} />
            </SheetTrigger>
          </Spacing>
          <SheetContent
            side={isMobile || isMobileDevice() ? 'bottom' : 'right'}
            className={cn('overflow-y-auto', (isMobile || isMobileDevice()) && 'h-[90vh]')}
            onInteractOutside={disableBackdropClose ? (e) => e.preventDefault() : undefined}
          >
            <SheetHeader className="mb-6">
              {customAction ? (
                <Spacing direction="row" justifyContent="between" alignItems="center">
                  <SheetTitle>{label}</SheetTitle>
                  <div className="mr-4">{customAction}</div>
                </Spacing>
              ) : (
                <SheetTitle>{label}</SheetTitle>
              )}
              {description && <span className="text-sm text-text-subtle leading-lg">{description}</span>}
            </SheetHeader>
            <Spacing direction="column" gap="2" className="relative" wrap="nowrap">
              {!chipsInside && <MultiSelectChips {...multiSelectChipsProps} />}
              <Command className="w-full command" vimBindings={false}>
                <MultiSelectInput {...multiSelectInputProps} useSheet={false} noButton />
                <CommandGroup className="[&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:nowrap">
                  <MultiSelectDropdown {...multiSelectDropdownProps} useSheet={true} />
                </CommandGroup>
              </Command>
            </Spacing>
            {mode === 'persistent' && disableBackdropClose && (
              <SheetFooter className="mt-4">
                <SheetClose asChild>
                  <Button variant="ghost" size="sm">
                    {l.close}
                  </Button>
                </SheetClose>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Spacing direction="column" gap="2" className="relative" wrap="nowrap">
          {customAction ? (
            <Spacing direction="row" justifyContent="between" alignItems="center">
              <MultiSelectLabel label={label} disabled={disabled} htmlFor={id} />
              {customAction}
            </Spacing>
          ) : (
            <MultiSelectLabel label={label} disabled={disabled} htmlFor={id} />
          )}
          {description && <span className="text-sm text-text-subtle leading-lg">{description}</span>}
          {!chipsInside && <MultiSelectChips {...multiSelectChipsProps} />}
          <Command className="w-full command" vimBindings={false}>
            <MultiSelectInput {...multiSelectInputProps} />
            <CommandList className={dropdownClassName}>
              <CommandGroup>
                <MultiSelectDropdown {...multiSelectDropdownProps} />
              </CommandGroup>
            </CommandList>
          </Command>
        </Spacing>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
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
              <Button size="sm" variant="ghost" className="ml-2" disabled={disabled}>
                {l.cancel}
              </Button>
            </DialogClose>
            <Button
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
    </DndProvider>
  );
};

const MultiSelectChips: FC<
  MultiSelectProps & {
    chipWrapperRef: React.RefObject<HTMLDivElement>;
    handleUnselect: (item: MultiSelectOptionId) => void;
    disabled?: boolean;
    chipsInside?: boolean;
    useDragAndDrop?: boolean;
    onUpdateOrder: (options: MultiSelectOption[]) => void;
    highlightChipById?: MultiSelectOptionId[];
    truncateChips?: boolean;
    disableMaxChips?: boolean;
    maxChipsToShow?: number;
  } & InvalidValueProps
> = ({
  selected,
  options,
  handleUnselect,
  chipWrapperRef,
  disabled,
  onChange,
  useDragAndDrop,
  chipsAsCol,
  selectedOptionsAsText,
  onUpdateOrder,
  selectedOptionsAsListItems,
  chipVariant,
  highlightChipById = [],
  truncateChips,
  disableMaxChips = false,
  maxChipsToShow = 3,
  invalidValues,
  isValueInvalid,
  loading,
}) => {
  const l = useLabels();
  const invalidProps = { invalidValues, isValueInvalid, loading };
  const visibleItems = disableMaxChips ? selected : selected.slice(0, maxChipsToShow);
  const remainingCount = disableMaxChips ? 0 : selected.length - maxChipsToShow;

  return (
    selected.length > 0 && (
      <div ref={chipWrapperRef} className={cn('flex flex-wrap gap-1 items-stretch', { 'flex-col': chipsAsCol })}>
        {visibleItems.map((item, index) => (
          <DraggableChip
            key={item}
            option={resolveSelectedOption(options, item)}
            index={index}
            selected={selected}
            onChange={onChange}
            handleUnselect={handleUnselect}
            disabled={disabled}
            useDragAndDrop={useDragAndDrop}
            selectedOptionsAsText={selectedOptionsAsText}
            chipsAsCol={chipsAsCol}
            onUpdateOrder={onUpdateOrder}
            options={selected.map((id) => resolveSelectedOption(options, id))}
            selectedOptionsAsListItems={selectedOptionsAsListItems}
            chipVariant={highlightChipById.includes(item) ? 'info' : chipVariant}
            truncateChips={truncateChips}
            invalid={isSelectedValueInvalid(options, item, invalidProps)}
          />
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'flex items-center px-2 py-1 text-xs rounded-default bg-background-neutral-default text-text-subtle-on-muted',
              'select-none',
            )}
          >
            +{remainingCount} {l.itemCount(remainingCount)}
          </div>
        )}
      </div>
    )
  );
};

const labelScope = (props: { emptyText?: string; addHintText?: string; loadingText?: string; addNewText?: string }) => ({
  ...(props.emptyText !== undefined && { notFound: props.emptyText }),
  ...(props.addHintText !== undefined && { pressEnterToAdd: props.addHintText }),
  ...(props.loadingText !== undefined && { pleaseWait: props.loadingText }),
  ...(props.addNewText !== undefined && { addNew: props.addNewText }),
});

const MultiSelect: FC<MultiSelectProps> = ({ readOnly = false, ...props }) => {
  const l = useLabels();
  const zero = usePreset() === 'zero';
  if (!readOnly) {
    return (
      <LabelScope labels={labelScope(props)}>
        <MultiSelectField {...props} />
      </LabelScope>
    );
  }
  const { id, label, options = [], selected = [], placeholder = l.searchEllipsis, className, invalid = false, ariaDescribedBy } = props as MultiSelectProps & { className?: string };
  const chosen = selected.map((id) => resolveSelectedOption(options, id));
  const invalidProps = { invalidValues: props.invalidValues, isValueInvalid: props.isValueInvalid, loading: props.loading };
  const anyValueInvalid = chosen.some((option) => isSelectedValueInvalid(options, option.id, invalidProps));
  return (
    <Spacing direction="column" gap="2" wrap="nowrap">
      {label && <MultiSelectLabel label={label} htmlFor={id} />}
      <div
        id={id}
        // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- ARIA 1.2: aria-controls is required only while the lazily mounted list is expanded
        role="combobox"
        tabIndex={0}
        aria-readonly="true"
        aria-expanded="false"
        aria-haspopup="listbox"
        aria-labelledby={label ? multiSelectLabelId(id) : undefined}
        aria-label={label ? undefined : (props.ariaLabel ?? placeholder)}
        aria-invalid={invalid || anyValueInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        data-readonly=""
        className={cn(
          'flex w-full flex-wrap items-center gap-2 border border-solid bg-muted text-sm',
          zero ? 'min-h-[var(--size-control-md)] border-input px-control-px-sm py-1' : 'border-form-border-default px-2 py-1',
          props.size === 'sm' && 'min-h-[var(--size-control-sm)] gap-1 py-0',
          'rounded-default focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:border-ring',
          'aria-[invalid=true]:border-error',
          className,
        )}
      >
        {chosen.length > 0 ? (
          chosen.map((option) => {
            const optionInvalid = isSelectedValueInvalid(options, option.id, invalidProps);
            return <Chip key={option.id} label={option.label} variant="outline" size="control" invalid={optionInvalid} tinted={optionInvalid ? true : undefined} className={cn(optionInvalid && 'border-error')} />;
          })
        ) : (
          <span className="text-text-subtle">{placeholder}</span>
        )}
      </div>
    </Spacing>
  );
};

export {
  MultiSelect,
  MultiSelectChips,
  MultiSelectCommandItem,
  MultiSelectDropdown,
  MultiSelectDropdownActions,
  MultiSelectInput,
  MultiSelectLabel,
  MultiSelectProvider,
};
