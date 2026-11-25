import type { Meta, StoryObj } from '@storybook/react';

import { ActivityGauge, ChartLegend, HBarList, Histogram, LineBarChart, PieChart, RadarChart, Sparkline, Treemap } from './chart';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-charts',
  title: 'Patterns · Data/Charts',
  component: LineBarChart,
  tags: ['autodocs'],
  // onRetry shows the error button
  parameters: { actions: { argTypesRegex: '^on(?!Retry)[A-Z].*' } },
  args: {
    title: 'Active users per month',
    description: 'Active users and trials for the first six months.',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      { id: 'a', label: 'Active users', values: [260, 340, 220, 300, 220, 340] },
      { id: 'b', label: 'Trials', values: [250, 330, 220, 290, 220, 330] },
    ],
    xTitle: 'Month',
    yTitle: 'Users',
  },
} satisfies Meta<typeof LineBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Long category names wrap onto several lines, and a derived value (conversion rate) shows in the tooltip and the data table.
export const WrappedLabelsAndDerived: Story = {
  args: {
    type: 'bar',
    tooltip: true,
    legend: true,
    title: 'Funnel by acquisition channel',
    categories: ['Organic search traffic', 'Paid social campaigns', 'Newsletter subscribers', 'Partner referrals'],
    series: [
      { id: 'visits', label: 'Visits', values: [1200, 800, 400, 300] },
      { id: 'signups', label: 'Signups', values: [96, 40, 52, 45] },
    ],
    wrapLabels: true,
    derived: { key: 'rate', label: 'Conversion', compute: (d) => (d.values.visits ? d.values.signups / d.values.visits : null), format: (v) => `${(v * 100).toFixed(1)} %` },
    xTitle: 'Channel',
    yTitle: 'Count',
  },
};
export const Bar: Story = { args: { type: 'bar' } };
// width="auto" measures the container and draws at the real pixel width: the axis text keeps the token size instead of shrinking with the viewBox. The frame below is 390 px wide like a phone. categoryLabel renames the first column of the data table.
export const FluidWidth: Story = {
  args: { type: 'bar', width: 'auto', tooltip: true, categoryLabel: 'Month', showTable: true },
  decorators: [
    (Story) => (
      <div style={{ width: 390, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
// Hover tooltip stays inside the chart box.
export const WithTooltip: Story = { args: { type: 'bar', tooltip: true, legend: true } };
export const Line: Story = { args: { type: 'line', legend: true, legendPosition: 'top' } };
// Keyboard: Tab reaches the plot, the left and right arrow keys (Home, End) step through the categories, the tooltip follows and the values are read in a live region. The play function presses the keys in a real browser.
export const KeyboardFocus: Story = {
  args: { type: 'bar', tooltip: true, legend: true, title: 'Active users per month (keyboard)' },
  play: async ({ canvasElement }) => {
    const plot = canvasElement.querySelector<HTMLElement>('[aria-roledescription="chart"]');
    if (!plot) throw new Error('The chart has no focus target');
    plot.focus();
    await new Promise((resolve) => setTimeout(resolve, 50));
    plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const live = canvasElement.querySelector('[data-chart-live]')?.textContent ?? '';
    if (!/Feb, 2 of 6/.test(live)) throw new Error(`The data point was not announced: "${live}"`);
    if (!canvasElement.querySelector('[data-chart-tooltip]')) throw new Error('The tooltip does not follow the keyboard');
  },
};
// Planning roles of kette-tokens 5.28.0: the ideal line (guideline) and the projection next to the remaining work.
export const PlanningRoles: Story = {
  args: {
    type: 'line',
    legend: true,
    tooltip: true,
    title: 'Sprint burndown',
    description: 'Remaining story points against the ideal line and the projection.',
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      { id: 'remaining', label: 'Remaining', values: [40, 34, 30, 24, 22], tone: 1 },
      { id: 'ideal', label: 'Ideal', values: [40, 32, 24, 16, 8], tone: 'guideline' },
      { id: 'projection', label: 'Projection', values: [40, 34, 30, 28, 27], tone: 'projection' },
    ],
    xTitle: 'Day',
    yTitle: 'Story points',
  },
};
export const BarZero: Story = {
  args: {
    stacked: true,
    legend: true,
    legendPosition: 'right',
    series: [
      { id: 'a', label: 'Core', values: [260, 340, 220, 300, 220, 340], tone: 'brand-7' },
      { id: 'b', label: 'Extended', values: [250, 330, 220, 290, 220, 330], tone: 'brand-5' },
      { id: 'c', label: 'Trial', values: [230, 300, 210, 270, 210, 300], tone: 'brand-2' },
    ],
  },
};
// Figma Column chart Type=Single: one series, a tone per column and a value label above each bar.
export const ColumnSingleValues: Story = {
  args: {
    showValues: true,
    axisLabels: true,
    title: 'Hours by person',
    categories: ['Ana', 'Ben', 'Cem', 'Dia', 'Eli', 'Fay'],
    series: [{ id: 'h', label: 'Hours', values: [32, 41, 28, 36, 22, 40], pointTones: [1, 2, 3, 4, 5, 6] }],
  },
};
// Figma Column chart Type=Grouped: plan and actual per column.
export const ColumnGroupedValues: Story = {
  args: {
    showValues: true,
    legend: true,
    title: 'Plan and actual',
    categories: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [
      { id: 'plan', label: 'Plan', values: [40, 45, 50, 48], tone: 'neutral' },
      { id: 'act', label: 'Actual', values: [36, 47, 44, 52], tone: 'brand' },
    ],
  },
};
// Figma Column chart Type=Stacked: the value label sits above the column total.
export const ColumnStackedValues: Story = {
  args: {
    stacked: true,
    showValues: true,
    legend: true,
    title: 'Open and done',
    categories: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [
      { id: 'done', label: 'Done', values: [20, 25, 22, 30], tone: 'brand' },
      { id: 'open', label: 'Open', values: [10, 8, 12, 6], tone: 'neutral' },
    ],
  },
};
// Few booked hours: integerTicks keeps the y-axis in whole hours (0 1 2 3 4) instead of quarters of a nice maximum (1.3, 3.8).
export const IntegerTicks: Story = {
  args: {
    type: 'bar',
    integerTicks: true,
    legend: true,
    title: 'Weekly progress',
    description: 'Booked hours against plan, last six weeks.',
    xTitle: undefined,
    yTitle: 'Hours',
    categories: ['CW 40', 'CW 41', 'CW 42', 'CW 43', 'CW 44', 'CW 45'],
    series: [
      { id: 'plan', label: 'Plan', values: [3, 3, 3, 3, 3, 3], tone: 'neutral' },
      { id: 'act', label: 'Actual', values: [1, 3, 2, 0, 3, 2], tone: 'brand' },
    ],
  },
};
// Money values: `valueFormat` with an Intl currency puts the unit on the totals above the columns, in the tooltip and in the table. The axis keeps plain numbers, the unit is in the axis title. German locale: "12.400 €".
export const ColumnStackedMoney: Story = {
  args: {
    stacked: true,
    showValues: true,
    tooltip: true,
    legend: true,
    title: 'Revenue by month',
    yTitle: 'EUR',
    valueFormat: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    categories: ['Jul', 'Aug', 'Sep', 'Oct'],
    series: [
      { id: 'anna', label: 'Anna', values: [6400, 7200, 5800, 8100], tone: 1 },
      { id: 'ben', label: 'Ben', values: [4200, 3900, 5100, 4300], tone: 2 },
      { id: 'cara', label: 'Cara', values: [1800, 2600, 2400, 3000], tone: 3 },
    ],
  },
  decorators: [
    (Story) => (
      <DesignSystemProvider locale="de" preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
export const WithVisibleTable: Story = { args: { showTable: true } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorState: Story = { args: { state: 'error' } };

export const Pie: StoryObj<typeof PieChart> = {
  render: () => (
    <PieChart
      title="Revenue by product"
      size="md"
      centerLabel="100 %"
      slices={[
        { id: 'a', label: 'Backoffice', value: 45 },
        { id: 'b', label: 'Workstream', value: 30 },
        { id: 'c', label: 'Vacancy', value: 25 },
      ]}
    />
  ),
};

export const Radar: StoryObj<typeof RadarChart> = {
  render: () => (
    <RadarChart
      title="Load per weekday"
      axes={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
      series={[
        { id: 'a', label: 'Person', values: [800, 500, 300, 900, 200, 1000, 700] },
        { id: 'b', label: 'Demand', values: [300, 1000, 200, 600, 400, 800, 900] },
      ]}
    />
  ),
};

export const GaugeRings: StoryObj<typeof ActivityGauge> = {
  render: () => (
    <ActivityGauge
      aria-label="Activity by channel"
      size="md"
      legend="right"
      label="Active users"
      valueText="1,000"
      series={[
        { id: 'a', label: 'Series 1', value: 85 },
        { id: 'b', label: 'Series 2', value: 60 },
        { id: 'c', label: 'Series 3', value: 35 },
      ]}
    />
  ),
};
export const Gauge: StoryObj<typeof ActivityGauge> = { render: () => <ActivityGauge aria-label="Weekly activity" value={72} label="Active users" size="md" /> };
export const SparklineStory: StoryObj<typeof Sparkline> = { name: 'Sparkline', render: () => <Sparkline aria-label="Trend, rising" values={[2, 4, 3, 6, 5, 8]} /> };
export const HistogramStory: StoryObj<typeof Histogram> = {
  name: 'Histogram',
  render: () => (
    <Histogram
      title="Score distribution"
      highlight={[3, 5]}
      bins={[{ label: '0', value: 2 }, { value: 4 }, { value: 8 }, { value: 14 }, { label: '50', value: 20 }, { value: 16 }, { value: 9 }, { value: 5 }, { value: 3 }, { label: '100', value: 1 }]}
    />
  ),
};
// width="auto" fills the container and follows its width, like LineBarChart.
export const HistogramFluid: StoryObj<typeof Histogram> = {
  name: 'Histogram fluid width',
  render: () => (
    <div className="w-full max-w-2xl">
      <Histogram
        title="Score distribution"
        width="auto"
        highlight={[3, 5]}
        bins={[{ label: '0', value: 2 }, { value: 4 }, { value: 8 }, { value: 14 }, { label: '50', value: 20 }, { value: 16 }, { value: 9 }, { value: 5 }, { value: 3 }, { label: '100', value: 1 }]}
      />
    </div>
  ),
};
export const HBars: StoryObj<typeof HBarList> = {
  name: 'HBarList',
  render: () => (
    <HBarList
      aria-label="Top skills"
      items={[
        { id: 'a', label: 'Figma', value: 3, valueLabel: '3 proj.', tone: 2 },
        { id: 'b', label: 'Design systems', value: 2, valueLabel: '2 proj.', tone: 2 },
        { id: 'c', label: 'Lead UX Designer', value: 1, valueLabel: '1 proj.' },
      ]}
    />
  ),
};
// Rows coloured by skill category (HBarItem.skill), like SkillTree.
export const HBarsBySkill: StoryObj<typeof HBarList> = {
  render: () => (
    <HBarList
      aria-label="Top skills by category"
      items={[
        { id: 'a', label: 'React', value: 9, valueLabel: '9 proj.', skill: 'frontend' },
        { id: 'b', label: 'NestJS', value: 7, valueLabel: '7 proj.', skill: 'backend' },
        { id: 'c', label: 'Kubernetes', value: 4, valueLabel: '4 proj.', skill: 'devops-cloud' },
        { id: 'd', label: 'Figma', value: 3, valueLabel: '3 proj.', skill: 'design-ux' },
      ]}
    />
  ),
};
// Up to 12 rows and 8 legend entries (Figma Bar list Row 1-12, Legend item 1-8).
export const HBarsTwelveRows: StoryObj<typeof HBarList> = {
  render: () => {
    const segs = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost', 'On hold', 'Other'];
    return (
      <HBarList
        aria-label="Deals per owner"
        items={Array.from({ length: 12 }, (_, i) => ({
          id: `r${i}`,
          label: `Owner number ${i + 1}`,
          value: 0,
          segments: segs.map((label, si) => ({ id: label, label, value: ((i + si) % 5) + 1 })),
        }))}
      />
    );
  },
};
// Browser check (runs in test-storybook): jsdom has no layout, so the bar height is measured in a real browser. A stacked bar once collapsed to 0px.
const assertBarsHaveHeight = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const bars = Array.from(canvasElement.querySelectorAll<HTMLElement>('li[data-layout="stacked"] > span[aria-hidden="true"]'));
  if (bars.length === 0) throw new Error('No stacked bars rendered');
  bars.forEach((bar) => {
    const { height, width } = bar.getBoundingClientRect();
    if (!(height > 0) || !(width > 0)) throw new Error(`Stacked bar has no size: ${width}x${height}`);
  });
};

export const HBarsStacked: StoryObj<typeof HBarList> = {
  render: () => <HBarList aria-label="Top skills" layout="stacked" items={[{ id: 'a', label: 'Figma', value: 3, valueLabel: '3 proj.' }, { id: 'b', label: 'Design systems', value: 2, valueLabel: '2 proj.' }]} />,
  play: assertBarsHaveHeight,
};
// Analytics dashboard shape: stacked layout with segmented rows.
export const HBarsStackedSegmented: StoryObj<typeof HBarList> = {
  render: () => (
    <div className="max-w-md">
      <HBarList
        aria-label="Hours per project"
        layout="stacked"
        items={[
          { id: 'a', label: 'Website relaunch', value: 0, valueLabel: '120 h', segments: [{ id: 'billable', label: 'Billable', value: 84, tone: 'brand' }, { id: 'internal', label: 'Internal', value: 36, tone: 'neutral' }] },
          { id: 'b', label: 'Mobile app', value: 0, valueLabel: '64 h', segments: [{ id: 'billable', label: 'Billable', value: 48, tone: 'brand' }, { id: 'internal', label: 'Internal', value: 16, tone: 'neutral' }] },
          { id: 'c', label: 'Maintenance', value: 0, valueLabel: '22 h', segments: [{ id: 'billable', label: 'Billable', value: 10, tone: 'brand' }, { id: 'internal', label: 'Internal', value: 12, tone: 'neutral' }] },
        ]}
      />
    </div>
  ),
  play: assertBarsHaveHeight,
};
// Segmented rows: each row splits into stacked parts and a legend names them.
export const HBarsSegmented: StoryObj<typeof HBarList> = {
  render: () => (
    <HBarList
      aria-label="Tasks per project"
      items={[
        {
          id: 'a',
          label: 'Website relaunch',
          value: 0,
          segments: [
            { id: 'open', label: 'Open', value: 4, tone: 'neutral' },
            { id: 'progress', label: 'In progress', value: 6, tone: 'brand' },
            { id: 'done', label: 'Done', value: 12, tone: 'success' },
          ],
        },
        {
          id: 'b',
          label: 'Mobile app',
          value: 0,
          segments: [
            { id: 'open', label: 'Open', value: 9, tone: 'neutral' },
            { id: 'progress', label: 'In progress', value: 3, tone: 'brand' },
            { id: 'done', label: 'Done', value: 2, tone: 'success' },
          ],
        },
      ]}
    />
  ),
};
export const TreemapStory: StoryObj<typeof Treemap> = {
  name: 'Treemap',
  render: () => (
    <Treemap
      title="Skills by category"
      items={[
        { id: 'a', label: 'Frontend', value: 96 },
        { id: 'b', label: 'Backend', value: 72 },
        { id: 'c', label: 'Project management', value: 50 },
        { id: 'd', label: 'Methods', value: 44 },
        { id: 'e', label: 'Design and UX', value: 30 },
        { id: 'f', label: 'Mobile', value: 9 },
      ]}
    />
  ),
};
export const Legend: StoryObj<typeof ChartLegend> = { render: () => <ChartLegend items={[{ id: 'a', label: 'Series 1' }, { id: 'b', label: 'Series 2' }]} /> };

export const LegendWarningAndCustom: StoryObj<typeof ChartLegend> = {
  render: () => (
    <ChartLegend
      items={[
        { id: 'a', label: 'On track', tone: 'success' },
        { id: 'b', label: 'At risk', tone: 'warning' },
        { id: 'c', label: 'Project colour', color: 'bg-data-project-3' },
      ]}
    />
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
// Series of one measure use the brand ramp (brand-4 and brand-2), categorical tones are for categories.
export const ZeroPreset: Story = {
  args: {
    type: 'bar',
    legend: true,
    series: [
      { id: 'a', label: 'Active users', values: [260, 340, 220, 300, 220, 340], tone: 'brand-4' },
      { id: 'b', label: 'Trials', values: [250, 330, 220, 290, 220, 330], tone: 'brand-2' },
    ],
  },
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
