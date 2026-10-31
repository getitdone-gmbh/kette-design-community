import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './Card';
import { CardProps } from './card.interface';

const meta = {
  id: 'primitives-card',
  title: 'Primitives · Display/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    children: { description: 'Content of the card.' },
    image: { description: 'Image shown above the content.' },
    isFluid: { description: 'Stretches the card to the full width of its container.' },
    transparent: { description: 'No surface fill; the text colour is inherited.' },
    noBorder: { description: 'Removes the border.' },
    shadow: { description: 'Adds an elevation shadow.' },
    className: { description: 'Extra class names for the card.' },
    style: { description: 'Inline styles for the card.' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    children: 'Content',
  } as CardProps,
};

export const NoBorder: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    noBorder: true,
    children: 'Content',
  } as CardProps,
};

export const Transparent: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    transparent: true,
    children: 'Content',
  } as CardProps,
};

// `onClick` is what turns Card into a keyboard-operable "clickable card" (see the `interactive`
// computation in `Card.tsx`) — passed directly to `Card` rather than wrapping it in an extra
// `<button>`, so tabbing produces exactly one focusable element per card (a single visible
// focus-visible ring on the Card itself) instead of two sequential, inconsistent stops.
export const WithChildren: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    onClick: () => {},
    children: (
      <>
        <p className="typography-bodyText text-card-foreground-muted mb-0.25">Category</p>
        <h4 className="typography-headlineSM text-card-foreground-default mb-1">I am a fluid typo h4</h4>
        <p className="typography-bodyText text-card-foreground-default mb-[6px] flex-grow">Description</p>
      </>
    ),
  } as CardProps,
};

export const WithChildrenAndImage: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    onClick: () => {},
    image: (
      <img
        className="aspect-16.9 object-cover"
        src="/img/illustrations/section-hero.svg"
        alt="Abstract illustration"
        title="Abstract illustration"
      />
    ),
    children: (
      <>
        <p className="typography-bodyText text-card-foreground-muted mb-0.25">Category</p>
        <h3 className="typography-headlineSM text-card-foreground-default mb-1">I am a h3</h3>
        <p className="typography-body-text text-card-foreground-default mb-[6px] flex-grow">Description</p>
      </>
    ),
  } as CardProps,
};

// MAT-CARD-04: `selected`/`disabled`/`invalid` mirror the composable Card in `../card.tsx` — a
// plan/tile picker or form-section-as-card built with this Card gets the same state set for free.
export const Selected: Story = {
  decorators: Default.decorators,
  args: {
    ...Default.args,
    onClick: () => {},
    selected: true,
  } as CardProps,
};

export const Disabled: Story = {
  decorators: Default.decorators,
  args: {
    ...Default.args,
    onClick: () => {},
    disabled: true,
  } as CardProps,
};

export const Invalid: Story = {
  decorators: Default.decorators,
  args: {
    ...Default.args,
    invalid: true,
    children: (
      <>
        <p className="typography-bodyText text-card-foreground-muted mb-0.25">Billing details</p>
        <h4 className="typography-headlineSM text-card-foreground-default mb-1">Card marked invalid</h4>
        <p className="typography-bodyText text-card-foreground-default mb-[6px] flex-grow">
          e.g. a form-section reporting a validation error.
        </p>
      </>
    ),
  } as CardProps,
};

export const ProductCard: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-[312px]">
        <Story />
      </div>
    ),
  ],
  args: {
    image: (
      <img
        className="aspect-16.9 object-cover"
        src="/img/illustrations/section-hero.svg"
        alt="Abstract illustration"
        title="Abstract illustration"
      />
    ),
    children: (
      <>
        <h3 className="typography-headlineSM text-card-foreground-default">Title</h3>
      </>
    ),
  } as CardProps,
};

// CARD-A11Y-04: an interactive Card with rich nested content otherwise announces the concatenation
// of all descendant text as one run-on button name. `aria-label` keeps it concise.
export const InteractiveWithAccessibleName: Story = {
  decorators: ProductCard.decorators,
  args: {
    ...ProductCard.args,
    onClick: () => {},
    'aria-label': 'Title',
  } as CardProps,
};
