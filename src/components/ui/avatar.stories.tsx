import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarImage, AvatarOnlineIndicator, AvatarUpload } from './avatar';

const meta = {
  id: 'primitives-avatar',
  title: 'Primitives · Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'The size of the avatar (16/24/32/40/48/56/64px).',
      defaultValue: 'md',
    },
    shape: {
      control: { type: 'select' },
      options: ['circle', 'square'],
      description: 'Round (people) or 30% squircle (workspaces, companies).',
      defaultValue: 'circle',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Only meaningful with onClick — dims and blocks interaction (aria-disabled/data-disabled).',
      defaultValue: false,
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const IMAGE_SRC = '/img/avatars/lena-hartmann.svg';

export const Default: Story = {
  args: { size: 'md' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={IMAGE_SRC} alt="Lena Hartmann" />
      <AvatarFallback>LH</AvatarFallback>
    </Avatar>
  ),
};

// Text=True in Figma: initials shown when no image is available (or before it loads).
export const Fallback: Story = {
  args: { size: 'md' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>LH</AvatarFallback>
    </Avatar>
  ),
};

// Placeholder=True, Text=False in Figma: no data available at all — AvatarFallback renders a
// generic person glyph when given no children.
export const Placeholder: Story = {
  args: { size: 'md' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback />
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarImage src={IMAGE_SRC} alt="Lena Hartmann" />
          <AvatarFallback>LH</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

// Status icon=Online indicator in Figma: a success-colored dot, cut out against whatever surface
// the avatar sits on, sized at a fixed 1/4 of the avatar at every step.
export const WithOnlineIndicator: Story = {
  args: { size: 'xl' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={IMAGE_SRC} alt="Lena Hartmann" />
      <AvatarFallback>LH</AvatarFallback>
      <AvatarOnlineIndicator size={args.size ?? 'md'} />
    </Avatar>
  ),
};

// Status icon=Verified / Company in Figma are asset-driven (a verified-check icon, an arbitrary
// company logo) rather than a fixed color — AvatarBadge is the generic bottom-right "cutout" slot
// those compose into; consumers bring their own icon/logo as children.
export const WithCustomBadge: Story = {
  args: { size: 'xl' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={IMAGE_SRC} alt="Lena Hartmann" />
      <AvatarFallback>LH</AvatarFallback>
      <AvatarBadge className="h-4 w-4 bg-general-info-default">
        <span className="sr-only">Verified</span>
      </AvatarBadge>
    </Avatar>
  ),
};

// Passing onClick opts Avatar into the interactive "profile trigger" pattern: role="button", a
// tab stop, Enter/Space activation, and hover/active/focus-visible feedback (Figma's Hover/Focused
// states). Without onClick, Avatar stays a plain, non-focusable display (see Default above).
export const InteractiveTrigger: Story = {
  render: (args) => {
    const InteractiveAvatar = () => {
      const [openCount, setOpenCount] = useState(0);
      return (
        <div className="flex items-center gap-3">
          <Avatar {...args} onClick={() => setOpenCount((count) => count + 1)}>
            <AvatarImage src={IMAGE_SRC} alt="Open profile menu for Lena Hartmann" />
            <AvatarFallback>LH</AvatarFallback>
          </Avatar>
          <span className="text-sm text-text-subtle">Menu opened: {openCount}</span>
        </div>
      );
    };
    return <InteractiveAvatar />;
  },
  args: { size: 'md' } as React.ComponentProps<typeof Avatar>,
};

// AVATAR-A11Y-02: an interactive Avatar composed with only the placeholder glyph (no image alt,
// no initials text) has no truthful accessible name to infer — an explicit aria-label describing
// the action is required. See the regression test in avatar.test.tsx.
export const InteractivePlaceholder: Story = {
  args: { size: 'md' } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args} onClick={() => {}} aria-label="Open profile menu">
      <AvatarFallback />
    </Avatar>
  ),
};

export const Disabled: Story = {
  args: { size: 'md', disabled: true } as React.ComponentProps<typeof Avatar>,
  render: (args) => (
    <Avatar {...args} onClick={() => {}}>
      <AvatarImage src={IMAGE_SRC} alt="Lena Hartmann" />
      <AvatarFallback>LH</AvatarFallback>
    </Avatar>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <Avatar key={size} size={size} shape="square">
          <AvatarFallback>WB</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

/** Initials type roles per size (`xs` avatar-xs, `sm` ui-semibold) and the ringed, overlapping group. */
export const InitialsAndGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AvatarGroup aria-label="Team" overflowCount={3}>
        <Avatar size="xs">
          <AvatarFallback size="xs" className="bg-data-avatar-1-default text-data-avatar-1-on">
            AF
          </AvatarFallback>
        </Avatar>
        <Avatar size="xs">
          <AvatarFallback size="xs" className="bg-data-avatar-4-default text-data-avatar-4-on">
            JK
          </AvatarFallback>
        </Avatar>
      </AvatarGroup>
      <AvatarGroup aria-label="Team small" size="sm" overflowCount={12}>
        <Avatar size="sm">
          <AvatarFallback size="sm">AF</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback size="sm">JK</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  ),
};

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de` translates the screen reader texts. `AvatarOnlineIndicator` takes `onlineLabel`, `AvatarGroup` takes `overflowLabel`. Props win over the provider.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <div className="flex items-center gap-6">
        <Avatar size="xl">
          <AvatarFallback>AF</AvatarFallback>
          <AvatarOnlineIndicator size="xl" />
        </Avatar>
        <Avatar size="xl">
          <AvatarFallback>BK</AvatarFallback>
          <AvatarOnlineIndicator size="xl" onlineLabel="Gerade aktiv" />
        </Avatar>
        <AvatarGroup overflowCount={3} overflowLabel=" weitere Personen">
          <Avatar size="xs">
            <AvatarFallback>AF</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      </div>
    </DesignSystemProvider>
  ),
};

export const ProfileWithUpload: StoryObj<typeof Avatar> = {
  render: () => (
    <Avatar size="profile">
      <AvatarFallback size="profile" className="bg-muted text-text-subtle">AF</AvatarFallback>
      <AvatarUpload onClick={() => {}} />
    </Avatar>
  ),
};

// Upload gated by the plan: the button stays hoverable and focusable, a click or Enter calls onGatedClick (never onClick) and explains instead of opening the picker. The reason is also linked with aria-describedby.
const GatedUpload = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-start gap-3">
      <Avatar size="profile">
        <AvatarFallback size="profile" className="bg-muted text-text-subtle">AF</AvatarFallback>
        <AvatarUpload aria-disabled="true" aria-describedby="upload-reason" onGatedClick={() => setCount((value) => value + 1)} />
      </Avatar>
      <p id="upload-reason" className="typography-text-small text-text-subtle">Changing the photo needs the Team plan.</p>
      {/* The key makes the status a new node on every activation, so a repeat is announced again. */}
      <p role="status" key={count} className="typography-text-small text-text-default">{count > 0 ? 'Not available on your plan.' : ''}</p>
    </div>
  );
};

export const ProfileUploadGated: StoryObj<typeof Avatar> = {
  render: () => <GatedUpload />,
};
