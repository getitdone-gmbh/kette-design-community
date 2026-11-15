import type { Meta, StoryObj } from '@storybook/react';

import { VerifiedTick, verifiedTickSizes, type VerifiedTickSize } from './verified-tick';

const meta = {
  id: 'primitives-verifiedtick',
  title: 'Primitives · Display/VerifiedTick',
  component: VerifiedTick,
  tags: ['autodocs'],
  argTypes: { size: { control: { type: 'select' }, options: Object.keys(verifiedTickSizes) } },
} satisfies Meta<typeof VerifiedTick>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(Object.keys(verifiedTickSizes) as VerifiedTickSize[]).map((s) => (
        <VerifiedTick key={s} size={s} />
      ))}
    </div>
  ),
};

export const NextToName: Story = {
  render: () => (
    <span className="typography-ui-medium inline-flex items-center gap-1 text-text-default">
      Acme GmbH <VerifiedTick size="md" />
    </span>
  ),
};

/** `tone` picks the colour pair. `info` (default) is the Figma look, `brand` follows the theme brand colour, `success` and `neutral` fit lists where blue would read as a link. */
export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['info', 'brand', 'success', 'neutral'] as const).map((tone) => (
        <span key={tone} className="typography-ui-medium inline-flex items-center gap-1 text-text-default">
          {tone} <VerifiedTick tone={tone} size="lg" label={`Verified, ${tone}`} />
        </span>
      ))}
    </div>
  ),
};
