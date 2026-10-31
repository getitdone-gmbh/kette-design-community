import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import { LoadingOverlay, type LoadingOverlayProps } from './loading-overlay';

const TriggerDemo = (args: LoadingOverlayProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => setOpen(false), 2500);
        }}
      >
        Start export
      </Button>
      <LoadingOverlay {...args} open={open} />
    </>
  );
};

const meta = {
  id: 'feedback-loading-overlay',
  title: 'Patterns · Interface/Loading overlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { open: false, label: 'Generating report', description: 'This can take up to a minute.' },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { args: { open: true } };

export const TriggeredByAction: Story = {
  render: (args) => <TriggerDemo {...args} />,
};
