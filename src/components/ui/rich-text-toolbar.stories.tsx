import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { RichTextToolbar, type RichTextAction } from './rich-text-toolbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { DesignSystemProvider } from './design-system-provider';

const FontSelect = () => (
  <Select defaultValue="olivia">
    <SelectTrigger aria-label="Style" className="w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="lena">Lena Hartmann</SelectItem>
      <SelectItem value="inter">Inter</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  id: 'patterns-richtexttoolbar',
  title: 'Patterns · Interface/RichTextToolbar',
  component: RichTextToolbar,
  tags: ['autodocs'],
  parameters: { actions: { argTypesRegex: '^on(?!Action)[A-Z].*' } },
  argTypes: { type: { control: { type: 'select' }, options: ['default', 'cv-editor', 'message'] } },
} satisfies Meta<typeof RichTextToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { leading: <FontSelect /> } };
export const Message: Story = { args: { type: 'message', leading: <FontSelect /> } };
export const Selected: Story = { args: { pressed: { bold: true }, leading: <FontSelect /> } };
export const Disabled: Story = { args: { disabled: true, leading: <FontSelect /> } };
export const WithError: Story = { args: { error: 'Could not insert link', leading: <FontSelect /> } };

export const Interactive: Story = {
  render: function Render() {
    const [pressed, setPressed] = useState<Partial<Record<RichTextAction, boolean>>>({});
    return (
      <RichTextToolbar
        pressed={pressed}
        onAction={(action) => setPressed((current) => ({ ...current, [action]: !current[action] }))}
        leading={<FontSelect />}
      />
    );
  },
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
