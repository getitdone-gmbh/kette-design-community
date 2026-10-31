import type { Meta, StoryObj } from '@storybook/react';

import { Spacing } from './Spacing';
import { SpacingProps } from './spacing.interface';

const meta = {
  id: 'primitives-spacing',
  title: 'Foundations/Spacing',
  component: Spacing,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: {
        type: 'select',
        options: ['row', 'column'],
      },
    },
    gap: {
      control: {
        type: 'select',
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
    },
    justifyContent: {
      control: {
        type: 'select',
        options: ['start', 'end', 'center', 'between', 'around', 'evenly'],
      },
    },
    alignItems: {
      control: {
        type: 'select',
        options: ['start', 'end', 'center', 'baseline', 'stretch'],
      },
    },
    children: {
      control: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Spacing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    direction: 'row',
    gap: '1',
    justifyContent: 'start',
    alignItems: 'stretch',
    children: (
      <>
        <span className="block h-2 w-8 bg-blue-500 p-4" />
        <span className="block h-2 w-8 bg-blue-500 p-4" />
        <span className="block h-2 w-8 bg-blue-500 p-4" />
        <span className="block h-2 wä8 bg-blue-500 p-4" />
      </>
    ),
  } as SpacingProps,
};
