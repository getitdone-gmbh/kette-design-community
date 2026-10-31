import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import * as React from 'react';
import { Folder, Plus, Share2, Star, Trash2 } from 'lucide-react';

import { Chip } from './chip';
import { Button } from './button';
import { SecondaryNav, SecondaryNavLayout, StorageMeter } from './secondary-nav';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-secondary-nav',
  title: 'Patterns · Interface/Secondary nav',
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

// Distance between the middle of the current item and the middle of the row, in px. Zero means centred.
const centreOffset = (canvasElement: HTMLElement) => {
  const row = canvasElement.querySelector('nav')?.firstElementChild as HTMLElement;
  const item = row.querySelector('[aria-current="page"]') as HTMLElement;
  const a = item.getBoundingClientRect();
  const b = row.getBoundingClientRect();
  return Math.abs(a.left + a.width / 2 - (b.left + b.width / 2));
};

// More items than fit: edge fades appear on the side that has more content, and the current item (here near the end) is scrolled as far toward the middle as the row allows.
export const HorizontalManyItems: Story = {
  args: { orientation: 'horizontal', sections: manySections, defaultValue: 'item-14', 'aria-label': 'Sections' },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
  // DR-0301-01: End goes fully to the end of the row and clears the fade there, Home to the start.
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('nav')?.firstElementChild as HTMLElement;
    const canvas = within(canvasElement);
    // Web fonts change the item widths, so the keys are pressed once the row is final.
    await document.fonts.ready;
    canvas.getByRole('button', { name: /Section 14/ }).focus();
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(row.scrollLeft).toBeGreaterThanOrEqual(row.scrollWidth - row.clientWidth - 1));
    await waitFor(() => expect(row).not.toHaveAttribute('data-fade-end'));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(row.scrollLeft).toBe(0));
    await waitFor(() => expect(row).not.toHaveAttribute('data-fade-start'));
  },
};

// RA-LIB-02: the current item sits in the middle of the row when the page loads. Only the row scrolls, the page does not move, and no animation runs on load.
export const HorizontalCentredActive: Story = {
  args: { orientation: 'horizontal', sections: manySections, defaultValue: 'item-8', 'aria-label': 'Sections' },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(centreOffset(canvasElement)).toBeLessThanOrEqual(2));
    expect(window.scrollY).toBe(0);
  },
};

// RA-LIB-01: under a coarse pointer (touch) every row item has a 44px hit area while it stays 30px high. The test runner opens this story with a touch context and checks what a tap 7px above and below the item hits.
export const HorizontalTouchTarget: Story = {
  args: { orientation: 'horizontal', sections: manySections, defaultValue: 'item-2', 'aria-label': 'Sections' },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
  parameters: { touchHitArea: { item: 'nav li:nth-child(3) > a, nav li:nth-child(3) > button', visual: 30, hit: 44 } },
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

const layoutTitle = 'Files';
const layoutActions = (
  <Button variant="ghost" size="icon" aria-label="New folder">
    <Plus />
  </Button>
);

// RA-LIB-03: `title` and `actions` fill the column header from the `@area` screen (860px). Below it the actions stay reachable as a fixed field at the start of the nav row (UX-030-03).
export const InLayoutWithTitleAndActions: Story = {
  args: { orientation: 'responsive', sections: manySections.slice(0, 1).map((section) => ({ ...section, items: section.items.slice(0, 5) })), defaultValue: 'item-1', 'aria-label': 'Files' },
  render: (args) => (
    <div style={{ maxWidth: 1000 }}>
      <SecondaryNavLayout title={layoutTitle} actions={layoutActions} nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The test runner decides the viewport, so the expectation follows the measured width of the layout: the title shows from 860px.
    const wide = (canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement).getBoundingClientRect().width >= 860;
    const action = canvas.getByRole('button', { name: 'New folder' });
    expect(action).toBeVisible();
    if (!wide) return;
    expect(canvas.getByText(layoutTitle)).toBeVisible();
    // The title sits above the nav inside the column.
    expect(canvas.getByText(layoutTitle).getBoundingClientRect().bottom).toBeLessThanOrEqual(canvas.getByRole('navigation').getBoundingClientRect().top + 1);
  },
};

// Below the `@area` screen the title is not rendered (display none) and the actions are a fixed field at the start of the nav row, outside the scrolling nav, so the action never gets lost (UX-030-03).
export const InLayoutWithTitleAndActionsNarrow: Story = {
  args: { orientation: 'responsive', sections: manySections, defaultValue: 'item-1', 'aria-label': 'Files' },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <SecondaryNavLayout title={layoutTitle} actions={layoutActions} nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvasElement.querySelector('[data-slot="secondary-nav-title"]') as HTMLElement;
    expect((canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement).getBoundingClientRect().width).toBeLessThan(860);
    expect(getComputedStyle(title).display).toBe('none');
    const action = canvas.getByRole('button', { name: 'New folder' });
    expect(action).toBeVisible();
    // The action sits at the start of the row (left of the nav, outside its scroll area, on the same line), so the tab order follows the picture (UX-030-08).
    const nav = canvas.getByRole('navigation').getBoundingClientRect();
    const box = action.getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(nav.left + 1);
    expect(Math.abs(box.top + box.height / 2 - (nav.top + nav.height / 2))).toBeLessThan(nav.height / 2);
    // It stays focusable.
    action.focus();
    expect(document.activeElement).toBe(action);
  },
};

export const InLayoutWithTitleAndActionsZero: Story = {
  args: { orientation: 'responsive', sections: financeSections, defaultValue: 'cockpit', 'aria-label': 'Finance' },
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
  render: (args) => (
    <div style={{ maxWidth: 1000 }}>
      <SecondaryNavLayout title="Finance" actions={layoutActions} nav={<SecondaryNav {...args} />}>
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

const longColumnSections = [
  {
    id: 'spaces',
    label: 'Spaces',
    items: Array.from({ length: 40 }, (_, index) => ({ id: `space-${index + 1}`, label: `Space ${index + 1}`, icon: <Folder />, count: index % 4 === 0 ? index + 1 : undefined })),
  },
];

// SNL-0300-01: a column nav with a long list and a title. The second grid row takes the height that is left, so the nav fills the column and scrolls inside it (`overflow-y-auto` on the nav) while the title and action stay in view. `navClassName` lands on the outer slot, so `flex flex-col` there cannot replace the grid.
export const InLayoutColumnScrollingList: Story = {
  args: { orientation: 'responsive', sections: longColumnSections, defaultValue: 'space-3', 'aria-label': 'Spaces', className: 'overflow-y-auto' },
  render: (args) => (
    <div className="flex flex-col border border-solid border-border" style={{ height: 360, maxWidth: 1000 }}>
      <SecondaryNavLayout fill title={layoutTitle} actions={layoutActions} navClassName="flex flex-col" nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement;
    // Narrow runs are covered by the row stories. The column exists from 860px.
    if (layout.getBoundingClientRect().width < 860) return;
    const frame = layout.parentElement as HTMLElement;
    const nav = canvas.getByRole('navigation');
    const grid = canvasElement.querySelector('[data-slot="secondary-nav-grid"]') as HTMLElement;
    // The grid survives an app `navClassName` with `flex flex-col`.
    expect(getComputedStyle(grid).display).toBe('grid');
    // The nav fills the column down to the frame and scrolls inside it.
    expect(nav.getBoundingClientRect().bottom).toBeLessThanOrEqual(frame.getBoundingClientRect().bottom + 1);
    expect(frame.getBoundingClientRect().bottom - nav.getBoundingClientRect().bottom).toBeLessThan(4);
    expect(nav.scrollHeight).toBeGreaterThan(nav.clientHeight);
    // Title above the nav, the page does not grow with the list.
    expect(canvas.getByText(layoutTitle).getBoundingClientRect().bottom).toBeLessThanOrEqual(nav.getBoundingClientRect().top + 1);
    expect(layout.getBoundingClientRect().height).toBeLessThanOrEqual(frame.getBoundingClientRect().height + 1);
  },
};

// SNL-0300-01 and UX-030-08: at phone width (390) the row has the action at the start and the nav scrolls on its own. Nothing overflows the page, and the action comes before the nav in tab order and on screen.
export const InLayoutRowPhone: Story = {
  args: { orientation: 'responsive', sections: manySections, defaultValue: 'item-6', 'aria-label': 'Files' },
  render: (args) => (
    <div style={{ width: 390 }}>
      <SecondaryNavLayout title={layoutTitle} actions={layoutActions} nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement;
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    const action = canvas.getByRole('button', { name: 'New folder' });
    const items = canvas.getAllByRole('button').filter((el) => el !== action);
    // DOM order equals the visual order: action first, then the nav items.
    expect(action.compareDocumentPosition(items[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(canvas.getByRole('navigation').getBoundingClientRect().left + 1);
  },
};

// UX-0301-01: in a scrolling column the active entry far down is scrolled into the column on load (centred, only the column moves). The keyboard part is `InLayoutColumnKeyboard`.
export const InLayoutColumnActiveFarDown: Story = {
  args: { orientation: 'responsive', sections: longColumnSections, defaultValue: 'space-30', 'aria-label': 'Spaces', className: 'overflow-y-auto' },
  render: (args) => (
    <div className="flex flex-col border border-solid border-border" style={{ height: 360, maxWidth: 1000 }}>
      <SecondaryNavLayout fill title={layoutTitle} actions={layoutActions} nav={<SecondaryNav {...args} />}>
        <p className="typography-ui p-4 text-muted-foreground">Page content.</p>
      </SecondaryNavLayout>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement;
    if (layout.getBoundingClientRect().width < 860) return;
    const nav = canvas.getByRole('navigation');
    const inside = (el: HTMLElement) => {
      const a = el.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    };
    // On load: wait until the layout is in column mode, then the active entry is inside the column (also what a user sees: the point at its centre hits it), the column is scrolled, the page is not.
    await waitFor(() => expect(getComputedStyle(nav.firstElementChild as HTMLElement).flexDirection).toBe('column'));
    await waitFor(() => {
      const active = canvas.getByRole('button', { name: /Space 30/ });
      const box = active.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      expect(hit === active || active.contains(hit)).toBe(true);
      expect(inside(active)).toBe(true);
    });
    expect(nav.scrollTop).toBeGreaterThan(0);
    expect(window.scrollY).toBe(0);
  },
};

// UX-0301-01: arrow keys, Home and End in the scrolling column keep the focused entry inside the visible part of the column, by the smallest move, and the page never moves. Home and End go fully to the ends of the column.
export const InLayoutColumnKeyboard: Story = {
  args: { orientation: 'responsive', sections: longColumnSections, defaultValue: 'space-30', 'aria-label': 'Spaces', className: 'overflow-y-auto' },
  render: InLayoutColumnActiveFarDown.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvasElement.querySelector('[data-slot="secondary-nav-layout"]') as HTMLElement;
    if (layout.getBoundingClientRect().width < 860) return;
    const nav = canvas.getByRole('navigation');
    const inside = (el: HTMLElement) => {
      const a = el.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    };
    await document.fonts.ready;
    await waitFor(() => expect(getComputedStyle(nav.firstElementChild as HTMLElement).flexDirection).toBe('column'));
    await waitFor(() => expect(inside(canvas.getByRole('button', { name: /Space 30/ }))).toBe(true));
    canvas.getByRole('button', { name: /Space 30/ }).focus();
    for (let i = 0; i < 8; i += 1) {
      await userEvent.keyboard('{ArrowDown}');
      expect(inside(document.activeElement as HTMLElement)).toBe(true);
    }
    await userEvent.keyboard('{Home}');
    expect(canvas.getByRole('button', { name: /^Space 1\b/ })).toHaveFocus();
    await waitFor(() => expect(nav.scrollTop).toBe(0));
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(inside(document.activeElement as HTMLElement)).toBe(true));
    expect(window.scrollY).toBe(0);
  },
};

// UX-0300-03: the current item is set to the last one right after mount and its badge arrives later and widens it. The row is measured again when an item changes size, so the last item ends fully inside the row, clear of the end fade.
const DeepLinkNav = () => {
  const [value, setValue] = React.useState('item-1');
  const [badge, setBadge] = React.useState(false);
  React.useEffect(() => {
    setValue('item-16');
    const timer = window.setTimeout(() => setBadge(true), 400);
    return () => window.clearTimeout(timer);
  }, []);
  const sections = [{ id: 'many', items: manySections[0].items.map((item) => (item.id === 'item-16' ? { ...item, badge: badge ? <Chip size="small" variant="warning">Coming soon</Chip> : undefined } : item)) }];
  return <SecondaryNav aria-label="Sections" orientation="horizontal" sections={sections} value={value} onValueChange={setValue} />;
};

export const HorizontalValueSetAfterMount: Story = {
  render: () => (
    <div style={{ width: 390 }}>
      <DeepLinkNav />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvasElement.querySelector('nav')?.firstElementChild as HTMLElement;
    await waitFor(() => expect(canvas.getByText('Coming soon')).toBeVisible());
    await waitFor(() => expect(row.scrollLeft).toBeGreaterThanOrEqual(row.scrollWidth - row.clientWidth - 1));
    await waitFor(() => expect(row).not.toHaveAttribute('data-fade-end'));
  },
};
