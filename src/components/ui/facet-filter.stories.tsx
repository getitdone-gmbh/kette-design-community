import type { Meta, StoryObj } from '@storybook/react';

import { FacetFilter, FacetGroup, FacetOption } from './facet-filter';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-facet-filter',
  title: 'Patterns · Data/Facet filter',
  component: FacetFilter,
  tags: ['autodocs'],
  args: {
    description: 'Apply filters to table data.',
    operators: [
      { value: 'partial', label: 'Partial' },
      { value: 'exact', label: 'Exact' },
    ],
  },
} satisfies Meta<typeof FacetFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

const roles = ['Backend Developer', 'Frontend Developer', 'Fullstack Developer', 'Product Designer', 'Product Manager', 'QA Engineer', 'UX Copywriter', 'UX Designer', 'Data Engineer', 'DevOps Engineer'];

export const Default: Story = {
  render: (args) => (
    <FacetFilter {...args}>
      <FacetGroup label="Teams">
        <FacetOption label="Design" count={4} />
        <FacetOption label="Product" count={7} defaultChecked />
        <FacetOption label="Marketing" count={2} />
      </FacetGroup>
      <FacetGroup label="Role" searchable limit={4}>
        {roles.map((r) => (
          <FacetOption key={r} label={r} />
        ))}
      </FacetGroup>
    </FacetFilter>
  ),
};

export const CollapsibleAndTextCounts: Story = {
  render: (args) => (
    <FacetFilter {...args}>
      <FacetGroup label="Teams" collapsible>
        <FacetOption label="Design" count="99+" />
        <FacetOption label="Product" count="n/a" />
      </FacetGroup>
      <FacetGroup label="Region" collapsible defaultCollapsed>
        <FacetOption label="DACH" count={12} />
      </FacetGroup>
    </FacetFilter>
  ),
};

// Colour dot (project colour) before the group label and the options, with counts.
export const ColourDotsAndGroupCount: Story = {
  render: (args) => (
    <FacetFilter {...args}>
      <FacetGroup label="Projects" count={12} dotColor="bg-background-brand-bold-default" collapsible>
        <FacetOption label="Alpha" count={7} dotColor="bg-background-success-bold-default" />
        <FacetOption label="Beta" count={5} dotColor="bg-background-warning-bold-default" />
      </FacetGroup>
    </FacetFilter>
  ),
};

// Add and remove rows as link style toggles (aria-pressed) instead of checkboxes.
export const ToggleLinks: Story = {
  render: (args) => (
    <FacetFilter {...args} selectionMode="toggle-links">
      <FacetGroup label="Teams">
        <FacetOption label="Design" count={4} />
        <FacetOption label="Product" count={7} defaultChecked />
        <FacetOption label="Marketing" count={2} />
      </FacetGroup>
    </FacetFilter>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
