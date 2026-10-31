import type { Meta, StoryObj } from '@storybook/react';

import { MetricPanel } from './metric-panel';

const meta = {
  id: 'data-display-metric-panel',
  title: 'Patterns · Data/Metric panel',
  component: MetricPanel,
  tags: ['autodocs'],
  args: { label: 'Net result per month', value: '4.200 EUR', description: 'After tax and fees, based on 140 billable hours.' },
} satisfies Meta<typeof MetricPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSecondaryFigures: Story = {
  args: { secondary: [{ label: 'Gross revenue', value: '6.100 EUR' }, { label: 'Tax', value: '1.400 EUR' }, { label: 'Fees', value: '500 EUR' }], live: true },
};
const secondary = [{ label: 'Per year', value: '50.400 EUR' }];
export const InverseFixed: Story = { args: { tone: 'inverse-fixed', secondary } };
export const LargeResult: Story = { args: { size: 'lg', secondary } };
export const LargeResultInverseFixed: Story = { args: { size: 'lg', tone: 'inverse-fixed', secondary } };
export const StackedSecondary: Story = { args: { size: 'lg', secondaryLayout: 'stacked', secondary } };
export const StackedReverseSecondary: Story = { args: { size: 'lg', secondaryLayout: 'stacked-reverse', secondary } };
export const MediumLabel: Story = { args: { labelWeight: 'medium', secondary } };
export const BorderlessInverseFixed: Story = { args: { tone: 'inverse-fixed', bordered: false, secondary } };
export const FillHeight: Story = {
  args: { fill: true, secondary },
  decorators: [(Story) => <div className="flex h-96"><div className="flex-1"><Story /></div></div>],
};
