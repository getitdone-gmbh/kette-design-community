import type { Meta, StoryObj } from '@storybook/react';

import { BellIcon, CheckIcon } from '@radix-ui/react-icons';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Switch } from './switch';

const meta = {
  id: 'primitives-card-examples',
  // The compound card (header, title, description, content, footer); the single-prop card is "Card". No third title level: that made an unnamed folder in the sidebar.
  title: 'Primitives · Display/Card compound',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Supporting description text.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="typography-p">Card body content goes here.</p>
        </CardContent>
      </>
    ),
  },
};

// A real handler is what turns Card into a keyboard-operable "clickable card" (see the
// `interactive` computation in card.tsx) — hover/focus-visible/active only ever appear here,
// never on a purely informational Card.
export const Interactive: Story = {
  args: {
    ...Default.args,
    onClick: () => {},
  } as React.ComponentProps<typeof Card>,
};

export const Selected: Story = {
  args: {
    ...Default.args,
    selected: true,
    onClick: () => {},
  } as React.ComponentProps<typeof Card>,
};

// CARD-A11Y-04: without an explicit accessible name, an interactive Card with rich nested content
// (heading + description) announces the concatenation of all descendant text as one run-on button
// name. Passing `aria-label` (already part of `React.HTMLAttributes`) keeps the announced name short
// and meaningful — see the equivalent `screen.getByRole('button', { name: ... })` assertion in
// card.test.tsx.
export const InteractiveWithAccessibleName: Story = {
  args: {
    ...Default.args,
    onClick: () => {},
    'aria-label': 'Card title',
  } as React.ComponentProps<typeof Card>,
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
    onClick: () => {},
  } as React.ComponentProps<typeof Card>,
};

export const Invalid: Story = {
  args: {
    ...Default.args,
    invalid: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Billing details</CardTitle>
          <CardDescription>Please correct the highlighted error below.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="typography-p">Card marked invalid, e.g. a form-section reporting a validation error.</p>
        </CardContent>
      </>
    ),
  },
};

const notifications = [
  {
    title: 'Your call has been confirmed.',
    description: '1 hour ago',
  },
  {
    title: 'You have a new message!',
    description: '1 hour ago',
  },
  {
    title: 'Your subscription is expiring soon!',
    description: '2 hours ago',
  },
];

type CardProps = React.ComponentProps<typeof Card>;

export const Notifications: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>You have 3 unread messages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className=" flex items-center space-x-4 rounded-default border-card p-4">
            <BellIcon />
            <div className="flex-1 space-y-1">
              <p className="typography-p-ui-medium">Push Notifications</p>
              <p className="typography-p text-text-subtle">Send notifications to device.</p>
            </div>
            <Switch aria-label="Push notifications" />
          </div>
          <div>
            {notifications.map((notification, index) => (
              <div key={index} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-background-brand-bold-default" />
                <div className="space-y-1">
                  <p className="typography-p-ui-medium">{notification.title}</p>
                  <p className="typography-small text-text-subtle">{notification.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            <CheckIcon className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </CardFooter>
      </>
    ),
  } as CardProps,
};

/** Link card: a real anchor with the interactive hover and focus look. */
export const LinkCard: StoryObj<typeof Card> = {
  render: () => (
    <Card href="#details" className="w-80" variant="surface">
      <CardHeader>
        <CardTitle>Quarterly report</CardTitle>
        <CardDescription>Opens the report in the same tab.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const Today: Story = {
  args: {
    ...Default.args,
    today: true,
  } as React.ComponentProps<typeof Card>,
};
