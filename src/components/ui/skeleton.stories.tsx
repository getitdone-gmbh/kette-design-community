import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton, SkeletonProps } from './skeleton';

const meta = {
  id: 'primitives-skeleton',
  title: 'Primitives · Display/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {},
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
