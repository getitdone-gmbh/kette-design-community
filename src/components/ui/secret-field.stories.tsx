import type { Meta, StoryObj } from '@storybook/react';

import { DesignSystemProvider } from './design-system-provider';
import { SecretField } from './secret-field';

const meta = {
  id: 'primitives-secret-field',
  title: 'Primitives · Inputs/Secret field',
  component: SecretField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Read-only field for API keys and private URLs. Shows the first and last characters, masks the rest, reveals on request and copies the real value.',
      },
    },
  },
  args: { value: 'demo_key_51Hx9a2b3c4d5e6f7g8h9i0j', 'aria-label': 'API key' },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
} satisfies Meta<typeof SecretField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ApiKey: Story = {};

export const Revealed: Story = { args: { defaultRevealed: true } };

export const McpUrl: Story = {
  args: { value: 'https://api.example.com/servers/7f3a9c2e-4b1d-4e8a-9c55', 'aria-label': 'MCP URL', visibleChars: 8 },
};

export const CopyOnly: Story = { args: { revealable: false } };

export const Disabled: Story = { args: { disabled: true } };

export const German: Story = {
  render: (args) => (
    <DesignSystemProvider locale="de">
      <SecretField {...args} aria-label="API-Schlüssel" />
    </DesignSystemProvider>
  ),
};
