import type { Meta, StoryObj } from '@storybook/react';
import { Briefcase, Building2, Clock, FileText, Phone, Users } from 'lucide-react';

import { ObjectIcon } from './object-icon';

const meta = {
  id: 'primitives-object-icon',
  title: 'Primitives · Display/Object icon',
  component: ObjectIcon,
  tags: ['autodocs'],
  argTypes: {
    app: { control: 'select', options: ['workstream', 'backoffice', 'coldcall', 'vacancy', 'jobsearch', 'record', 'contextual'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { app: 'record', size: 'md', children: <Building2 /> },
} satisfies Meta<typeof ObjectIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Products: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ObjectIcon app="workstream" size="md"><Clock /></ObjectIcon>
      <ObjectIcon app="backoffice" size="md"><FileText /></ObjectIcon>
      <ObjectIcon app="coldcall" size="md"><Phone /></ObjectIcon>
      <ObjectIcon app="vacancy" size="md"><Users /></ObjectIcon>
      <ObjectIcon app="jobsearch" size="md"><Briefcase /></ObjectIcon>
      <ObjectIcon app="record" size="md"><Building2 /></ObjectIcon>
    </div>
  ),
};

export const SemanticTones: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['neutral', 'info', 'success', 'warning', 'destructive'] as const).map((tone) => (
        <ObjectIcon key={tone} tone={tone} size="md" label={tone}>
          <FileText />
        </ObjectIcon>
      ))}
    </div>
  ),
};
