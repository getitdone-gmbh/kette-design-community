import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { SectionFooter } from './section-footer';

const meta = {
  id: 'patterns-section-footer',
  title: 'Patterns · Interface/Section footer',
  component: SectionFooter,
  tags: ['autodocs'],
  argTypes: { type: { control: 'select', options: ['section', 'card'] } },
  args: {
    children: (
      <>
        <Button variant="outline" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Save changes</Button>
      </>
    ),
  },
} satisfies Meta<typeof SectionFooter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Section: Story = {};
export const Card: Story = { args: { type: 'card' } };
export const WithLink: Story = { args: { type: 'card', supporting: <a href="#learn">Learn more</a> } };
