import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';
import { FormFieldPair, FormRow, FormSection, FormSectionField } from './form-section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';

const meta = {
  id: 'patterns-form-section',
  title: 'Patterns · Interface/Form section',
  component: FormSection,
  tags: ['autodocs'],
  argTypes: { layout: { control: 'select', options: ['one-column', 'two-column', 'two-column-fields', 'sheet'] } },
  args: { title: 'Billing', description: 'Used on invoices and in DATEV exports.', children: null },
} satisfies Meta<typeof FormSection>;
export default meta;
type Story = StoryObj<typeof meta>;

const fields = (
  <>
    <FormRow>
      <Input aria-label="First name" defaultValue="Emily" />
      <Input aria-label="Last name" defaultValue="Park" />
    </FormRow>
    <Input aria-label="Email" defaultValue="emily.park@example.com" />
  </>
);

export const TwoColumn: Story = { args: { layout: 'two-column', children: fields } };
export const OneColumn: Story = {
  args: {
    layout: 'one-column',
    children: (
      <>
        <Input aria-label="Company name" defaultValue="Acme GmbH" />
        <Input aria-label="VAT ID" defaultValue="DE12345" aria-invalid />
        <Input aria-label="Customer number" defaultValue="10042" disabled />
      </>
    ),
  },
};
export const Sheet: Story = { args: { layout: 'sheet', description: undefined, children: fields } };

// Figma Layout=Two-column fields: fields wrap in a 2-column grid, wide fields and toggles take a full row.
export const TwoColumnFields: Story = {
  args: {
    layout: 'two-column-fields',
    title: 'Company data',
    description: 'Legal details shown on invoices.',
    children: (
      <>
        <Input aria-label="Company name" defaultValue="Get IT Done GmbH" />
        <Select defaultValue="gmbh">
          <SelectTrigger aria-label="Legal form">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gmbh">GmbH</SelectItem>
            <SelectItem value="ag">AG</SelectItem>
          </SelectContent>
        </Select>
        <FormSectionField span="full">
          <Input aria-label="Management" defaultValue="Lena Hartmann" />
        </FormSectionField>
        <Input aria-label="Register court" defaultValue="Amtsgericht Munich" />
        <Input aria-label="Register number" defaultValue="HRB 271 834" />
        <FormSectionField span="full">
          <label className="flex items-center gap-3 typography-ui text-text-default">
            <Switch aria-label="Show on invoices" defaultChecked />
            Show on invoices
          </label>
        </FormSectionField>
      </>
    ),
  },
};

// Figma Sheet block Type=Field pair select: input left, select right.
export const FieldPairSelect: Story = {
  args: {
    layout: 'one-column',
    title: 'Contact',
    description: undefined,
    children: (
      <FormFieldPair
        start={<Input aria-label="Phone number" defaultValue="+49 89 1234" />}
        end={
          <Select defaultValue="work">
            <SelectTrigger aria-label="Phone type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    ),
  },
};
