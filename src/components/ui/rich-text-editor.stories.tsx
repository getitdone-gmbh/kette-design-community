import type { Meta, StoryObj } from '@storybook/react';

import { RichTextEditor } from './rich-text-editor';

const meta = {
  id: 'patterns-richtexteditor',
  title: 'Patterns · Interface/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  args: {
    defaultValue:
      '# Title\n\nSome **bold**, *italic* and `code` text with a [link](https://example.com).\n\n- first\n- second',
  },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Message: Story = {
  args: { type: 'message', defaultValue: '', placeholder: 'Write a message...', rows: 4 },
};
export const NoPreview: Story = { args: { preview: false } };
export const Invalid: Story = { args: { invalid: true, error: 'Could not insert link' } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
