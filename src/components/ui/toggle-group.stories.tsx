import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Button } from './button';

const meta = {
  id: 'primitives-togglegroup',
  title: 'Primitives · Actions/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (Story) => {
      const [value, setValue] = useState('no');
      const onValueChange = (e) => {
        setValue(e);
        console.log(e);
      };
      return (
        <div style={{ maxWidth: '300px' }}>
          <Story value={value} setValue={setValue} onValueChange={onValueChange} />
        </div>
      );
    },
  ],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as never,
  render: (args, context) => {
    const { onValueChange } = context;
    return (
      <ToggleGroup
        type="single"
        onValueChange={(item) => {
          onValueChange(item);
        }}
      >
        <ToggleGroupItem value="yes" aria-label="yes" type="submit">
          Yes
        </ToggleGroupItem>
        <ToggleGroupItem value="no" aria-label="no" type="submit">
          No
        </ToggleGroupItem>
      </ToggleGroup>
    );
  },
};

export const Controlled: Story = {
  args: {} as never,
  // Demonstrates the parent-owns-the-value contract: the parent's value
  // always wins and the group reflects it synchronously, e.g. mirroring a
  // server task.status without a remount.
  decorators: [
    (Story) => {
      const [value, setValue] = useState('in-progress');
      return <Story value={value} setValue={setValue} />;
    },
  ],
  render: (args, context) => {
    const { value, setValue } = context;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <ToggleGroup type="single" value={value} onValueChange={(next) => next && setValue(next)}>
          <ToggleGroupItem value="todo" aria-label="todo">
            To do
          </ToggleGroupItem>
          <ToggleGroupItem value="in-progress" aria-label="in progress">
            In progress
          </ToggleGroupItem>
          <ToggleGroupItem value="done" aria-label="done">
            Done
          </ToggleGroupItem>
        </ToggleGroup>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setValue('todo')}>
            Simulate server: set status to "todo"
          </button>
          <button type="button" onClick={() => setValue('done')}>
            Simulate server: set status to "done"
          </button>
        </div>
      </div>
    );
  },
};

export const Unreachable: Story = {
  args: {} as never,
  render: () => (
    <ToggleGroup type="single" defaultValue="draft">
      <ToggleGroupItem value="draft" aria-label="draft">
        Draft
      </ToggleGroupItem>
      <ToggleGroupItem value="review" aria-label="review">
        Review
      </ToggleGroupItem>
      <ToggleGroupItem
        value="published"
        aria-label="published"
        unreachable
        aria-describedby="published-blocked-reason"
      >
        Published
      </ToggleGroupItem>
      <span id="published-blocked-reason" style={{ fontSize: 12 }}>
        Publishing is blocked until review is complete.
      </span>
    </ToggleGroup>
  ),
};

/** Segmented control: a `bg-muted` track with a raised chip for the selected item. */
export const Segmented: Story = {
  args: {} as never,
  render: () => (
    <div className="p-6">
      <ToggleGroup type="single" variant="segmented" defaultValue="month" aria-label="Billing period">
        <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
        <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
        <ToggleGroupItem value="all">All time</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

/** Inside a `flex-col` parent the track keeps its content width. Pass `fullWidth` to stretch it and share the width between the items. */
export const SegmentedInColumn: Story = {
  args: {} as never,
  render: () => (
    <div className="flex w-96 flex-col gap-4 p-6">
      <ToggleGroup type="single" variant="segmented" defaultValue="month" aria-label="Billing period">
        <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
        <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="segmented" fullWidth defaultValue="month" aria-label="Billing period full width">
        <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
        <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fit = canvasElement.querySelector<HTMLElement>('[aria-label="Billing period"]');
    const full = canvasElement.querySelector<HTMLElement>('[aria-label="Billing period full width"]');
    const parent = fit?.parentElement;
    if (!fit || !full || !parent) throw new Error('segmented groups missing');
    const inner = parent.clientWidth - 48;
    if (fit.getBoundingClientRect().width >= inner - 8) throw new Error('segmented track stretched to the parent');
    if (Math.abs(full.getBoundingClientRect().width - inner) > 2) throw new Error('fullWidth track does not fill the parent');
  },
};

export const Outline: Story = {
  args: {} as never,
  render: () => (
    <div className="p-6">
      <ToggleGroup type="multiple" variant="outline" defaultValue={['bold']} aria-label="Text style">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

// Segmented groups sized to the Button heights: sm is 32px, md is 40px. Without `size` the track stays 38px.
export const SegmentedSizesNextToButtons: Story = {
  args: {} as never,
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <ToggleGroup type="single" variant="segmented" size={size} defaultValue="a" aria-label={`Segmented ${size}`}>
            <ToggleGroupItem value="a">Day</ToggleGroupItem>
            <ToggleGroupItem value="b">Week</ToggleGroupItem>
          </ToggleGroup>
          <Button size={size}>Button {size}</Button>
        </div>
      ))}
    </div>
  ),
};
