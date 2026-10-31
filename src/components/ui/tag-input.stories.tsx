import type { Meta, StoryObj } from '@storybook/react';

import { TagInput } from './tag-input';

const meta = {
  id: 'primitives-taginput',
  title: 'Primitives · Inputs/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  args: { defaultValue: ['lena.hartmann@example.com', 'jonas.weber@example.com'], placeholder: 'Add email' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { defaultValue: [] } };
export const Multiline: Story = { args: { multiline: true } };
export const WithValidation: Story = {
  args: {
    defaultValue: ['lena.hartmann@example.com', 'not-an-email'],
    validate: (tag) => tag.includes('@'),
    invalid: true,
  },
};
export const ReadOnly: Story = { args: { readOnly: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Limited: Story = { args: { maxTags: 2 } };

// Combobox suggestions: type or press ArrowDown, pick with Enter or a click. Free text is still allowed.
export const WithSuggestions: Story = {
  args: { suggestions: ['React', 'Redux', 'TypeScript', 'Tailwind', 'Vue', 'Storybook'], placeholder: 'Add a skill' },
};

// Suggestions with a category are grouped under headings (group role with a label).
export const GroupedSuggestions: Story = {
  args: {
    placeholder: 'Add a skill',
    suggestions: [
      { value: 'react', label: 'React', category: 'Frameworks' },
      { value: 'vue', label: 'Vue', category: 'Frameworks' },
      { value: 'typescript', label: 'TypeScript', category: 'Languages' },
      { value: 'go', label: 'Go', category: 'Languages' },
      { value: 'storybook', label: 'Storybook' },
    ],
  },
};
