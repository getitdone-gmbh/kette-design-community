'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';
import { InputHint } from './input';
import { Label } from './label';

// Props a Field hands to its control: id for the label, invalid and required state, and the ids that describe it.
export interface FieldControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required'?: true;
}

// Ids around the control, second argument of the render function (for wrappers that name the control with aria-labelledby).
export interface FieldIds {
  labelId: string;
  errorId: string;
  hintId: string;
}

export interface FieldProps {
  // Id of the control. The label, error and hint ids derive from it (`<id>-label`, `<id>-error`, `<id>-hint`).
  id: string;
  label: React.ReactNode;
  // Adds the destructive star to the label (hidden from assistive tech) and aria-required to the control.
  required?: boolean;
  hint?: React.ReactNode;
  // Shown above the hint while set. The control gets aria-invalid.
  error?: React.ReactNode | null;
  // Spans every column of the form grid.
  wide?: boolean;
  // Set to false when something else already names the error (for example a zero SettingsRow after a check): the error stays visible but is not in aria-describedby.
  describeError?: boolean;
  className?: string;
  // The control as a single element (its props are merged), or a render function for controls behind a wrapper.
  children: React.ReactElement | ((control: FieldControlProps, ids: FieldIds) => React.ReactNode);
}

// Form field without react-hook-form: label above (8), the control, then error and hint (4). Use FormField for react-hook-form.
function Field({ id, label, required = false, hint, error, wide = false, describeError = true, className, children }: FieldProps) {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = error !== undefined && error !== null && error !== false && error !== '';
  const describedBy = [hasError && describeError ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const control: FieldControlProps = {
    id,
    'aria-invalid': hasError ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required ? true : undefined,
  };
  let content: React.ReactNode;
  if (typeof children === 'function') {
    content = children(control, { labelId, errorId, hintId });
  } else {
    const own = (children.props as { 'aria-describedby'?: string })['aria-describedby'];
    content = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ...control,
      'aria-describedby': [describedBy, own].filter(Boolean).join(' ') || undefined,
    });
  }
  return (
    <div data-slot="field" className={cn('flex min-w-0 flex-col gap-2', wide && 'col-span-full', className)}>
      <Label id={labelId} htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="flex flex-col gap-1">
        {content}
        {hasError ? (
          <InputHint id={errorId} invalid data-field-error="">
            {error}
          </InputHint>
        ) : null}
        {hint ? <InputHint id={hintId}>{hint}</InputHint> : null}
      </div>
    </div>
  );
}
Field.displayName = 'Field';

export { Field };
