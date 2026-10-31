import type { Meta, StoryObj } from '@storybook/react';

import { SignatureBox } from './signature-box';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'primitives-signaturebox',
  title: 'Primitives · Inputs/SignatureBox',
  component: SignatureBox,
  tags: ['autodocs'],
  // onSign turns the open box into a button, so it must not get an automatic action arg.
  parameters: { actions: { argTypesRegex: '^on(?!Sign)[A-Z].*' } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignatureBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Signed: Story = { args: { name: 'Lena Hartmann', signedAt: '08.10.2026 14:12' } };
export const Open: Story = { args: { placeholder: 'Sign here' } };
export const OpenActionable: Story = { args: { onSign: () => {} } };
export const OpenDisabled: Story = { args: { onSign: () => {}, disabled: true } };

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
