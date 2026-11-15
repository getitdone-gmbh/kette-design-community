import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { FilterChipBar } from './filter-chip-bar';

const meta = {
  id: 'patterns-filterchipbar',
  title: 'Patterns · Data/FilterChipBar',
  component: FilterChipBar,
  tags: ['autodocs'],
  // onRemove, onReset and onAdd switch controls on, so they are wired explicitly instead of by the default actions.
  parameters: { actions: { argTypesRegex: '^on(?!Remove|Reset|Add)[A-Z].*' } },
  args: { chips: ['Status: open', 'Client: Nordlicht AG', 'Due: October'], onRemove: () => {}, onReset: () => {} },
  argTypes: { placement: { control: { type: 'select' }, options: ['above-list', 'in-action-bar'] } },
} satisfies Meta<typeof FilterChipBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InActionBar: Story = { args: { placement: 'in-action-bar' } };
export const WithAdd: Story = { args: { onAdd: () => {} } };
export const Empty: Story = { args: { chips: [], onAdd: () => {} } };

export const Interactive: Story = {
  render: function Render() {
    const [chips, setChips] = useState(['Status: open', 'Client: Nordlicht AG', 'Due: October']);
    return (
      <FilterChipBar
        chips={chips}
        onRemove={(id) => setChips((current) => current.filter((chip) => chip !== id))}
        onReset={() => setChips([])}
        onAdd={() => setChips((current) => [...current, `Filter ${current.length + 1}`])}
      />
    );
  },
};

// Link mode: a chip with `href` is an anchor that removes the filter by navigating to the listing without it, and `resetHref` makes "Clear all" a real link too. Works without JavaScript.
export const LinkChips: Story = {
  args: {
    chips: [
      { id: 'state', label: 'Check state: Responds', href: '?' },
      { id: 'category', label: 'Category: Developer tools', href: '?' },
    ],
    resetHref: '?',
    resetLabel: 'Clear all',
  } as any,
};
