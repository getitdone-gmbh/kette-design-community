'use client';

import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@storybook/testing-library';

import { AlertCircle, CheckCircle2, Info as InfoIcon, Terminal, TriangleAlert } from 'lucide-react';
import React from 'react';
import { Button } from './button';
import { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle } from './alert';

const meta = {
  id: 'primitives-alert',
  title: 'Primitives · Display/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['default', 'destructive', 'info', 'success', 'warning', 'decent'],
      control: {
        type: 'radio',
      },
      description: 'Tone of the message: neutral, success, warning, error or information.',
      table: { defaultValue: { summary: 'default' } },
    },
    size: { description: 'Padding and type size; compact is the default in the zero preset.' },
    actionsPlacement: { description: 'Where the action buttons sit: at the end of the text or below it.' },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

type AlertProps = React.ComponentProps<typeof Alert>;

export const Default: Story = {
  args: {
    variant: 'default',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components and dependencies to your app using the cli.</AlertDescription>
    </Alert>
  ),
};

export const Error: Story = {
  args: {
    variant: 'destructive',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
};

export const Info: Story = {
  args: {
    variant: 'info',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components and dependencies to your app using the cli.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  args: {
    variant: 'success',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes have been saved.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  args: {
    variant: 'warning',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Your trial expires in 3 days.</AlertDescription>
    </Alert>
  ),
};

// `decent` is the neutral, low-emphasis variant — it intentionally carries no severity icon
// (nothing to differentiate from), matching the `default` story's plain-content baseline.
export const Decent: Story = {
  args: {
    variant: 'decent',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Decent</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
};

// Optional dismiss affordance — composed manually, like AlertTitle/AlertDescription. Exercises the
// AlertClose hover/focus-visible/active/disabled states in isolation from Alert's own props.
export const Dismissible: Story = {
  args: {
    variant: 'info',
    className: 'pr-8',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components and dependencies to your app using the cli.</AlertDescription>
      <AlertClose onClick={() => alert('dismissed')} />
    </Alert>
  ),
};

export const DismissibleDisabled: Story = {
  args: {
    variant: 'warning',
    className: 'pr-8',
  } as AlertProps,
  render: (args) => (
    <Alert {...args}>
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Dismiss is temporarily unavailable while an action is in flight.</AlertDescription>
      <AlertClose disabled />
    </Alert>
  ),
};

/** Compact note: single line, no border, status tint, `ui` type role. */
export const Compact: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['default', 'info', 'success', 'warning', 'destructive'] as const).map((variant) => (
        <Alert key={variant} variant={variant} size="compact">
          <InfoIcon aria-hidden="true" />
          <AlertDescription className="mt-0">Changes apply to everyone in this workspace ({variant}).</AlertDescription>
        </Alert>
      ))}
    </div>
  ),
};

/** Actions slot: buttons under the text, aligned with the text column. */
export const WithActions: Story = {
  render: () => (
    <Alert variant="warning">
      <TriangleAlert aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Access expires soon</AlertTitle>
      <AlertDescription>Renew the workspace licence to keep editing.</AlertDescription>
      <AlertActions>
        <Button size="sm" variant="outline">
          Renew
        </Button>
        <Button size="sm" variant="ghost">
          Later
        </Button>
      </AlertActions>
    </Alert>
  ),
};

// Actions on the right of the text, vertically centred. They stack under the text while the alert itself is narrower than 36rem (container query, not the viewport).
export const ActionsEnd: Story = {
  render: () => (
    <Alert variant="warning" actionsPlacement="end">
      <TriangleAlert aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Access expires soon</AlertTitle>
      <AlertDescription>Renew the workspace licence to keep editing.</AlertDescription>
      <AlertActions>
        <Button size="sm" variant="outline">
          Renew
        </Button>
        <Button size="sm" variant="ghost">
          Later
        </Button>
      </AlertActions>
    </Alert>
  ),
};

// A narrow column in a wide viewport: the alert measures its own width and stacks the actions.
export const ActionsEndInNarrowColumn: Story = {
  render: () => (
    <div className="max-w-sm">
      <Alert variant="warning" actionsPlacement="end">
        <TriangleAlert aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Access expires soon</AlertTitle>
        <AlertDescription>Renew the workspace licence to keep editing.</AlertDescription>
        <AlertActions>
          <Button size="sm" variant="outline">
            Renew
          </Button>
          <Button size="sm" variant="ghost">
            Later
          </Button>
        </AlertActions>
      </Alert>
    </div>
  ),
};

// Inline links in a severity alert take the alert text colour (the link blue was 4.57:1 on the warning tint and 4.05:1 on the destructive tint). The underline stays as the cue.
export const InlineLinks: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['info', 'success', 'warning', 'destructive'] as const).map((variant) => (
        <Alert key={variant} variant={variant} data-testid={variant}>
          <TriangleAlert aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Billing address missing</AlertTitle>
          <AlertDescription>
            Add an address before the next invoice run.{' '}
            <Button variant="link" size="inline">
              Open billing settings
            </Button>{' '}
            or{' '}
            <Button variant="link" size="sm">
              contact support
            </Button>
            .
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of ['info', 'success', 'warning', 'destructive']) {
      const alert = canvas.getByTestId(variant);
      const alertColor = getComputedStyle(alert).color;
      for (const link of within(alert).getAllByRole('button')) {
        expect(getComputedStyle(link).color).toBe(alertColor);
        expect(getComputedStyle(link).textDecorationLine).toContain('underline');
      }
    }
  },
};
