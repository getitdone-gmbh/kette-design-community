import type { Meta, StoryObj } from '@storybook/react';
import { Briefcase } from 'lucide-react';

import { LinkCard } from './link-card';

const meta = {
  id: 'cards-link-card',
  title: 'Patterns · Interface/Link card',
  component: LinkCard,
  tags: ['autodocs'],
  args: { href: '#services', title: 'Product development', description: 'From first prototype to a maintained product.' },
} satisfies Meta<typeof LinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { icon: <Briefcase className="h-icon-lg w-icon-lg" /> } };
export const TitleOnly: Story = { args: { description: undefined } };

const Placeholder = ({ label }: { label: string }) => (
  <svg role="img" aria-label={label} viewBox="0 0 16 9" preserveAspectRatio="xMidYMid slice" className="bg-background-brand-subtle text-icon-brand">
    <circle cx="8" cy="4.5" r="2" fill="currentColor" />
  </svg>
);

export const MediaTop: Story = { args: { layout: 'media-top', media: <Placeholder label="Illustration of a product prototype" /> } };
export const MediaTopSquare: Story = { args: { layout: 'media-top', mediaAspect: 'square', media: <Placeholder label="Illustration of a product prototype" /> } };
export const MediaTopLargeWithCornerArrow: Story = {
  args: { layout: 'media-top', titleSize: 'lg', padding: 'lg', cornerArrow: true, media: <Placeholder label="Illustration of a product prototype" /> },
};
