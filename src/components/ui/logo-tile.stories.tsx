import type { Meta, StoryObj } from '@storybook/react';

import { LogoTile, type LogoTileColor } from './logo-tile';

// Fictional uploaded workspace logo (square, own colours), as a data URI so the story needs no asset.
const WORKSPACE_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f766e"/><path d="M14 46 L32 14 L50 46 Z" fill="#ccfbf1"/><circle cx="32" cy="38" r="6" fill="#0f766e"/></svg>')}`;

const meta = {
  id: 'primitives-logotile',
  title: 'Primitives · Display/LogoTile',
  component: LogoTile,
  tags: ['autodocs'],
  args: { initials: 'AC', color: 1, size: 'xs' },
  argTypes: {
    color: { control: { type: 'select' }, options: [1, 2, 3, 4, 5, 6, 7, 8] },
    size: { control: { type: 'select' }, options: ['xs', 'sm', 'md'] },
  },
} satisfies Meta<typeof LogoTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllColors: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {([1, 2, 3, 4, 5, 6, 7, 8] as LogoTileColor[]).map((c) => (
        <LogoTile key={c} color={c} initials={`C${c}`} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LogoTile initials="AC" size="xs" />
      <LogoTile initials="AC" size="sm" />
      <LogoTile initials="AC" size="md" />
    </div>
  ),
};

// Neutral tile for third-party brand logos (integrations): the logo keeps its own colours.
export const NeutralBrandLogo: Story = {
  args: { tone: 'neutral', initials: undefined, label: 'Slack' },
  render: (args) => (
    <div className="flex items-center gap-2">
      {(['xs', 'sm', 'md'] as const).map((size) => (
        <LogoTile key={size} {...args} size={size}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
          </svg>
        </LogoTile>
      ))}
    </div>
  ),
};

// Outline tile with a logo as children or `src`, here in the 40px `md` size.
export const OutlineWithLogo: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LogoTile tone="outline" size="md" label="Acme">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </LogoTile>
      <LogoTile tone="outline" size="md" initials="AC" />
    </div>
  ),
};

// ZERO-830 P4: an uploaded logo fills the project colour tile; without `src` the initials show.
export const ColorWithImage: Story = {
  name: 'Color with image',
  render: () => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md'] as const).map((size) => (
        <LogoTile key={size} tone="color" color={3} size={size} initials="NW" label={`Nordwind ${size}`} src={WORKSPACE_LOGO} />
      ))}
      <LogoTile tone="color" color={3} size="md" initials="NW" label="Nordwind without image" />
    </div>
  ),
};
