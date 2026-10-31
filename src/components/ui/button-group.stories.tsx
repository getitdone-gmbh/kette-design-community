import type { Meta, StoryObj } from '@storybook/react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from './button';
import { ButtonGroup, ButtonGroupItem } from './button-group';

const meta = {
  id: 'primitives-buttongroup',
  title: 'Primitives · Actions/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    size: { description: 'Height of the segments; sm matches Button size sm.', table: { defaultValue: { summary: 'default' } } },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const CalendarViews = () => {
  const [view, setView] = useState('week');
  return (
    <ButtonGroup aria-label="Calendar view">
      {['day', 'week', 'month'].map((v) => (
        <ButtonGroupItem key={v} current={view === v} onClick={() => setView(v)}>
          {v[0].toUpperCase() + v.slice(1)}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
};

export const Default: Story = {
  render: () => <CalendarViews />,
};

export const IconVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ButtonGroup aria-label="Leading icons">
        <ButtonGroupItem icon={<List className="h-full w-full" />} current>
          List
        </ButtonGroupItem>
        <ButtonGroupItem icon={<LayoutGrid className="h-full w-full" />}>Grid</ButtonGroupItem>
      </ButtonGroup>
      <ButtonGroup aria-label="Icon only">
        <ButtonGroupItem icon={<List className="h-full w-full" />} aria-label="List" current />
        <ButtonGroupItem icon={<LayoutGrid className="h-full w-full" />} aria-label="Grid" />
        <ButtonGroupItem icon={<Plus className="h-full w-full" />} aria-label="Add" />
      </ButtonGroup>
      <ButtonGroup aria-label="Status">
        <ButtonGroupItem dotLeading current>
          Live
        </ButtonGroupItem>
        <ButtonGroupItem dotLeading>Paused</ButtonGroupItem>
      </ButtonGroup>
    </div>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <ButtonGroup aria-label="Range">
      <ButtonGroupItem>Previous</ButtonGroupItem>
      <ButtonGroupItem disabled>Next</ButtonGroupItem>
    </ButtonGroup>
  ),
};

// Gated: aria-disabled keeps the segment hoverable and focusable. A click calls onGatedClick, never onClick.
const GatedSegment = () => {
  const [message, setMessage] = useState('');
  return (
    <div className="flex flex-col items-start gap-3">
      <ButtonGroup aria-label="Range">
        <ButtonGroupItem>Previous</ButtonGroupItem>
        <ButtonGroupItem aria-disabled="true" aria-describedby="range-reason" onGatedClick={() => setMessage('Not available yet.')}>
          Next
        </ButtonGroupItem>
      </ButtonGroup>
      <p id="range-reason" className="typography-text-small text-text-subtle">Next needs a saved draft.</p>
      <p role="status" className="typography-text-small text-text-subtle">{message}</p>
    </div>
  );
};

export const WithGated: Story = {
  render: () => <GatedSegment />,
};

// Size sm is exactly as high as Button size="sm" (control-sm token: 32, zero 28). Use it for prev, today, next and view switches next to small buttons.
export const SizeSm: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <ButtonGroup aria-label="Week" size="sm">
          <ButtonGroupItem icon={<ChevronLeft className="h-full w-full" />} aria-label="Previous week" />
          <ButtonGroupItem>Today</ButtonGroupItem>
          <ButtonGroupItem icon={<ChevronRight className="h-full w-full" />} aria-label="Next week" />
        </ButtonGroup>
        <Button variant="outline" size="sm">
          Button sm
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Add">
          <Plus aria-hidden="true" />
        </Button>
      </div>
      <ButtonGroup aria-label="Default size">
        <ButtonGroupItem>Previous</ButtonGroupItem>
        <ButtonGroupItem>Today</ButtonGroupItem>
        <ButtonGroupItem>Next</ButtonGroupItem>
      </ButtonGroup>
    </div>
  ),
};
