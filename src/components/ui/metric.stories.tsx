import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { HelpIcon } from './help-icon';
import { KpiStrip, MetricItem } from './metric';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-kpi-strip',
  title: 'Patterns · Data/KPI strip',
  component: MetricItem,
  tags: ['autodocs'],
  // onClick turns the item into a button, so it must not get an auto action arg
  parameters: { actions: { argTypesRegex: '^on(?!Click)[A-Z].*' } },
  args: { label: 'Open demands', value: '24', delta: '+3 vs last week', deltaTone: 'success' },
} satisfies Meta<typeof MetricItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Strip: Story = {
  render: (args) => (
    <KpiStrip aria-label="Demand KPIs">
      <MetricItem {...args} />
      <MetricItem label="Candidates" value="118" delta="+12" deltaTone="success" />
      <MetricItem label="Late" value="3" delta="-1" deltaTone="destructive" />
      <MetricItem label="Fill rate" value="62 %" delta="0" />
    </KpiStrip>
  ),
};

// A strip on a subtle section. In dark the raised surface keeps the strip from sinking below the section.
export const StripRaisedOnSubtleSection: StoryObj<typeof KpiStrip> = {
  render: () => (
    <div className="bg-background-subtle p-6">
      <KpiStrip aria-label="Demand KPIs" surface="raised">
        <MetricItem label="Open demands" value="42" />
        <MetricItem label="Candidates" value="318" />
        <MetricItem label="Placed" value="12" />
      </KpiStrip>
    </div>
  ),
};

// Five tiles share the width equally (Figma KpiStrip Tile 5).
export const StripFiveTiles: Story = {
  render: (args) => (
    <KpiStrip aria-label="Demand KPIs">
      <MetricItem {...args} />
      <MetricItem label="Candidates" value="118" delta="+12" deltaTone="success" />
      <MetricItem label="Interviews" value="31" delta="+4" deltaTone="success" />
      <MetricItem label="Late" value="3" delta="-1" deltaTone="destructive" />
      <MetricItem label="Fill rate" value="62 %" delta="0" />
    </KpiStrip>
  ),
};

// Below md the delta and caption wrap instead of truncating.
export const StripWrapping: Story = {
  render: () => (
    <KpiStrip aria-label="Demand KPIs">
      <MetricItem label="Open demands" value="24" delta="+3 vs last week" caption="Target 160 h per month" />
      <MetricItem label="Candidates" value="118" delta="+12 vs last quarter" deltaTone="success" caption="Across all open demands" />
      <MetricItem label="Late" value="3" delta="-1 since Monday" deltaTone="destructive" />
      <MetricItem label="Fill rate" value="62 %" delta="0" caption="Rolling 30 days" />
    </KpiStrip>
  ),
};

const FilterStripDemo = () => {
  const [active, setActive] = useState(0);
  const items = [
    ['All', '142'],
    ['Open', '24'],
    ['Late', '3'],
  ];
  return (
    <KpiStrip aria-label="Filter by status">
      {items.map(([label, value], i) => (
        <MetricItem key={label} label={label} value={value} selected={active === i} onClick={() => setActive(i)} />
      ))}
    </KpiStrip>
  );
};

export const FilterStrip: Story = { render: () => <FilterStripDemo /> };

// Each tile is one real link: middle click and the context menu open it in a new tab.
export const LinkedStrip: Story = {
  render: () => (
    <KpiStrip aria-label="Key figures, each opens the list">
      <MetricItem label="Open demands" value="24" delta="+3 vs last week" deltaTone="success" href="#open" />
      <MetricItem label="Candidates" value="118" delta="+12 vs last quarter" deltaTone="success" href="#candidates" selected />
      <MetricItem label="Late" value="3" delta="-1 since Monday" deltaTone="destructive" href="#late" />
      <MetricItem label="Fill rate" value="62 %" caption="Rolling 30 days" href="#fill-rate" />
    </KpiStrip>
  ),
};

// asChild merges the tile into your router link.
export const LinkedStripAsChild: Story = {
  render: () => (
    <KpiStrip aria-label="Key figures, router links">
      <MetricItem label="Open demands" value="24" asChild>
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- content is merged in by asChild */}
        <a href="#open" />
      </MetricItem>
      <MetricItem label="Late" value="3" deltaTone="destructive" delta="-1 since Monday" asChild>
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- content is merged in by asChild */}
        <a href="#late" />
      </MetricItem>
      <MetricItem label="Fill rate" value="62 %" />
    </KpiStrip>
  ),
};

export const Loading: Story = {
  render: () => (
    <KpiStrip aria-label="Loading KPIs">
      <MetricItem label="Open tasks" value="" delta="+3 vs last week" loading />
      <MetricItem label="Hours this week" value="" delta="-1 vs last week" loading />
    </KpiStrip>
  ),
};

// Loaded strip above the loading strip with the same label and delta text: the two rows have the same height at every width.
export const LoadingMatchesLoaded: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <KpiStrip aria-label="Loaded KPIs" data-testid="loaded">
        <MetricItem label="Open tasks" value="42" delta="+3 vs last week" />
        <MetricItem label="Hours this week" value="128" delta="-1 vs last week" />
      </KpiStrip>
      <KpiStrip aria-label="Loading KPIs" data-testid="loading">
        <MetricItem label="Open tasks" value="" delta="+3 vs last week" loading />
        <MetricItem label="Hours this week" value="" delta="-1 vs last week" loading />
      </KpiStrip>
    </div>
  ),
};

export const Compact: Story = { args: { variant: 'compact' } };

export const Card: Story = {
  args: { variant: 'card', label: 'Views 24 hours', value: '2,000', delta: '100%', deltaTone: 'success' },
};

export const CardWithFooterAction: Story = {
  args: {
    variant: 'card',
    label: 'Views 24 hours',
    value: '2,000',
    delta: '100%',
    deltaTone: 'success',
    footerAction: <a href="#report" className="typography-link-sm text-link-default">View report</a>,
  },
};

// A strip narrower than 560px wraps into two columns; on a phone that is the whole width.
export const WrapsOnPhone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => (
    <KpiStrip aria-label="Demand KPIs">
      <MetricItem {...args} caption="Target 30" />
      <MetricItem label="Candidates" value="118" delta="+12" deltaTone="success" />
      <MetricItem label="Late" value="3" delta="-1" deltaTone="destructive" />
      <MetricItem label="Fill rate" value="62 %" delta="0" />
      <MetricItem label="Interviews" value="31" />
    </KpiStrip>
  ),
};

// The layout follows the width of the strip, not the viewport: 480px (an open push sheet) gives two columns, 720px one row. Drag the corner of the frame to resize.
export const StripByContainerWidth: StoryObj<typeof KpiStrip> = {
  render: () => (
    <div className="flex flex-col gap-6">
      {[480, 720].map((width) => (
        <div key={width} className="max-w-full overflow-auto" style={{ width, resize: 'horizontal', minWidth: 280 }}>
          <KpiStrip aria-label={`Month summary ${width}px`}>
            <MetricItem label="Revenue net" value="€48,200" delta="+6 % vs. August" deltaTone="success" />
            <MetricItem label="Revenue gross" value="€57,358" delta="incl. 19 % VAT" />
            <MetricItem label="Hours" value="412 h" delta="380 h billable" />
            <MetricItem label="Documents" value="7" delta="€44,100 invoiced" />
          </KpiStrip>
        </div>
      ))}
    </div>
  ),
};

// columns={2} keeps two columns at every width, for a sheet or a side column. A last odd figure takes the full row.
export const StripTwoColumns: StoryObj<typeof KpiStrip> = {
  render: () => (
    <div className="max-w-full" style={{ width: 640 }}>
      <KpiStrip aria-label="Month summary" columns={2}>
        <MetricItem label="Company revenue" value="€96,400" delta="your finance projects" />
        <MetricItem label="Your share" value="€48,200" delta="hours x member rate" />
        <MetricItem label="Part of revenue" value="50.0 %" delta="your share in these projects" />
        <MetricItem label="Hours" value="412 h" delta="380 h billable" />
        <MetricItem label="Documents" value="7" delta="€44,100 invoiced" />
      </KpiStrip>
    </div>
  ),
};

// labelAddon gives a HelpIcon its own place after the label: a long label truncates, the help stays whole.
export const LabelWithHelp: StoryObj<typeof KpiStrip> = {
  render: () => (
    <div className="max-w-full" style={{ width: 480 }}>
      <KpiStrip aria-label="Month summary">
        <MetricItem
          label="Part of revenue in your finance projects"
          labelAddon={<HelpIcon label="How part of revenue is calculated" content="Your share over the revenue of the projects with the Finance right." />}
          value="50.0 %"
          delta="your share in these projects"
        />
        <MetricItem label="Hours" labelAddon={<HelpIcon label="How hours are counted" content="Booked hours of the month, billable and not." />} value="412 h" delta="380 h billable" />
        <MetricItem label="Revenue net" value="€48,200" />
        <MetricItem label="Documents" value="7" />
      </KpiStrip>
    </div>
  ),
};

export const CaptionAndIcon: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <KpiStrip aria-label="Hours">
        <MetricItem {...args} label="Booked" value="142 h" delta="+4 h" caption="Target 160 h" icon={<span className="h-icon-md w-icon-md rounded-full bg-background-brand-subtle" />} />
        <MetricItem label="Open" value="18 h" caption="Until Friday" />
      </KpiStrip>
      <MetricItem variant="compact" label="Booked" value="142 h" caption="Target 160 h" icon={<span className="h-icon-md w-icon-md rounded-full bg-background-brand-subtle" />} />
    </div>
  ),
};

export const CardCompactDensity: Story = {
  render: (args) => <MetricItem {...args} variant="card" density="compact" caption="Target 30" footerAction={<span className="typography-label text-text-brand">View report</span>} />,
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
