import type { Meta, StoryObj } from '@storybook/react';
import { Folder, Share2, Star, Trash2 } from 'lucide-react';

import { Chip } from './chip';
import { Button } from './button';
import { SecondaryNav, SecondaryNavLayout, StorageMeter } from './secondary-nav';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  title: 'Patterns/Secondary nav',
  component: SecondaryNav,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Files',
    defaultValue: 'all',
    sections: [
      {
        id: 'spaces',
        label: 'Spaces',
        items: [
          { id: 'all', label: 'All files', icon: <Folder />, count: 128 },
          { id: 'shared', label: 'Shared with me', icon: <Share2 />, count: 4 },
          { id: 'starred', label: 'Starred', icon: <Star /> },
        ],
      },
      { id: 'other', items: [{ id: 'trash', label: 'Trash', icon: <Trash2 /> }] },
    ],
  },
  argTypes: { size: { control: 'select', options: ['sm', 'md'] }, orientation: { control: 'select', options: ['vertical', 'horizontal', 'responsive'] } },
} satisfies Meta<typeof SecondaryNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nav: Story = {};
export const Medium: Story = { args: { size: 'md' } };
export const WithStorageFooter: Story = { args: { footer: <StorageMeter used={7.2} total={10} /> } };
export const StorageNearlyFull: Story = { args: { footer: <StorageMeter used={9.6} total={10} /> } };

// Count plus a second badge, for example a status next to the number.
export const WithSecondBadge: Story = {
  args: {
    sections: [
      {
        id: 'spaces',
        items: [
          { id: 'all', label: 'All files', icon: <Folder />, count: 128 },
          { id: 'shared', label: 'Shared with me', icon: <Share2 />, count: 4, badge: <Chip size="small" variant="warning">Review</Chip> },
          { id: 'starred', label: 'Starred', icon: <Star />, badge: <Chip size="small" variant="success">Synced</Chip> },
        ],
      },
    ],
  },
};

export const Collapsed: Story = { args: { collapsed: true } };

export const WithRouterLink: Story = {
  args: {
    sections: [
      {
        id: 'spaces',
        items: [
          { id: 'all', label: 'All files', icon: <Folder />, href: '/files' },
          { id: 'shared', label: 'Shared with me', icon: <Share2 />, href: '/shared' },
        ],
      },
    ],
    // Swap the anchor for a router Link, for example <Link {...props} />.
    renderLink: (item, props) => <a data-router-link="" {...props}>{props.children}</a>,
  },
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

const financeSections = [
  {
    id: 'finance',
    items: [
      { id: 'cockpit', label: 'Cockpit', icon: <Folder /> },
      { id: 'connect', label: 'Connect accounts', icon: <Share2 /> },
      { id: 'transactions', label: 'Transactions', icon: <Star />, count: 12 },
      { id: 'settings', label: 'Settings', icon: <Trash2 /> },
    ],
  },
];

// One scrollable row for narrow areas. The current item is scrolled into view, arrow keys, Home and End move between items.
export const Horizontal: Story = { args: { orientation: 'horizontal', defaultValue: 'all' }, parameters: { layout: 'padded' } };

const manySections = [
  {
    id: 'many',
    items: Array.from({ length: 16 }, (_, index) => ({ id: `item-${index + 1}`, label: `Section ${index + 1}`, icon: <Folder />, count: index % 3 === 0 ? index + 1 : undefined })),
  },
];

// More items than fit: edge fades appear on the side that has more content, and the current item (here the last one) is scrolled into view.
export const HorizontalManyItems: Story = {
  args: { orientation: 'horizontal', sections: manySections, defaultValue: 'item-14', 'aria-label': 'Sections' },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
};

export const HorizontalSecondBadge: Story = {
  args: {
    orientation: 'horizontal',
    sections: [
      {
        id: 'spaces',
        label: 'Spaces',
        items: [
          { id: 'all', label: 'All files', icon: <Folder />, count: 128 },
          { id: 'shared', label: 'Shared with me', icon: <Share2 />, badge: <Chip size="small" variant="warning">Review</Chip> },
        ],
      },
      { id: 'other', label: 'Other', items: [{ id: 'trash', label: 'Trash', icon: <Trash2 /> }] },
    ],
  },
};

export const HorizontalZero: Story = {
  args: { orientation: 'horizontal', sections: financeSections, defaultValue: 'transactions', 'aria-label': 'Finance' },
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};

// Mirrors the zero prototype: a row while the area is narrower than the `@area` screen (860px), the column from there. The width comes from the nearest ancestor with the `@container` class, not the viewport. Drag the corner to resize.
export const ResponsiveInResizableContainer: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'transactions', 'aria-label': 'Finance', footer: <StorageMeter used={7.2} total={10} /> },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="@container overflow-auto border border-border" style={{ resize: 'horizontal', width: 600, minWidth: 280, maxWidth: '100%' }}>
        <div className="flex flex-col @area:flex-row">
          <Story />
          <p className="typography-ui p-4 text-muted-foreground">Page content. Widen this box to 860px or more to see the column.</p>
        </div>
      </div>
    ),
  ],
};

export const ResponsiveNarrow: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  decorators: [(Story) => <div className="@container" style={{ maxWidth: 480 }}><div className="flex flex-col @area:flex-row"><Story /></div></div>],
};

export const ResponsiveWide: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  decorators: [(Story) => <div className="@container" style={{ maxWidth: 1000 }}><div className="flex flex-col @area:flex-row"><Story /></div></div>],
};

// Page frame without `flex-col @area:flex-row`, width or border classes: nav above the content in a narrow area, left column from the `@area` screen (860px). Arrow keys follow the layout: Left and Right in the row, Up and Down in the column.
export const InLayoutNarrow: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <SecondaryNavLayout nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
};

export const InLayoutWide: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  render: (args) => (
    <div style={{ maxWidth: 1000 }}>
      <SecondaryNavLayout nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
};

// `fill` takes the height of a fixed-height parent. The content slot scrolls on its own, no `[&>div]:h-full` override around the layout.
export const InLayoutFill: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  render: (args) => (
    <div className="flex flex-col border border-solid border-border" style={{ height: 320, maxWidth: 1000 }}>
      <SecondaryNavLayout fill nav={<SecondaryNav {...args} />} contentClassName="overflow-y-auto">
        <div className="typography-ui flex flex-col gap-3 p-4 text-muted-foreground">
          <Button variant="outline" size="sm" className="self-start">Reload</Button>
          {Array.from({ length: 14 }, (_, i) => (
            <p key={i}>Page content row {i + 1}. The content slot scrolls while the nav stays in view.</p>
          ))}
        </div>
      </SecondaryNavLayout>
    </div>
  ),
};
