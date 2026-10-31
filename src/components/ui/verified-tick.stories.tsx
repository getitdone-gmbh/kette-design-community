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
