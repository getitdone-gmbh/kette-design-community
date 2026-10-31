import type { Meta, StoryObj } from '@storybook/react';
import { CreditCard, Server, Zap } from 'lucide-react';

import { CheckboxGroup, CheckboxGroupItem } from './checkbox-group';

const meta = {
  id: 'primitives-checkboxgroup',
  title: 'Primitives · Inputs/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  parameters: { actions: { argTypesRegex: '^on(?!ValueChange)[A-Z].*' } },
  args: { 'aria-label': 'Plan' },
  argTypes: {
    type: { control: { type: 'select' }, options: ['multiple', 'single'] },
    size: { control: { type: 'select' }, options: ['sm', 'md'] },
    layout: { control: { type: 'select' }, options: ['stack', 'grid'] },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = (
  <>
    <CheckboxGroupItem value="basic" title="Basic plan" description="Includes up to 10 users and 20 GB of data." />
    <CheckboxGroupItem
      value="business"
      title="Business plan"
      description="Includes up to 20 users and 40 GB of data."
    />
    <CheckboxGroupItem
      value="enterprise"
      title="Enterprise plan"
      description="Unlimited users and 100 GB of data."
      disabled
    />
  </>
);

export const Checkbox: Story = { args: { defaultValue: ['basic'], children: items } };
export const RadioButton: Story = { args: { type: 'single', defaultValue: ['basic'], children: items } };
export const Small: Story = { args: { size: 'sm', defaultValue: ['basic'], children: items } };

export const IconSimple: Story = {
  args: {
    type: 'single',
    defaultValue: ['speed'],
    children: (
      <>
        <CheckboxGroupItem
          value="speed"
          title="Speed"
          description="Fast builds."
          media={<Zap className="h-icon-md w-icon-md" />}
        />
        <CheckboxGroupItem
          value="server"
          title="Server"
          description="Dedicated."
          media={<Server className="h-icon-md w-icon-md" />}
        />
      </>
    ),
  },
};

export const IconCard: Story = {
  args: {
    layout: 'grid',
    defaultValue: ['speed'],
    children: (
      <>
        <CheckboxGroupItem
          value="speed"
          title="Speed"
          media={<Zap className="h-icon-sm w-icon-sm" />}
          mediaVariant="featured"
          indicator="none"
        />
        <CheckboxGroupItem
          value="server"
          title="Server"
          media={<Server className="h-icon-sm w-icon-sm" />}
          mediaVariant="featured"
          indicator="none"
        />
      </>
    ),
  },
};

export const PaymentIcon: Story = {
  args: {
    type: 'single',
    defaultValue: ['visa'],
    children: (
      <>
        <CheckboxGroupItem
          value="visa"
          title="Visa ending in 1234"
          description="Expiry 06/2028"
          media={<CreditCard className="h-icon-md w-icon-md" />}
          mediaVariant="framed"
        />
        <CheckboxGroupItem
          value="mc"
          title="Mastercard ending in 4321"
          description="Expiry 11/2027"
          media={<CreditCard className="h-icon-md w-icon-md" />}
          mediaVariant="framed"
        />
      </>
    ),
  },
};

export const PriceInline: Story = {
  args: {
    type: 'single',
    defaultValue: ['basic'],
    children: (
      <>
        <CheckboxGroupItem
          value="basic"
          title="Basic plan"
          price="$10/month"
          description="Includes up to 10 users, 20GB individual data and access to all features."
        />
        <CheckboxGroupItem
          value="business"
          title="Business plan"
          price="$20/month"
          description="Includes up to 10 users, 20GB individual data and access to all features."
        />
      </>
    ),
  },
};

export const IconCardWithHeader: Story = {
  args: {
    defaultValue: ['basic'],
    children: (
      <>
        <CheckboxGroupItem
          value="basic"
          card
          title="Basic plan"
          price="$10 per month"
          description="Includes up to 10 users, 20GB individual data and access to all features."
          media={<Zap className="h-icon-sm w-icon-sm" />}
          mediaVariant="featured"
          badge={
            <span className="rounded-full bg-general-success-container px-2 typography-label text-general-success-on-container">
              Limited time only
            </span>
          }
        />
        <CheckboxGroupItem
          value="business"
          card
          title="Business plan"
          price="$20 per month"
          description="Includes up to 20 users."
          media={<Server className="h-icon-sm w-icon-sm" />}
          mediaVariant="featured"
        />
      </>
    ),
  },
};
