import type { Meta, StoryObj } from '@storybook/react';

import { ChangeEvent, useState } from 'react';
import { PhoneInput } from '.';

const meta = {
  id: 'primitives-phoneinput',
  title: 'Primitives · Inputs/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (Story) => {
      const [phone, setPhone] = useState('+49 30 12345678');

      const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPhone(e.target.value);
      };
      return (
        <Story
          phone={{
            phone,
          }}
          handleOnChange={{
            handleOnChange,
          }}
        />
      );
    },
  ],
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args, context) => {
  const { phone } = context.phone;
  const { handleOnChange } = context.handleOnChange;
  return <PhoneInput {...args} onChange={handleOnChange} value={phone} />;
};

const defaultArgs = {};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args, context) => Component(args, context),
};
