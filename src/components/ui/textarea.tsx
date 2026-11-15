'use client';

import * as React from 'react';

import { fieldHaloZero, focusRingField, invalidRing, transitionBase } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { usePreset } from './labels-context';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  clamp?: boolean;
  // `readonly` sets the native readOnly attribute and the muted Figma read-only surface. Default keeps the plain look.
  appearance?: 'default' | 'readonly';
  // Shows "length / maxLength" in the bottom right corner. Needs `maxLength`.
  showCount?: boolean;
  // Visible rows and minimum height. Replaces the default 10rem minimum when set, e.g. 1 or 2 for a chat composer.
  minRows?: number;
  // Grows with the text so there is no inner scrollbar (sentence fields, composers). Height follows value, width and font changes; manual resizing is off.
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, clamp, appearance = 'default', showCount = false, minRows: minRowsProp, autoResize = false, readOnly, onChange, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    // Zero: three visible lines and the control padding instead of the 10rem field.
    const minRows = minRowsProp ?? (zero ? 3 : undefined);
    const countId = React.useId();
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref],
    );
    const [innerLength, setInnerLength] = React.useState(() => String(props.defaultValue ?? '').length);
    const counted = showCount && props.maxLength != null;
    const length = props.value !== undefined ? String(props.value).length : innerLength;

    // Grow to the content: reset to auto, then take the scroll height plus the border. Looks again when the width or the font changes.
    React.useLayoutEffect(() => {
      const el = innerRef.current;
      if (!autoResize || !el) return;
      const grow = () => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
      };
      grow();
      const parent = el.parentElement;
      const observer = typeof ResizeObserver === 'undefined' || !parent ? undefined : new ResizeObserver(grow);
      if (parent) observer?.observe(parent);
      void document.fonts?.ready.then(grow);
      return () => observer?.disconnect();
    }, [autoResize, props.value, length]);

    const field = (
      <textarea
        className={cn(
          'flex',
          minRows === undefined ? 'min-h-[10rem]' : 'min-h-0',
          'w-full',
          'border',
          'border-solid',
          'border-input',
          'rounded-control',
          zero ? 'px-control-px-sm py-2' : 'px-4 py-3',
          'text-foreground',
          'bg-background',
          'placeholder:text-textarea-foreground-placeholder',
          'typography-input-text',
          // Below sm the field text is at least 16px so iOS Safari does not zoom on focus.
          'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]',
          'leading-normal',
          transitionBase,
          'hover:border-border-bold',
          'hover:shadow-field-hover',
          !zero && focusRingField,
          invalidRing,
          zero && fieldHaloZero,
          'disabled:cursor-not-allowed',
          'disabled:opacity-disabled',
          { 'text-clamp': clamp },
          { 'leading-clamp': clamp },
          appearance === 'readonly' && 'bg-muted hover:border-input hover:shadow-none',
          counted && 'pb-8',
          autoResize && 'resize-none overflow-hidden',
          className,
        )}
        ref={setRef}
        rows={minRows}
        readOnly={appearance === 'readonly' ? true : readOnly}
        onChange={(event) => {
          setInnerLength(event.target.value.length);
          onChange?.(event);
        }}
        {...props}
        aria-describedby={counted ? [props['aria-describedby'], countId].filter(Boolean).join(' ') : props['aria-describedby']}
      />
    );

    if (!counted) return field;

    return (
      <div className="relative w-full">
        {field}
        <span
          id={countId}
          data-textarea-count=""
          className="pointer-events-none absolute bottom-3 right-4 typography-input-hint tabular-nums text-input-foreground-hint"
        >
          {length} / {props.maxLength}
        </span>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
