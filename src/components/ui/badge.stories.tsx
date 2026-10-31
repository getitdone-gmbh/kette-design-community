import type { Meta, StoryObj } from '@storybook/react';

import { Check, Clock } from 'lucide-react';

import { Badge } from './badge';
import { Chip } from './chip';

const meta = {
  id: 'primitives-badge',
  title: 'Primitives · Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'subtle', 'link', 'success', 'warning', 'info', 'credit'],
      description: 'The variant of the badge.',
      defaultValue: 'default',
      table: { defaultValue: { summary: 'default' } },
    },
    children: { description: 'Text of the badge.' },
    icon: { description: 'Icon before the text.' },
    dot: { description: 'Small status dot before the text.' },
    tinted: { description: 'Subtle fill with coloured text instead of the bold fill.' },
    bordered: { description: 'Adds a border in the product colour.' },
    readable: { description: 'Uses the neutral readable text colour on the subtle fill.' },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Badge',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Badge',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Badge',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Badge',
    variant: 'ghost',
  },
};

export const Subtle: Story = {
  args: {
    children: 'Badge',
    variant: 'subtle',
  },
};

export const Link: Story = {
  args: {
    children: 'Badge',
    variant: 'link',
  },
};

export const AllVariants: Story = {
  args: { children: 'Badge' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="subtle">Subtle</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
};

export const ProductColours: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {([false, true] as const).map((bordered) => (
        <div key={String(bordered)} className="flex flex-wrap gap-2">
          {(['backoffice', 'workstream', 'vacancy', 'jobsearch', 'coldcall'] as const).map((product) => (
            <Badge key={product} variant={`product-${product}`} bordered={bordered}>
              {product}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

// Product badges use the neutral foreground for text by default (AA on every product fill); `readable={false}` opts back into the product colour. `product-accent` is the neutral product accent.
export const ProductReadable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['backoffice', 'workstream', 'vacancy', 'jobsearch', 'coldcall'] as const).map((product) => (
        <Badge key={product} variant={`product-${product}`} bordered readable>
          {product}
        </Badge>
      ))}
      <Badge variant="product-accent" bordered>
        accent
      </Badge>
    </div>
  ),
};

export const StatusTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">Paid</Badge>
      <Badge variant="warning">Due soon</Badge>
      <Badge variant="info">Draft</Badge>
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="credit">Credit</Badge>
    </div>
  ),
};

// Optional decorative leading icon, sized with the icon tokens. The text carries the meaning.
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success" icon={<Check />}>Published</Badge>
      <Badge variant="warning" icon={<Clock />}>Pending</Badge>
      <Badge variant="outline" icon={<Clock />}>Draft</Badge>
    </div>
  ),
};

// Tinted form of the destructive badge: soft error fill with error text. Use for status labels in tables and cards.
export const TintedDestructive: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="destructive" tinted>Overdue</Badge>
    </div>
  ),
};

// Narrow container: the label truncates with an ellipsis, the icon and dot stay whole and nothing wraps or spills.
export const NarrowContainer: Story = {
  render: () => (
    <div className="flex w-[120px] flex-col gap-2 border border-dashed border-border p-2">
      <Badge variant="info">Projektbedarf KW 44</Badge>
      <Badge variant="warning" icon={<Clock />}>In Prüfung seit gestern</Badge>
      <Badge variant="success" dot>Veröffentlicht und geprüft</Badge>
    </div>
  ),
};

// Descenders (g, y, p) and natural-width chips in a flex row: nothing is clipped or truncated while there is room, and the box keeps the 0.25.0 height and baseline.
export const DescendersNaturalWidth: Story = {
  render: () => (
    <div className="flex items-center gap-2 px-4 py-2" data-testid="descender-row">
      <Badge>Chemistry gypsy</Badge>
      <Badge variant="outline">Typography</Badge>
      <Chip label="Coding Challenge" />
      <Chip label="Jury party" variant="info" />
    </div>
  ),
};
