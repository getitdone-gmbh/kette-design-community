import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';
import { Calendar } from './calendar';

const meta = {
  id: 'primitives-calendar',
  title: 'Primitives · Inputs/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as any,
  decorators: [
    (Story) => {
      const [date, setDate] = useState<Date | undefined>(new Date());
      return <Story date={date} setDate={setDate} />;
    },
  ],
  render: (args, context) => {
    const { date, setDate } = context;
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-default border border-solid"
        showOutsideDays
        onDayClick={(day) => {
          setDate(day);
        }}
        onMonthChange={(month) => {
          console.log(month);
        }}
      />
    );
  },
};
