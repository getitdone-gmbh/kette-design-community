'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { displayVoice } from '@/lib/recipes';
import { cn } from '@/lib/utils';

// Figma: FormSection 10157:2055 (Layout One-column | Two-column (intro, gap space/6, fields) | Two-column fields (fields in a 2-column grid) | Sheet).
const formSectionVariants = cva('w-full', {
  variants: {
    layout: {
      'one-column': 'flex max-w-form-one-column flex-col gap-4',
      // The two columns sit side by side from a section width of 768px (container query, not the viewport), so the layout also holds in a narrow column next to a sidebar.
      'two-column': 'py-6 @container',
      // Intro left, fields in a real 2-column grid on the right (Figma Layout=Two-column fields).
      'two-column-fields': 'py-6 @container',
      // Compact inside a slide-out sheet: side padding, small title.
      sheet: 'flex max-w-form-sheet flex-col gap-4 px-5 py-4',
    },
    divider: {
      true: 'border-b border-solid border-border',
      false: '',
    },
  },
  defaultVariants: { layout: 'two-column', divider: false },
});

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof formSectionVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Heading element for the title (renders inside a labelled group).
  titleAs?: 'h2' | 'h3' | 'h4';
  // Fields: Input, Select, Toggle. Field gap is space/4.
  children: React.ReactNode;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, layout = 'two-column', divider, title, description, titleAs: Title = 'h3', children, ...props }, ref) => {
    const id = React.useId();
    const resolved = layout ?? 'two-column';
    const split = resolved === 'two-column' || resolved === 'two-column-fields';
    const intro = (
      <div className={cn('flex flex-col gap-1', split && '@3xl:w-form-intro @3xl:shrink-0')}>
        <Title id={id} className={cn(resolved === 'sheet' ? 'typography-ui-medium text-text-default' : 'typography-ui-lg-semibold text-text-default', resolved !== 'sheet' && displayVoice)}>
          {title}
        </Title>
        {description ? <p className="typography-ui text-text-subtle">{description}</p> : null}
      </div>
    );
    const fields = (
      <div
        className={cn(
          'min-w-0',
          resolved === 'two-column-fields'
            ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,max(var(--size-form-field-min),calc((100%-var(--space-4))/2))),1fr))] content-start gap-4 @3xl:flex-1 [&>[role=switch]]:col-span-full [&>[data-span=full]]:col-span-full'
            : 'flex flex-col gap-4',
          resolved === 'two-column' && '@3xl:w-form-fields @3xl:max-w-full @3xl:shrink-0',
        )}
      >
        {children}
      </div>
    );
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={id}
        className={cn(formSectionVariants({ layout, divider: divider ?? split }), className)}
        {...props}
      >
        {split ? (
          <div className="flex flex-col gap-6 @3xl:flex-row">
            {intro}
            {fields}
          </div>
        ) : (
          <>
            {intro}
            {fields}
          </>
        )}
      </div>
    );
  },
);
FormSection.displayName = 'FormSection';

// Side by side fields inside a FormSection (first and last name).
const FormRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4 sm:flex-row [&>*]:flex-1', className)} {...props} />
));
FormRow.displayName = 'FormRow';

export interface FormSectionFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  // `full` spans both columns of a Two-column fields layout (steppers, toggles, wide fields). Default keeps one column.
  span?: 'half' | 'full';
}

// Wrapper for a field inside a `two-column-fields` FormSection.
const FormSectionField = React.forwardRef<HTMLDivElement, FormSectionFieldProps>(({ className, span = 'half', ...props }, ref) => (
  <div ref={ref} data-span={span === 'full' ? 'full' : undefined} className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />
));
FormSectionField.displayName = 'FormSectionField';

export interface FormFieldPairProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  // Left field, usually an Input.
  start: React.ReactNode;
  // Right field, usually a Select (Figma Type=Field pair select) or a second Input (Type=Field pair).
  end: React.ReactNode;
}

// Two equal fields side by side, stacked below the sm breakpoint.
const FormFieldPair = React.forwardRef<HTMLDivElement, FormFieldPairProps>(({ className, start, end, ...props }, ref) => (
  <div ref={ref} className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0', className)} {...props}>
    {start}
    {end}
  </div>
));
FormFieldPair.displayName = 'FormFieldPair';

export { FormFieldPair, FormRow, FormSection, FormSectionField, formSectionVariants };
