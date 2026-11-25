'use client';

import * as React from 'react';

import { invalidRing, overlaySurface, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { useLabels } from '@/components/ui/labels-context';

export interface TagSuggestion {
  // Value that becomes the tag.
  value: string;
  // Text shown in the list and on the chip. Defaults to the value.
  label?: string;
  // Groups the entry under a heading. Entries without a category come first, ungrouped.
  category?: string;
}

export interface TagInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  // Marks a tag invalid (shown with the invalid chip look and announced). Invalid tags are kept so the user can fix them.
  validate?: (tag: string) => boolean;
  maxTags?: number;
  // Characters that commit the draft besides Enter. Pasted text is split on these and on line breaks.
  delimiters?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  // `multiline` is the taller, textarea-like field (Figma InputTextArea Type=Tags).
  multiline?: boolean;
  // Accessible name of the text field.
  inputLabel?: string;
  name?: string;
  // Values offered while typing. The field becomes a combobox: ArrowDown and ArrowUp move through the list, Enter picks, Escape closes. Typed text that is not a suggestion can still be added.
  // Entries may be plain strings or `{ value, label, category }`. Categories render as labelled groups.
  suggestions?: Array<string | TagSuggestion>;
}

// Field that turns typed or pasted values into removable chips (Figma Input Variant=Chips, InputTextArea Type=Tags).
const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      className,
      value,
      defaultValue = [],
      onValueChange,
      placeholder,
      validate,
      maxTags,
      delimiters = [',', ';'],
      disabled = false,
      readOnly = false,
      invalid = false,
      multiline = false,
      inputLabel: inputLabelProp,
      name,
      suggestions,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const inputLabel = inputLabelProp ?? l.addTag;
    const [inner, setInner] = React.useState(defaultValue);
    const tags = value ?? inner;
    const [draft, setDraft] = React.useState('');
    const [announcement, setAnnouncement] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const listId = React.useId();
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState(-1);
    const query = draft.trim().toLowerCase();
    const entries: TagSuggestion[] = React.useMemo(() => (suggestions ?? []).map((entry) => (typeof entry === 'string' ? { value: entry } : entry)), [suggestions]);
    const labelOf = (entry: TagSuggestion) => entry.label ?? entry.value;
    const filtered = entries.filter((entry) => !tags.includes(entry.value) && (labelOf(entry).toLowerCase().includes(query) || entry.value.toLowerCase().includes(query)));
    // Ungrouped entries first, then each category in order of first appearance, so the visual order matches the keyboard order.
    const categories = Array.from(new Set(filtered.map((entry) => entry.category).filter((category): category is string => Boolean(category))));
    const options = [...filtered.filter((entry) => !entry.category), ...categories.flatMap((category) => filtered.filter((entry) => entry.category === category))];
    const chipLabel = (tag: string) => {
      const match = entries.find((entry) => entry.value === tag);
      return match ? labelOf(match) : tag;
    };
    const expanded = open && options.length > 0 && !readOnly && !disabled;
    // An open list owns the first Escape. Sheets and dialogs listen on the document, so the key is taken on the window in the capture phase, before any of them sees it.
    React.useEffect(() => {
      if (!expanded) return undefined;
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.target !== inputRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        setActive(-1);
      };
      window.addEventListener('keydown', onKey, true);
      return () => window.removeEventListener('keydown', onKey, true);
    }, [expanded]);
    const optionId = (index: number) => `${listId}-option-${index}`;

    const commitTags = (next: string[]) => {
      setInner(next);
      onValueChange?.(next);
    };

    const add = (raw: string[]) => {
      const cleaned = raw.map((entry) => entry.trim()).filter(Boolean);
      const fresh = cleaned.filter((entry, index) => !tags.includes(entry) && cleaned.indexOf(entry) === index);
      const room = maxTags == null ? fresh : fresh.slice(0, Math.max(maxTags - tags.length, 0));
      if (room.length === 0) return;
      commitTags([...tags, ...room]);
      setAnnouncement(l.tagsAdded(room.join(', ')));
    };

    const remove = (tag: string) => {
      commitTags(tags.filter((entry) => entry !== tag));
      setAnnouncement(l.tagRemoved(tag));
      inputRef.current?.focus();
    };

    const pick = (entry: string) => {
      add([entry]);
      setDraft('');
      setOpen(false);
      setActive(-1);
      inputRef.current?.focus();
    };

    const splitter = new RegExp(`[\\n${delimiters.map((d) => d.replace(/[\\^\]-]/g, '\\$&')).join('')}]`);
    const atLimit = maxTags != null && tags.length >= maxTags;

    return (
      <div
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          suggestions && 'relative',
          'flex w-full flex-wrap items-center gap-2 rounded-control border border-solid border-input bg-background px-3 py-2',
          multiline && 'min-h-textarea items-start',
          transitionBase,
          'hover:border-border-bold hover:shadow-field-hover',
          'focus-within:border-ring focus-within:ring-focus focus-within:ring-offset-focus focus-within:ring-offset-background focus-within:ring-ring-default',
          'data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/20',
          'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-disabled',
          readOnly && 'bg-muted hover:border-input hover:shadow-none',
          className,
        )}
        onClick={() => inputRef.current?.focus()}
        {...props}
      >
        {tags.map((tag) => {
          const bad = validate ? !validate(tag) : false;
          return (
            <Chip
              key={tag}
              variant="outline"
              size="control"
              label={chipLabel(tag)}
              invalid={bad}
              disabled={disabled}
              onRemove={readOnly || disabled ? undefined : () => remove(tag)}
              removeLabel={l.remove(tag)}
            />
          );
        })}
        {readOnly || atLimit ? null : (
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="text"
            value={draft}
            disabled={disabled}
            placeholder={tags.length === 0 ? placeholder : undefined}
            aria-label={inputLabel}
            aria-invalid={invalid || undefined}
            role={suggestions ? 'combobox' : undefined}
            aria-autocomplete={suggestions ? 'list' : undefined}
            aria-expanded={suggestions ? expanded : undefined}
            aria-controls={suggestions && expanded ? listId : undefined}
            aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
            autoComplete="off"
            className={cn(
              'basis-24 grow bg-transparent py-1 typography-input-text text-foreground outline-none placeholder:text-text-subtle',
              // Below sm the field text is at least 16px so iOS Safari does not zoom on focus.
              'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]',
              invalidRing,
            )}
            onChange={(event) => {
              const text = event.target.value;
              setOpen(true);
              setActive(-1);
              if (splitter.test(text)) {
                const parts = text.split(splitter);
                add(parts.slice(0, -1));
                setDraft(parts[parts.length - 1]);
              } else {
                setDraft(text);
              }
            }}
            onKeyDown={(event) => {
              if (suggestions && event.key === 'ArrowDown') {
                event.preventDefault();
                if (!expanded) setOpen(true);
                setActive((index) => (options.length === 0 ? -1 : (index + 1) % options.length));
              } else if (suggestions && event.key === 'ArrowUp' && expanded) {
                event.preventDefault();
                setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
              } else if (suggestions && event.key === 'Escape' && expanded) {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                setActive(-1);
              } else if (event.key === 'Enter' && expanded && active >= 0) {
                event.preventDefault();
                pick(options[active].value);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                add([draft]);
                setDraft('');
                setOpen(false);
              } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
                remove(tags[tags.length - 1]);
              }
            }}
            onBlur={() => {
              setOpen(false);
              setActive(-1);
              if (draft.trim()) {
                add([draft]);
                setDraft('');
              }
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData('text');
              if (splitter.test(text)) {
                event.preventDefault();
                add(text.split(splitter));
                setDraft('');
              }
            }}
          />
        )}
        {suggestions && expanded ? (
          <div
            id={listId}
            role="listbox"
            aria-label={l.tagSuggestions}
            className={cn('absolute left-0 top-full z-dropdown mt-1 flex max-h-60 w-full flex-col gap-1 overflow-auto p-1', overlaySurface)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {[undefined, ...categories].map((category) => {
              const group = options.filter((entry) => entry.category === category || (!category && !entry.category));
              if (group.length === 0) return null;
              const rows = group.map((entry) => {
                const index = options.indexOf(entry);
                return (
                  <div
                    key={entry.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active || undefined}
                    className={cn(
                      'cursor-pointer rounded-item px-3 py-2 typography-ui text-text-default hover:bg-muted active:bg-muted data-[active]:bg-muted',
                      transitionBase,
                    )}
                    onMouseEnter={() => setActive(index)}
                    onClick={(event) => {
                      event.stopPropagation();
                      pick(entry.value);
                    }}
                  >
                    {labelOf(entry)}
                  </div>
                );
              });
              if (!category) return <React.Fragment key="__none">{rows}</React.Fragment>;
              const headingId = `${listId}-group-${categories.indexOf(category)}`;
              return (
                <div key={category} role="group" aria-labelledby={headingId} className="flex flex-col gap-1">
                  <div id={headingId} role="presentation" className="px-3 pb-1 pt-2 typography-ui-semibold text-text-subtle">
                    {category}
                  </div>
                  {rows}
                </div>
              );
            })}
          </div>
        ) : null}
        {name ? <input type="hidden" name={name} value={tags.join(',')} /> : null}
        <span role="status" className="sr-only">
          {announcement || (suggestions && expanded ? l.tagSuggestionsCount(options.length) : '')}
        </span>
      </div>
    );
  },
);
TagInput.displayName = 'TagInput';

export { TagInput };
