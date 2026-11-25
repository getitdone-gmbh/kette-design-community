import type { Meta, StoryObj } from '@storybook/react';

import { Chip } from './chip';
import { Skeleton, SkeletonProps } from './skeleton';

const meta = {
  id: 'primitives-skeleton',
  title: 'Primitives · Display/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    radius: {
      control: { type: 'select' },
      options: ['default', 'tight', 'item', 'control', 'surface', 'card', 'full'],
      description: 'Radius of the block tile: a token tier or `full` for a pill in the shape of a chip. Default `default` (`tight` in the zero preset). A `rounded-*` class in `className` wins over it.',
    },
    variant: { description: '`block` (default) is the single tile; `row-single`, `row`, `text` and `avatar` are the composed Figma Skeleton variants.' },
    rows: { description: 'Row count for `variant="row"`.' },
    label: { description: 'Accessible loading text of the composed variants.' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Skeleton is a purely visual placeholder tile — it carries no `role`/`aria-live` of its own (see the comment in skeleton.tsx). Any composed loading state built from it MUST be wrapped in a live region with accessible text, exactly like Table\'s own `TableLoading` does. **Do not copy the bare `Default` story below as a real loading state** — copy `ComposedWithStatusAnnouncement` instead, which wraps the identical avatar+lines composition in `role="status" aria-live="polite"` plus an `sr-only` label so assistive technology is told content is loading (A11Y-SKEL-02).',
      },
    },
  },
  render: (args) => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
} satisfies Meta<SkeletonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

// A11Y-SKEL-02: the canonical reference for a composed (avatar + text-lines) Skeleton loading
// state, wrapped in the same `role="status" aria-live="polite"` + accessible-text pattern
// Table's `TableLoading` already implements (table.tsx) — so a screen-reader user is told
// "Loading…" instead of getting silence while the (purely visual) tiles above render.
export const ComposedWithStatusAnnouncement: Story = {
  render: () => (
    <div role="status" aria-live="polite" className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  ),
};

// ZERO-806: a placeholder in the shape of a chip. The pill comes from `radius="full"` (or `className="rounded-full"`, which wins the same way); the invisible chip gives the tile the chip's size, so the row keeps its height when the chips arrive.
export const Pill: Story = {
  render: () => (
    <div role="group" aria-busy="true" aria-label="Often searched, loading" className="flex items-center gap-2">
      <span aria-hidden className="typography-ui-sm text-text-subtle">
        Often searched
      </span>
      {['Senior React developer, 2 years e-commerce', 'QA engineer with Playwright'].map((text) => (
        <Skeleton key={text} radius="full" aria-hidden className="flex">
          <Chip size="small" variant="muted" label={text} className="invisible" />
        </Skeleton>
      ))}
      <Skeleton aria-hidden className="h-6 w-24 rounded-full" />
    </div>
  ),
};

export const RowSingle: Story = {
  render: () => (
    <div className="w-[640px]">
      <Skeleton variant="row-single" />
    </div>
  ),
};

export const Rows: Story = {
  render: () => (
    <div className="w-[640px]">
      <Skeleton variant="row" rows={3} />
    </div>
  ),
};

export const Text: Story = {
  render: () => <Skeleton variant="text" />,
};

export const Avatar: Story = {
  render: () => <Skeleton variant="avatar" />,
};
