import type { Meta, StoryObj } from '@storybook/react';

import { Fragment } from 'react';
import { Grid, GridItem } from './Grid';

const meta = {
  id: 'primitives-grid',
  title: 'Primitives · Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        disable: true,
      },
    },
    columns: {
      control: {
        type: 'object',
      },
    },
  },
  parameters: {
    a11y: {
      disable: true,
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((item) => (
          <span
            className="p-4 flex h-2 items-center justify-center bg-blue-500 text-blue-100"
            key={`grid-item-${item}`}
          >
            {item}
          </span>
        ))}
      </>
    ),
  },
};

export const CustomGridItemsSpan: Story = {
  args: {
    children: (
      <>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((item) => (
          <Fragment key={`grid-item-duo-${16 - item}`}>
            <GridItem colSpan={{ lg: (16 - item) as any }}>
              <span className="flex h-2 items-center justify-center bg-blue-500 text-blue-100 p-4" />
            </GridItem>
            <GridItem colSpan={{ lg: item as any }}>
              <span className="flex h-2 items-center justify-center bg-blue-500 text-blue-100 p-4" />
            </GridItem>
          </Fragment>
        ))}
      </>
    ),
  },
};
