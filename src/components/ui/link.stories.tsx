import type { Meta, StoryObj } from '@storybook/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { Link } from './link';

const meta = {
  id: 'primitives-link',
  title: 'Primitives · Actions/Link',
  component: Link,
  tags: ['autodocs'],
  args: { children: 'View details', href: '#', color: 'brand', size: 'md' },
  argTypes: {
    color: { control: { type: 'select' }, options: ['brand', 'neutral', 'destructive'] },
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    disabled: { control: { type: 'boolean' } },
    dotLeading: { control: { type: 'boolean' } },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Colors: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <Link {...args} color="brand">
        Brand
      </Link>
      <Link {...args} color="neutral">
        Neutral
      </Link>
      <Link {...args} color="destructive">
        Destructive
      </Link>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
        <Link key={s} {...args} size={s} icon={<Plus className="h-full w-full" />} iconTrailing={<ArrowUpRight className="h-full w-full" />}>
          {s}
        </Link>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  args: { icon: <Plus className="h-full w-full" />, iconTrailing: <ArrowUpRight className="h-full w-full" /> },
};

export const DotLeading: Story = { args: { dotLeading: true } };

export const Disabled: Story = { args: { disabled: true } };

// Gated: aria-disabled alone keeps the link in the tab order. Enter or a click calls onGatedClick, nothing navigates.
const GatedLink = () => {
  const [message, setMessage] = useState('');
  return (
    <div className="flex flex-col items-start gap-2">
      <Link href="/billing" aria-disabled="true" aria-describedby="billing-reason" onGatedClick={() => setMessage('Not available to you.')}>
        Billing
      </Link>
      <p id="billing-reason" className="typography-text-small text-text-subtle">Billing is only open to owners.</p>
      <p role="status" className="typography-text-small text-text-subtle">{message}</p>
    </div>
  );
};

export const Gated: StoryObj<typeof Link> = {
  render: () => <GatedLink />,
};

export const Inverse: StoryObj<typeof Link> = {
  render: () => (
    <div className="flex gap-4 rounded-surface bg-background-inverse p-6">
      <Link href="#" color="inverse">Privacy</Link>
      <Link href="#" color="inverse">Imprint</Link>
    </div>
  ),
};

export const InheritInAlert: StoryObj<typeof Link> = {
  render: () => (
    <div className="rounded-surface bg-general-warning-container p-4 text-general-warning-on-container">
      Your plan expires soon. <Link href="#" color="inherit">Renew now</Link>
    </div>
  ),
};

export const InheritTypographyInHeading: StoryObj<typeof Link> = {
  render: () => (
    <p className="typography-lead max-w-prose text-text-default">
      Read the <Link href="#" color="inherit" typography="inherit">full changelog</Link> for every release.
    </p>
  ),
};

export const UnderlineControl: Story = {
  render: () => (
    <p className="typography-body">
      <Link href="#" color="inherit" typography="inherit" underline="always">Always</Link>
      {' · '}
      <Link href="#" color="inherit" typography="inherit" underline="hover">On hover</Link>
      {' · '}
      <Link href="#" color="inherit" typography="inherit" underline="none">None</Link>
    </p>
  ),
};

export const MediumWeightNormalTracking: Story = {
  render: () => (
    <p className="typography-body tracking-wide">
      Read the <Link href="#" typography="inherit" weight="medium" tracking="normal">changelog</Link> or the <Link href="#" typography="inherit" weight="medium" tracking="inherit">release notes</Link>.
    </p>
  ),
};
