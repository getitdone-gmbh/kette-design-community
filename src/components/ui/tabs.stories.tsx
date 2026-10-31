import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import * as React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Button } from './button';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'primitives-tabs',
  title: 'Primitives · Layout/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {},
  // Docs overview: the list styles side by side (the variant belongs to TabsList).
  parameters: {
    docs: {
      overview: {
        rows: 'variant',
        rowValues: ['segmented', 'segment', 'line'],
        render: (args: Record<string, unknown>) => (
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList variant={args.variant as 'segmented' | 'segment' | 'line'}>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Make changes to your account here.</TabsContent>
            <TabsContent value="password">Change your password here.</TabsContent>
          </Tabs>
        ),
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

type TabsProps = React.ComponentProps<typeof Tabs>;

export const Default: Story = {
  args: {
    children: (
      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Make changes to your account here.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
};

export const Line: Story = {
  args: {
    children: (
      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList variant="line">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Make changes to your account here.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
        <TabsContent value="billing">Manage your billing here.</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
};

// RA-LIB-04: when the tabs do not fit (280px here, in every preset), the line variant stays one row and scrolls sideways instead of wrapping. The active tab (the last one) is kept in view, the keyboard still moves between tabs (arrow keys, Home, End) and brings the focused tab into view.
export const LineNarrow: Story = {
  args: {
    children: (
      <Tabs defaultValue="d" className="w-[280px]">
        <TabsList variant="line" aria-label="Sections">
          <TabsTrigger value="a">Overview</TabsTrigger>
          <TabsTrigger value="b">Applications</TabsTrigger>
          <TabsTrigger value="c">Interviews</TabsTrigger>
          <TabsTrigger value="d">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Overview</TabsContent>
        <TabsContent value="d">Settings</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    const tabs = canvas.getAllByRole('tab');
    // One row: no tab sits lower than the first, the row scrolls itself and the page does not.
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(new Set(tabs.map((tab) => Math.round(tab.getBoundingClientRect().top))).size).toBe(1);
    expect(getComputedStyle(list).overflowX).toBe('auto');
    // The active tab is fully inside the row after load.
    await waitFor(() => {
      const row = list.getBoundingClientRect();
      const active = canvas.getByRole('tab', { selected: true }).getBoundingClientRect();
      expect(active.left).toBeGreaterThanOrEqual(row.left - 1);
      expect(active.right).toBeLessThanOrEqual(row.right + 1);
    });
    // Keyboard: Home moves to the first tab and scrolls the row back.
    canvas.getByRole('tab', { selected: true }).focus();
    await userEvent.keyboard('{Home}');
    expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await waitFor(() => expect(list.scrollLeft).toBe(0));
    await userEvent.keyboard('{End}');
    expect(canvas.getByRole('tab', { name: 'Settings' })).toHaveFocus();
    // DR-0301-01: the last tab goes fully to the end of the row, outside the fade, and the fade at that end goes.
    await waitFor(() => expect(list.scrollLeft).toBeGreaterThanOrEqual(list.scrollWidth - list.clientWidth - 1));
    await waitFor(() => expect(list).not.toHaveAttribute('data-fade-end'));
    expect(canvas.getByRole('tab', { name: 'Settings' }).getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right + 1);
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(list.scrollLeft).toBe(0));
    await waitFor(() => expect(list).not.toHaveAttribute('data-fade-start'));
    expect(window.scrollX).toBe(0);
  },
};

// TABS-0300-01: the list sits in a wrapper that is not positioned and whose content is pushed to the right (like a page with a sidebar in front of it). The first tab is active and must be visible. `offsetLeft` is measured from the nearest positioned ancestor, which would scroll the row past the first tab here.
export const LineInOffsetWrapper: Story = {
  args: {
    children: (
      <div style={{ paddingLeft: 200 }}>
        <Tabs defaultValue="a" className="w-[280px]">
          <TabsList variant="line" aria-label="Sections">
            <TabsTrigger value="a">All</TabsTrigger>
            <TabsTrigger value="b">Applications</TabsTrigger>
            <TabsTrigger value="c">Interviews</TabsTrigger>
            <TabsTrigger value="d">Offers</TabsTrigger>
            <TabsTrigger value="e">Archived</TabsTrigger>
            <TabsTrigger value="f">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="a">All</TabsContent>
        </Tabs>
      </div>
    ),
  } as TabsProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    // The first tab is active and stays fully inside the row, the row is not scrolled.
    await waitFor(() => {
      const row = list.getBoundingClientRect();
      const first = canvas.getByRole('tab', { name: 'All', selected: true }).getBoundingClientRect();
      expect(first.left).toBeGreaterThanOrEqual(row.left - 1);
      expect(first.right).toBeLessThanOrEqual(row.right + 1);
    });
    expect(list.scrollLeft).toBe(0);
    expect(getComputedStyle(list).position).toBe('relative');
  },
};

// The line list spans the full width by default, so the hairline reaches the edge of its parent. `w-auto` in `className` opts out for an inline list.
export const LineFullWidth: Story = {
  args: {
    children: (
      <div style={{ width: 480 }}>
        <Tabs defaultValue="a">
          <TabsList variant="line" aria-label="Sections">
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Overview</TabsContent>
        </Tabs>
        <div className="mt-6 flex items-center gap-3">
          <Tabs defaultValue="a">
            <TabsList variant="line" aria-label="Inline" className="w-auto">
              <TabsTrigger value="a">Inline</TabsTrigger>
              <TabsTrigger value="b">Opt-out</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="typography-ui text-muted-foreground">Next to other content</span>
        </div>
      </div>
    ),
  } as TabsProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [full, inline] = canvas.getAllByRole('tablist');
    // Full width of the parent (480). In the zero preset the list is 8px wider (the negative margin that puts the first label flush).
    expect(Math.round(full.getBoundingClientRect().width)).toBeGreaterThanOrEqual(480);
    expect(Math.round(full.getBoundingClientRect().width)).toBeLessThanOrEqual(488);
    expect(inline.getBoundingClientRect().width).toBeLessThan(240);
  },
};

// UX-0300-03: the value is set to the last tab right after mount (an app sets it in an effect, for example from the URL) and the badge of that tab arrives later and widens it. The row is measured again when the tab changes size, so the last tab ends fully inside the row, clear of the end fade, and the fade at that end goes.
const DeepLinkTabs = () => {
  const [value, setValue] = React.useState('a');
  const [badge, setBadge] = React.useState(false);
  React.useEffect(() => {
    setValue('f');
    const timer = window.setTimeout(() => setBadge(true), 400);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <Tabs value={value} onValueChange={setValue} className="w-[390px]">
      <TabsList variant="line" aria-label="Sections">
        <TabsTrigger value="a">Overview</TabsTrigger>
        <TabsTrigger value="b">Applications</TabsTrigger>
        <TabsTrigger value="c">Interviews</TabsTrigger>
        <TabsTrigger value="d">Offers</TabsTrigger>
        <TabsTrigger value="e">Archived</TabsTrigger>
        <TabsTrigger value="f" count={badge ? 'Coming soon' : undefined}>Finance</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export const LineValueSetAfterMount: Story = {
  args: { children: <DeepLinkTabs /> } as TabsProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    await waitFor(() => expect(canvas.getByText('Coming soon')).toBeVisible());
    await waitFor(() => expect(list.scrollLeft).toBeGreaterThanOrEqual(list.scrollWidth - list.clientWidth - 1));
    await waitFor(() => expect(list).not.toHaveAttribute('data-fade-end'));
    expect(canvas.getByRole('tab', { name: /Finance/ }).getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right + 1);
  },
};

// UX-030-04: the scrolling line row fades its edge only on the side that has more tabs, as the SecondaryNav row does.
export const LineNarrowEdgeFade: Story = {
  ...LineNarrow,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    list.scrollLeft = 0;
    await waitFor(() => {
      expect(list).not.toHaveAttribute('data-fade-start');
      expect(list).toHaveAttribute('data-fade-end');
    });
    expect(getComputedStyle(list).maskImage).not.toBe('none');
    list.scrollLeft = list.scrollWidth;
    await waitFor(() => {
      expect(list).toHaveAttribute('data-fade-start');
      expect(list).not.toHaveAttribute('data-fade-end');
    });
  },
};

// The same row in the zero preset (labels keep their spacing, the focus ring is drawn inside the tab so the scroll container never cuts it).
export const LineNarrowZero: Story = {
  args: {
    children: (
      <DesignSystemProvider preset="zero">
        <Tabs defaultValue="c" className="w-[280px]">
          <TabsList variant="line" aria-label="Sections">
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b" count={12}>Applications</TabsTrigger>
            <TabsTrigger value="c">Interviews</TabsTrigger>
            <TabsTrigger value="d">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="c">Interviews</TabsContent>
        </Tabs>
      </DesignSystemProvider>
    ),
  } as TabsProps,
};

// DR-0300-03: in the zero preset the line tab has 4px side padding, which put the first label 4px right of the content edge. The first and last tab keep 2px (micro) of the padding, so the first label sits 2px from the content edge, the inset focus ring does not cover the glyph, and the list and its hairline stay inside the parent (no overshoot, no page overflow). The row still scrolls to both ends and the fades follow.
export const LineZeroFlush: Story = {
  args: {
    children: (
      <DesignSystemProvider preset="zero">
        <div data-testid="frame" style={{ width: 280 }}>
          <Tabs defaultValue="a">
            <TabsList variant="line" aria-label="Sections">
              <TabsTrigger value="a">Overview</TabsTrigger>
              <TabsTrigger value="b" count={12}>Applications</TabsTrigger>
              <TabsTrigger value="c">Interviews</TabsTrigger>
              <TabsTrigger value="d">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </DesignSystemProvider>
    ),
  } as TabsProps,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('frame').getBoundingClientRect();
    const list = canvas.getByRole('tablist');
    const row = list.getBoundingClientRect();
    // The list and its hairline stay inside the parent.
    expect(Math.round(row.left - frame.left)).toBe(0);
    expect(Math.round(row.right - frame.right)).toBe(0);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    const first = canvas.getByRole('tab', { name: 'Overview' });
    // The label sits 2px (micro) from the content edge, the width of the focus ring.
    expect(Math.round(first.getBoundingClientRect().left + parseFloat(getComputedStyle(first).paddingLeft) - frame.left)).toBe(2);
    expect(parseFloat(getComputedStyle(first).paddingLeft)).toBe(2);
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(list.scrollLeft).toBe(0);
    // End, pressed at once: the last tab goes fully to the end of the row (also after fonts and sizes settle later), the fade at that end goes.
    first.focus();
    await userEvent.keyboard('{End}');
    await document.fonts.ready;
    await waitFor(() => expect(Math.abs(list.scrollLeft - (list.scrollWidth - list.clientWidth))).toBeLessThan(1));
    await waitFor(() => expect(list).not.toHaveAttribute('data-fade-end'));
    expect(canvas.getByRole('tab', { name: 'Settings' }).getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right + 1);
  },
};

/** Count slot convention: `<TabsTrigger count={n}>`. Muted 11px tabular number after the label. */
export const WithCount: Story = {
  args: {
    children: (
      <Tabs defaultValue="open" className="w-[480px]">
        <TabsList variant="line">
          <TabsTrigger value="open" count={12}>
            Open
          </TabsTrigger>
          <TabsTrigger value="review" count={3}>
            In review
          </TabsTrigger>
          <TabsTrigger value="done" count="99+">
            Done
          </TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value="open">Open items.</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
};

export const WithDestructiveCount: Story = {
  args: {
    children: (
      <Tabs defaultValue="frontend" orientation="vertical" className="w-[240px]">
        <TabsList variant="vertical">
          <TabsTrigger value="frontend" count="3 selected" countTone="destructive">
            Frontend
          </TabsTrigger>
          <TabsTrigger value="backend" count={12}>
            Backend
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ),
  } as TabsProps,
};

export const WithCountSegmented: Story = {
  args: {
    children: (
      <Tabs defaultValue="open" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="open" count={12}>
            Open
          </TabsTrigger>
          <TabsTrigger value="done" count={0}>
            Done
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ),
  } as TabsProps,
};

/** Segmented control (zero look): control-height triggers, `tab` type role, count rendered as plain text. */
export const Segment: Story = {
  args: {
    children: (
      <Tabs defaultValue="all" className="w-[400px]">
        <TabsList variant="segment" aria-label="Status">
          <TabsTrigger value="all" count={24}>
            All
          </TabsTrigger>
          <TabsTrigger value="open" count={12}>
            Open
          </TabsTrigger>
          <TabsTrigger value="done" count={0}>
            Done
          </TabsTrigger>
          <TabsTrigger value="archived" disabled>
            Archived
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">All items.</TabsContent>
        <TabsContent value="open">Open items.</TabsContent>
        <TabsContent value="done">Done items.</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
};

const sevenViews: Array<[string, number | undefined]> = [
  ['Mine', 7],
  ['Active', 4],
  ['In review', 1],
  ['Expired', 1],
  ['Performance', undefined],
  ['All workspaces', 38],
  ['Archived', 12],
];

// Figma Horizontal tabs Type=Segment with Tab 5..7 visible (up to seven tabs).
export const SegmentSevenTabs: Story = {
  args: {
    children: (
      <Tabs defaultValue="Mine" className="w-[640px]">
        <TabsList variant="segment" aria-label="Views">
          {sevenViews.map(([label, count]) => (
            <TabsTrigger key={label} value={label} count={count}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Mine">Mine</TabsContent>
      </Tabs>
    ),
  } as TabsProps,
};

// Narrow container: the list scrolls horizontally instead of squashing labels.
export const SegmentSevenTabsNarrow: Story = {
  args: {
    children: (
      <Tabs defaultValue="Mine" className="w-[343px]">
        <TabsList variant="segment" aria-label="Views" className="max-w-full justify-start overflow-x-auto">
          {sevenViews.map(([label, count]) => (
            <TabsTrigger key={label} value={label} count={count}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ),
  } as TabsProps,
};

// Figma Vertical tabs: set orientation on Tabs and variant on the list.
export const Vertical: Story = {
  args: {
    children: (
      <Tabs defaultValue="details" orientation="vertical" className="flex w-[480px] gap-6">
        <TabsList variant="vertical" aria-label="Settings" className="w-[220px]">
          <TabsTrigger value="details">My details</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications" count={2}>
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="details">Your details.</TabsContent>
          <TabsContent value="profile">Your profile.</TabsContent>
          <TabsContent value="notifications">Notification settings.</TabsContent>
          <TabsContent value="api">API keys.</TabsContent>
        </div>
      </Tabs>
    ),
  } as TabsProps,
};

// Segmented tracks sized to the Button heights: sm is 32px (Button sm), md is 40px (Button default). Without `size` the track stays 38px.
export const SizesNextToButtons: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        {(['sm', 'md'] as const).map((size) => (
          <div key={size} className="flex items-center gap-3">
            <Tabs defaultValue="a">
              <TabsList size={size} aria-label={`Segmented ${size}`}>
                <TabsTrigger value="a">Open</TabsTrigger>
                <TabsTrigger value="b">Closed</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="sr-only">Open items</TabsContent>
              <TabsContent value="b" className="sr-only">Closed items</TabsContent>
            </Tabs>
            <Button size={size}>Button {size}</Button>
            <Tabs defaultValue="a">
              <TabsList size={size} variant="segment" aria-label={`Segment ${size}`}>
                <TabsTrigger value="a">Open</TabsTrigger>
                <TabsTrigger value="b">Closed</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="sr-only">Open items</TabsContent>
              <TabsContent value="b" className="sr-only">Closed items</TabsContent>
            </Tabs>
          </div>
        ))}
      </div>
    ),
  } as TabsProps,
};
