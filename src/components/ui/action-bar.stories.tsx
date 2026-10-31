import type { Meta, StoryObj } from '@storybook/react';
import { Building2, Download, LayoutGrid, Search, SlidersHorizontal, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Chip } from './chip';
import { ActionBar, ActionBarDataSwitch, ActionBarFilterTags, ActionBarRow, ActionBarSearch, ActionBarSpacer, BatchBar, type BatchBarAction } from './action-bar';
import { Button } from './button';
import { DesignSystemProvider } from './design-system-provider';
import { Input } from './input';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover';
import { Tabs, TabsList, TabsTrigger } from './tabs';

const meta = {
  id: 'patterns-action-bar',
  title: 'Patterns · Interface/Action bar',
  component: BatchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Section header action bar: optional tab row, toolbar row, filter tags and the bulk BatchBar that replaces the toolbar while rows are selected. Rows stack vertically with an 8px gap.',
      },
    },
  },
  args: { selectedCount: 3, onClear: () => {} },
} satisfies Meta<typeof BatchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const actions: BatchBarAction[] = [
  { id: 'assign', label: 'Assign', icon: <UserPlus />, onSelect: () => {} },
  { id: 'export', label: 'Export', icon: <Download />, onSelect: () => {} },
  { id: 'delete', label: 'Delete', icon: <Trash2 />, destructive: true, onSelect: () => {} },
];

export const Bulk: Story = {
  args: { actions, moreActions: [{ id: 'archive', label: 'Archive', onSelect: () => {} }] },
};

// Chip slot after the count, for example the scope of the selection.
export const WithChip: Story = {
  args: { actions, chip: <Chip size="small" variant="info">All 120 matches</Chip> },
};

export const Overflow: Story = {
  args: { actions, maxInline: 1 },
};

const ListDemo = () => {
    const [tags, setTags] = useState([
      { id: 'status', label: 'Status: Client' },
      { id: 'owner', label: 'Owner: Me' },
    ]);
    return (
      <ActionBar>
        <ActionBarRow>
          <Tabs defaultValue="mine">
            <TabsList variant="segment">
              <TabsTrigger value="mine">Mine 7</TabsTrigger>
              <TabsTrigger value="active">Active 4</TabsTrigger>
              <TabsTrigger value="review">In review 1</TabsTrigger>
            </TabsList>
          </Tabs>
          <ActionBarDataSwitch
            aria-label="Data context"
            icon={<Building2 />}
            defaultValue="gid"
            options={[
              { value: 'gid', label: 'Get IT Done GmbH' },
              { value: 'all', label: 'All companies' },
            ]}
          />
          <ActionBarSpacer />
          <Button variant="ghost" size="control-sm" icon={<LayoutGrid />}>
            Table
          </Button>
          <Button variant="outline" size="control-sm" icon={<Download />}>
            Export
          </Button>
        </ActionBarRow>
        <ActionBarRow>
          <ActionBarSearch placeholder="Search" aria-label="Search" />
          <Button variant="outline" size="control-sm" icon={<SlidersHorizontal />}>
            Filter
          </Button>
          <ActionBarFilterTags
            tags={tags.map((tag) => ({ ...tag, onRemove: () => setTags((prev) => prev.filter((t) => t.id !== tag.id)) }))}
            onReset={() => setTags([])}
          />
        </ActionBarRow>
      </ActionBar>
    );
};

export const ListWithTabsAndFilters: Story = {
  render: () => (
    <DesignSystemProvider preset="zero">
      <ListDemo />
    </DesignSystemProvider>
  ),
};

const SelectionDemo = () => {
    const [selected, setSelected] = useState(3);
    return (
      <ActionBar>
        {selected > 0 ? (
          <BatchBar selectedCount={selected} onClear={() => setSelected(0)} actions={actions} />
        ) : (
          <ActionBarRow>
            <Search className="h-icon-sm w-icon-sm text-icon-subtle" aria-hidden />
            <span className="typography-ui text-text-subtle">No selection</span>
            <Button variant="outline" size="control-md" onClick={() => setSelected(3)}>
              Select 3
            </Button>
          </ActionBarRow>
        )}
      </ActionBar>
    );
};

export const SelectionReplacesToolbar: Story = { render: () => <SelectionDemo /> };

// An inline action can open a popover: `render` receives the action button and wraps it in a Popover trigger.
export const ActionWithPopover: Story = {
  args: {
    actions: [
      {
        id: 'assign',
        label: 'Assign',
        icon: <UserPlus />,
        render: (button) => (
          <Popover>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent align="end">
              <div className="flex flex-col gap-3">
                <span className="typography-ui-semibold">Assign 3 rows</span>
                <Input aria-label="Assignee" placeholder="Search people" />
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
      { id: 'export', label: 'Export', icon: <Download />, onSelect: () => {} },
    ],
  },
};

// PopoverAnchor positions the content against another element, here the whole bar.
export const ActionWithAnchoredPopover: Story = {
  render: (args) => (
    <Popover>
      <PopoverAnchor asChild>
        <div>
          <BatchBar
            {...args}
            actions={[{ id: 'assign', label: 'Assign', icon: <UserPlus />, render: (button) => <PopoverTrigger asChild>{button}</PopoverTrigger> }]}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent align="start">
        <Input aria-label="Assignee" placeholder="Search people" />
      </PopoverContent>
    </Popover>
  ),
};
