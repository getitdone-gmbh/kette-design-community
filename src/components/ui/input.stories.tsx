import type { Meta, StoryObj } from '@storybook/react';

import { Input, InputHint, InputProps } from './input';
import { Copy, Mail } from 'lucide-react';
import { Button } from './button';

const meta = {
  id: 'primitives-input',
  title: 'Primitives · Inputs/Input',
  component: Input,
  tags: ['autodocs'],
  // Every story field carries an accessible name; stories that show a visible label override it.
  args: { 'aria-label': 'Example field' },
  argTypes: {
    'aria-label': { description: 'Accessible name when there is no visible label.' },
    value: { description: 'Controlled value of the field.' },
    clamp: { description: 'Fluid font size that follows the viewport.' },
    disabled: {
      control: {
        type: 'boolean',
      },
      description: 'Blocks input and dims the field.',
      table: { defaultValue: { summary: 'false' } },
    },
    placeholder: { description: 'Hint shown while the field is empty.' },
    size: { description: 'Field height (xs to lg), or the number of visible characters.' },
    compact: { description: 'Denser field height.' },
    inputClassName: { description: 'Class names for the field itself (className lands on the wrapper).' },
    appearance: { description: 'Read-only look without the field border.' },
    loading: { description: 'Shows a spinner at the end of the field.' },
    success: { description: 'Success border and check mark.' },
    leadingIcon: { description: 'Icon before the text.' },
    trailingIcon: { description: 'Icon after the text.' },
    leadingAddon: { description: 'Attached block before the field, for a prefix such as a currency.' },
    trailingAddon: { description: 'Attached block after the field, for a suffix such as a unit.' },
    revealable: { description: 'Password field with a show and hide button.' },
    showPasswordLabel: { description: 'Label of the show button.' },
    hidePasswordLabel: { description: 'Label of the hide button.' },
    trailingAction: { description: 'Action control at the end of the field.' },
    'aria-invalid': {
      control: { type: 'boolean' },
      description: 'Forces the error border/ring treatment (also set automatically by <FormControl> on a validation error).',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  value: undefined,
  clamp: false,
  disabled: false,
  placeholder: 'Placeholder',
};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as InputProps,
};

export const Filled: Story = {
  args: {
    ...defaultArgs,
    value: 'Filled',
  } as InputProps,
};

export const FluidFont: Story = {
  args: {
    ...defaultArgs,
    value: 'Fluid font',
    clamp: true,
  } as InputProps,
};

export const Disabled: Story = {
  args: {
    ...defaultArgs,
    disabled: true,
  } as InputProps,
};

export const Invalid: Story = {
  args: {
    ...defaultArgs,
    value: 'Invalid value',
    'aria-invalid': true,
  } as InputProps,
};

// Dense 32px field for inline rows.
export const Compact: Story = {
  args: { ...defaultArgs, compact: true, placeholder: 'Quantity' } as InputProps,
};

/** Search variant: leading search icon, no icons on the default variant. */
export const Search: Story = {
  args: {
    ...defaultArgs,
    variant: 'search',
    placeholder: 'Search contacts',
    'aria-label': 'Search contacts',
  } as InputProps,
};

/** Hint text in the `input-hint` role, linked to the field via aria-describedby. */
export const WithHint: Story = {
  render: () => (
    <div className="flex w-[320px] flex-col gap-label">
      <Input placeholder="name@example.com" aria-label="Email" aria-describedby="email-hint" />
      <InputHint id="email-hint">We only use this for account notices.</InputHint>
    </div>
  ),
};

export const WithHintInvalid: Story = {
  render: () => (
    <div className="flex w-[320px] flex-col gap-label">
      <Input value="name@" aria-label="Email" aria-invalid aria-describedby="email-hint-err" readOnly />
      <InputHint id="email-hint-err" invalid>
        Enter a complete email address.
      </InputHint>
    </div>
  ),
};

export const ReadOnlyAppearance: Story = {
  name: 'Read only',
  args: { appearance: 'readonly', defaultValue: 'hello@example.com' } as InputProps,
};

export const Loading: Story = { args: { loading: true, defaultValue: 'Validating...' } as InputProps };

export const Success: Story = { args: { success: true, defaultValue: 'hello@example.com' } as InputProps };

export const WithIcons: Story = {
  render: () => <Input aria-label="Email" defaultValue="hello@example.com" leadingIcon={<Mail />} />,
};

export const LeadingText: Story = {
  render: () => <Input aria-label="Website" defaultValue="www.example.com" leadingAddon="http://" />,
};

export const TrailingButton: Story = {
  render: () => <Input aria-label="Email" placeholder="you@example.com" trailingAddon="Subscribe" />,
};

export const PasswordReveal: Story = {
  render: () => <Input type="password" revealable aria-label="Password" defaultValue="correct horse" />,
};

export const TrailingActionSlot: Story = {
  render: () => (
    <Input
      aria-label="Invite link"
      defaultValue="https://app.example/invite/x7"
      trailingAction={
        <Button type="button" variant="ghost" size="control-sm" className="w-control-sm px-0" aria-label="Copy link">
          <Copy aria-hidden="true" className="h-icon-xs w-icon-xs" />
        </Button>
      }
    />
  ),
};

export const WithHintWarning: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Input aria-label="Email" defaultValue="hello@example" aria-describedby="warn-hint" />
      <InputHint id="warn-hint" tone="warning">Looks like a typo in the domain.</InputHint>
    </div>
  ),
};

// Field heights follow the control tokens: xs is the compact height, sm 28 (zero), md 32 (zero), lg 36 (zero).
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Input key={size} size={size} placeholder={`size ${size}`} aria-label={`size ${size}`} />
      ))}
    </div>
  ),
};
