import type { Meta, StoryObj } from '@storybook/react';

import { Blockquote } from './blockquote';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'primitives-blockquote',
  title: 'Primitives · Display/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
  argTypes: { variant: { control: { type: 'select' }, options: ['default', 'pull'] } },
  args: { children: 'The system fits on one page. Everything else is a variant of it.' },
  decorators: [
    (Story) => (
      <div className="max-w-reading p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Blockquote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAttribution: Story = { args: { cite: 'Lena Hartmann, Head of Design' } };

export const Pull: Story = { args: { variant: 'pull' } };

export const PullWithAttribution: Story = { args: { variant: 'pull', cite: 'Lena Hartmann, Head of Design' } };

export const WithSourceAddress: Story = { args: { cite: 'Design review notes', citeUrl: 'https://example.com/notes' } };

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  args: { cite: 'Lena Hartmann, Head of Design' },
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
