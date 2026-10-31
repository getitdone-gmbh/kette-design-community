import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { SignaturePad, type SignaturePadHandle } from './signature-pad';

const meta = {
  id: 'primitives-signaturepad',
  title: 'Primitives · Inputs/SignaturePad',
  component: SignaturePad,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };

const WithPreview = () => {
  const ref = React.useRef<SignaturePadHandle>(null);
  const [png, setPng] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <SignaturePad ref={ref} onChange={setPng} />
      <p className="typography-ui text-text-subtle">{png ? 'Signature captured' : 'Draw above'}</p>
    </div>
  );
};

export const WithResult: Story = { render: () => <WithPreview /> };
