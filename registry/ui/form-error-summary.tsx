'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import type { LabelProp } from '@/components/ui/labels';
import { useLabels } from '@/components/ui/labels-context';
import { Link } from '@/components/ui/link';

export interface FormErrorSummaryItem {
  // Id of the faulty control; the entry focuses it.
  fieldId: string;
  message: string;
}

export interface FormErrorSummaryProps {
  errors: FormErrorSummaryItem[];
  // `title` replaces "Fix {n} fields to continue."; a string may use `{n}` for the count.
  labels?: { title?: LabelProp<[number]> };
  // Called instead of focusing `document.getElementById(fieldId)`.
  onFocusField?: (fieldId: string) => void;
  className?: string;
}

// Names how many fields need a fix and links each error to its field. Renders only for two or more errors; a single error stays at its field.
function FormErrorSummary({ errors, labels, onFocusField, className }: FormErrorSummaryProps) {
  const l = useLabels();
  if (errors.length < 2) return null;
  const custom = labels?.title;
  const title = custom === undefined ? l.formErrorSummaryTitle(errors.length) : typeof custom === 'function' ? custom(errors.length) : custom.replace('{n}', String(errors.length));
  const focusField = (fieldId: string) => {
    if (onFocusField) onFocusField(fieldId);
    else document.getElementById(fieldId)?.focus();
  };
  return (
    <div role="alert" data-slot="form-error-summary" className={cn('flex flex-col gap-1', className)}>
      {/* The title takes the type role of its entries (link-sm), semibold, so it is never smaller than them. */}
      <p className="m-0 typography-link-sm font-semibold text-text-destructive">{title}</p>
      {/* 8px between the entries keeps the 24px target spacing of WCAG 2.5.8 for the 20px links. */}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <Link
              href={`#${error.fieldId}`}
              color="destructive"
              underline="always"
              onClick={(event) => {
                event.preventDefault();
                focusField(error.fieldId);
              }}
            >
              {error.message}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
FormErrorSummary.displayName = 'FormErrorSummary';

export { FormErrorSummary };
