import type { Meta, StoryObj } from '@storybook/react';

import { Field } from './field';
import { FormErrorSummary } from './form-error-summary';
import { Input } from './input';

const meta = {
  id: 'primitives-inputs-form-error-summary',
  title: 'Primitives · Inputs/Form error summary',
  component: FormErrorSummary,
  tags: ['autodocs'],
  argTypes: {
    errors: { description: 'Faulty fields with their message. Renders only for two or more.' },
    labels: { description: 'Title override, `{n}` is the count.' },
    onFocusField: { description: 'Called instead of focusing the field with the id.' },
    className: { description: 'Extra classes on the summary.' },
  },
  args: {
    // Set, so the preview argTypesRegex adds no action stub: the entries must focus their field in the story (QA-01, A11Y-PKG5-02).
    onFocusField: undefined,
    errors: [
      { fieldId: 'summary-name', message: 'Enter a company name.' },
      { fieldId: 'summary-vat', message: 'Enter a VAT ID with country code.' },
    ],
  },
} satisfies Meta<typeof FormErrorSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

// The summary above the fields it names; each entry focuses its field.
export const Default: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-4">
      <FormErrorSummary {...args} />
      <Field id="summary-name" label="Company name" required error="Enter a company name.">
        <Input size="sm" />
      </Field>
      <Field id="summary-vat" label="VAT ID" required error="Enter a VAT ID with country code.">
        <Input size="sm" defaultValue="123" />
      </Field>
    </div>
  ),
};
