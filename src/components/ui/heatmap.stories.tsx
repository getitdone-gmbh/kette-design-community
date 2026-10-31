import type { Meta, StoryObj } from '@storybook/react';

import { Heatmap, HeatmapCell, HeatmapRow } from './heatmap';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-heatmap',
  title: 'Patterns · Data/Heatmap',
  component: Heatmap,
  tags: ['autodocs'],
  // onRetry shows the error button
  parameters: { actions: { argTypesRegex: '^on(?!Retry)[A-Z].*' } },
  args: { 'aria-label': 'Workload', columns: ['W41', 'W42', 'W43'] },
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Load: Story = {
  args: {
    children: (
      <>
        <HeatmapRow header="Anna Becker">
          <HeatmapCell tone="ok">80 %</HeatmapCell>
          <HeatmapCell tone="ok">90 %</HeatmapCell>
          <HeatmapCell tone="over">120 %</HeatmapCell>
        </HeatmapRow>
        <HeatmapRow header="Mia Hofmann">
          <HeatmapCell tone="free">20 %</HeatmapCell>
          <HeatmapCell tone="need">Need 1</HeatmapCell>
          <HeatmapCell tone="empty">-</HeatmapCell>
        </HeatmapRow>
      </>
    ),
  },
};

export const Skill: Story = {
  args: {
    'aria-label': 'Skill levels',
    columns: ['React', 'TypeScript', 'Node.js', 'Go'],
    children: (
      <HeatmapRow header="Anna Becker">
        <HeatmapCell tone="skill-4">4</HeatmapCell>
        <HeatmapCell tone="skill-3">3</HeatmapCell>
        <HeatmapCell tone="skill-2">2</HeatmapCell>
        <HeatmapCell tone="skill-1">1</HeatmapCell>
      </HeatmapRow>
    ),
  },
};

export const Coverage: Story = {
  args: {
    'aria-label': 'Coverage',
    rowHeaderLabel: 'Demand',
    columns: ['Java', 'Spring', 'Kafka'],
    children: (
      <HeatmapRow header="Demand A">
        <HeatmapCell tone="coverage-full" label="Covered" />
        <HeatmapCell tone="coverage-partial" label="Partly covered" />
        <HeatmapCell tone="coverage-none" label="Not covered" />
      </HeatmapRow>
    ),
  },
};

export const Interactive: Story = {
  args: {
    children: (
      <HeatmapRow header="Anna Becker">
        <HeatmapCell tone="ok" onClick={() => {}}>
          80 %
        </HeatmapCell>
        <HeatmapCell tone="over" selected onClick={() => {}}>
          120 %
        </HeatmapCell>
        <HeatmapCell tone="free" onClick={() => {}}>
          20 %
        </HeatmapCell>
      </HeatmapRow>
    ),
  },
};

export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorState: Story = { args: { state: 'error' } };

export const RevenueStates: Story = {
  args: {
    'aria-label': 'Revenue',
    columns: ['Jul', 'Aug', 'Sep'],
    children: (
      <HeatmapRow header="Acme">
        <HeatmapCell tone="paid">12.000</HeatmapCell>
        <HeatmapCell tone="unpaid">8.400</HeatmapCell>
        <HeatmapCell tone="forecast">9.000</HeatmapCell>
      </HeatmapRow>
    ),
  },
};

export const ContinuousIntensity: Story = {
  args: {
    'aria-label': 'Activity',
    columns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    children: (
      <HeatmapRow header="Week 41">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <HeatmapCell key={v} intensity={v}>
            {Math.round(v * 100)}
          </HeatmapCell>
        ))}
      </HeatmapRow>
    ),
  },
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  ...Load,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
