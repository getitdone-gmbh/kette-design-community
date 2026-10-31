import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';
import { Attribute, Attributes, SummaryList, SummaryListRow } from './description-list';

const meta = {
  id: 'patterns-description-lists',
  title: 'Patterns · Data/Description lists',
  component: Attributes,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['aside', 'sheet', 'compact'] },
    state: { control: 'select', options: ['ready', 'loading', 'empty', 'error'] },
  },
  args: { title: 'Details', variant: 'aside', state: 'ready' },
} satisfies Meta<typeof Attributes>;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = (
  <>
    <Attribute label="Status"><Badge variant="subtle">Active</Badge></Attribute>
    <Attribute label="Owner">Anna Becker</Attribute>
    <Attribute label="Email">anna.becker@example.com</Attribute>
    <Attribute label="Created">Oct 2, 2026</Attribute>
  </>
);

export const Aside: Story = { args: { children: rows } };
export const Sheet: Story = { args: { variant: 'sheet', children: rows } };
const germanRows = (
  <>
    <Attribute label="Wahrscheinlichkeit">80 %</Attribute>
    <Attribute label="Ansprechpartner">Anna Becker</Attribute>
    <Attribute label="Geschäftsführung">Lena Hartmann</Attribute>
    <Attribute label="Erstellt">2. Okt. 2026</Attribute>
  </>
);

export const LongGermanLabels: Story = {
  parameters: { docs: { description: { story: 'Labels wrap and hyphenate with `lang`, so they never run into the value at narrow widths.' } } },
  args: { lang: 'de', title: 'Details', children: germanRows },
};
export const Divided: Story = { args: { divided: true, title: undefined, children: rows } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty', noun: 'details' } };
export const ErrorState: Story = { args: { state: 'error' } };

export const Summary: Story = {
  render: () => (
    <SummaryList className="max-w-xs">
      <SummaryListRow label="Billable hours" value="142:30 h" />
      <SummaryListRow label="Net" value="€ 13,537.50" />
      <SummaryListRow label="VAT 19 %" value="€ 2,572.13" />
      <SummaryListRow label="Total" value="€ 16,109.63" total />
    </SummaryList>
  ),
};
export const SummaryLoading: Story = { render: () => <SummaryList state="loading" className="max-w-xs" /> };

// Figma _Attribute value Type=Text | Chip | Avatar | Logo | Input | Tags.
export const TypedValues: Story = {
  args: {
    children: (
      <>
        <Attribute label="Name" type="text" value="Acme GmbH" />
        <Attribute label="Status" type="chip" value="Client" />
        <Attribute label="Owner" type="avatar" value="Anna Becker" initials="AB" />
        <Attribute label="Parent" type="logo" value="Example Studio GmbH" initials="ES" logoColor={3} />
        <Attribute label="Website" type="input" value="acme.de" />
        <Attribute label="Tags" type="tags" tags={['Retail', 'DACH', 'Partner']} />
      </>
    ),
  },
};
