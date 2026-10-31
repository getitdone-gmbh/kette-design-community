import type { Meta, StoryObj } from '@storybook/react';

import { HelpIcon } from './help-icon';

const meta = {
  id: 'primitives-helpicon',
  title: 'Primitives · Display/HelpIcon',
  component: HelpIcon,
  tags: ['autodocs'],
  args: { content: 'Billable hours' },
  argTypes: { side: { control: { type: 'select' }, options: ['top', 'right', 'bottom', 'left'] } },
  // `onOpenChange` toggles the controlled behaviour, so Storybook must not inject an action for it.
  parameters: { actions: { argTypesRegex: '^on(?!OpenChange)[A-Z].*' } },
} satisfies Meta<typeof HelpIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSupportingText: Story = { args: { supportingText: 'Hours that can be invoiced to the client.' } };

export const OpenWithArrow: Story = { args: { open: true, arrow: true, supportingText: 'Shown open for the visual spec.' } };

export const Bottom: Story = { args: { side: 'bottom', defaultOpen: true } };
