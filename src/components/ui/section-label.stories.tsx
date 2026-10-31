import type { Meta, StoryObj } from '@storybook/react';

import { SectionLabel } from './section-label';

const meta = {
  id: 'layout-section-label',
  title: 'Patterns · Interface/Section label',
  component: SectionLabel,
  tags: ['autodocs'],
  args: { index: '01', overline: 'Process', title: 'How we work', description: 'Three short steps from the first call to the first release.' },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = { args: { overline: undefined, description: undefined } };
export const Sequence: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <SectionLabel index="01" overline="Discover" title="Understand the problem" />
      <SectionLabel index="02" overline="Build" title="Ship in small steps" />
      <SectionLabel index="03" overline="Run" title="Operate and improve" />
    </div>
  ),
};
// Narrow rail: the index sits above the title.
export const Stacked: Story = { args: { layout: 'stacked', index: '03', indexSize: 'lg', overline: 'Run', title: 'Operate and improve' }, decorators: [(Story) => <div className="w-48"><Story /></div>] };
export const LargeIndex: Story = { args: { index: '03', indexSize: 'lg', overline: 'Run', title: 'Operate and improve' } };
