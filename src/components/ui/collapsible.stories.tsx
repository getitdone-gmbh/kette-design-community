import type { Meta, StoryObj } from '@storybook/react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta = {
  id: 'primitives-collapsible',
  title: 'Primitives · Layout/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

type CollapsibleProps = React.ComponentProps<typeof Collapsible>;

export const Default: Story = {
  args: {
    children: (
      <Collapsible>
        <CollapsibleTrigger>Click me to open</CollapsibleTrigger>
        <CollapsibleContent>
          Here is some hidden content that will be shown when the trigger is clicked.
        </CollapsibleContent>
      </Collapsible>
    ),
  } as CollapsibleProps,
};
