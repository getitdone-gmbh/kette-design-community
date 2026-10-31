import type { Meta, StoryObj } from '@storybook/react';

import { Section } from './section';
import { SectionProps } from './section.interface';

const meta = {
  id: 'primitives-section',
  title: 'Primitives · Layout/Section',
  component: Section,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: ['accent', 'light', 'primary', 'white'],
      },
    },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'accent',
    fullWidth: false,
    children: <h3 className="typography-h3 text-foreground">Hello I am a Child</h3>,
  } as SectionProps,
};

export const FullWidth: Story = {
  args: {
    variant: 'accent',
    fullWidth: true,
    children: <h3 className="text-foreground">Hello I am a Child</h3>,
  } as SectionProps,
};

export const MaxWidth: Story = {
  args: {
    variant: 'accent',
    maxWidth: 300,
    children: <h3 className="text-foreground">Hello I am a Child</h3>,
  } as SectionProps,
};

export const White: Story = {
  args: {
    variant: 'white',
    children: <h3 className="text-foreground">Hello I am a Child</h3>,
  } as SectionProps,
};

export const AsChild: Story = {
  args: {
    variant: 'white',
    Comp: 'main',
    children: <span>Hello I am a Child</span>,
  } as SectionProps,
};

// With bgImgPath
export const WithBgImgPath: Story = {
  args: {
    variant: 'accent',
    bgImgPath: '/img/illustrations/section-hero.svg',
    children: <h3 className="text-foreground">Hello I am a Child</h3>,
  } as SectionProps,
};
