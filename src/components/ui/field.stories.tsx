import type { Meta, StoryObj } from '@storybook/react';

import { Field } from './field';
import { Input } from './input';

const meta = {
  id: 'primitives-inputs-field',
  title: 'Primitives · Inputs/Field',
  component: Field,
  tags: ['autodocs'],
  argTypes: {
    id: { description: 'Id of the control. Label, error and hint ids derive from it.' },
    label: { description: 'Visible label above the control.' },
    required: { description: 'Adds the star to the label and aria-required to the control.' },
    hint: { description: 'Helper text under the control.' },
    error: { description: 'Error text above the hint. The control gets aria-invalid.' },
    wide: { description: 'Spans every column of the form grid.' },
    describeError: { description: 'Set to false when something else already names the error; it stays visible.' },
    className: { description: 'Extra classes on the field column.' },
    children: { description: 'The control, or a render function that gets the control props and ids.', control: false },
  },
  args: { id: 'field-company', label: 'Company name', children: <Input size="sm" defaultValue="Acme GmbH" /> },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = { args: { id: 'field-email', label: 'Email', required: true, children: <Input size="sm" type="email" /> } };

export const ErrorAndHint: Story = {
  args: {
    id: 'field-vat',
    label: 'VAT ID',
    required: true,
    error: 'Enter a VAT ID with country code.',
    hint: 'For example DE123456789.',
    children: <Input size="sm" defaultValue="123" />,
  },
};

// Two fields in the two column form grid; the wide one spans both columns.
export const Wide: Story = {
  render: () => (
    <div className="grid max-w-xl grid-cols-2 gap-4">
      <Field id="field-first" label="First name">
        <Input size="sm" defaultValue="Emily" />
      </Field>
      <Field id="field-last" label="Last name">
        <Input size="sm" defaultValue="Park" />
      </Field>
      <Field id="field-street" label="Street" wide hint="As on the invoice.">
        <Input size="sm" defaultValue="Main Street 1" />
      </Field>
    </div>
  ),
  decorators: [(Story) => <Story />],
};
