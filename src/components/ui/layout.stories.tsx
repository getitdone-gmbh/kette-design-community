import type { Meta, StoryObj } from '@storybook/react';

import { Cluster, SplitView, Stack, TileGrid } from './layout';

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="typography-ui rounded-item bg-muted px-3 py-2 text-text-subtle-on-muted">{children}</div>
);

const meta = { id: 'patterns-layout', title: 'Patterns · Interface/Layout', component: Stack, tags: ['autodocs'] } satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const StackGaps: Story = {
  render: () => (
    <div className="flex gap-10">
      {(['card', 'block', 'section'] as const).map((gap) => (
        <Stack key={gap} gap={gap}>
          <Box>{gap} 1</Box>
          <Box>{gap} 2</Box>
          <Box>{gap} 3</Box>
        </Stack>
      ))}
    </div>
  ),
};

export const ClusterRow: Story = {
  render: () => (
    <Cluster>
      <Box>One</Box>
      <Box>Two</Box>
      <Box>Three</Box>
    </Cluster>
  ),
};

export const Tiles: Story = {
  render: () => (
    <TileGrid min={220}>
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i}>Tile {i + 1}</Box>
      ))}
    </TileGrid>
  ),
};

export const SplitFilters: Story = {
  render: () => (
    <SplitView aside={<Box>Filters</Box>} asideLabel="Filters">
      <Box>Results</Box>
    </SplitView>
  ),
};

export const SplitAsideEnd: Story = {
  render: () => (
    <SplitView aside={<Box>Details</Box>} asideLabel="Details" side="end" asideWidth="aside">
      <Box>Content</Box>
    </SplitView>
  ),
};
