import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';

import { FeaturedIcon } from './featured-icon';

const meta = {
  id: 'primitives-featured-icon',
  title: 'Primitives · Display/Featured icon',
  component: FeaturedIcon,
  tags: ['autodocs'],
  args: { children: <Info />, tone: 'brand' },
  argTypes: {
    tone: { control: { type: 'select' }, options: ['neutral', 'brand', 'success', 'warning', 'destructive', 'info'] },
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] },
    shape: { control: { type: 'select' }, options: ['circle', 'square'] },
  },
} satisfies Meta<typeof FeaturedIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['neutral', 'brand', 'success', 'warning', 'destructive', 'info'] as const).map((tone) => (
        <FeaturedIcon key={tone} tone={tone}>
          {tone === 'success' ? <CheckCircle2 /> : tone === 'warning' || tone === 'destructive' ? <TriangleAlert /> : <Info />}
        </FeaturedIcon>
      ))}
    </div>
  ),
};
export const SizesAndShapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <FeaturedIcon size="sm"><Info /></FeaturedIcon>
      <FeaturedIcon size="md"><Info /></FeaturedIcon>
      <FeaturedIcon size="lg" shape="square"><Info /></FeaturedIcon>
    </div>
  ),
};
export const Labelled: Story = { args: { label: 'Information', tone: 'info' } };
