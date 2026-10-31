import type { Meta, StoryObj } from '@storybook/react';
import { Home } from 'lucide-react';

import { BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, Breadcrumbs, type BreadcrumbType } from './breadcrumb';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-breadcrumbs',
  title: 'Patterns · Interface/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  args: { type: 'text', divider: 'chevron' },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'text-with-line', 'button-primary', 'button-gray', 'button-gray-border', 'path'],
    },
    divider: { control: { type: 'select' }, options: ['chevron', 'slash'] },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Crumbs = (args: React.ComponentProps<typeof Breadcrumbs>) => (
  <Breadcrumbs {...args}>
    <BreadcrumbItem>
      <BreadcrumbLink href="#" icon={<Home className="h-full w-full" />} aria-label="Home" />
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink current>Team</BreadcrumbLink>
    </BreadcrumbItem>
  </Breadcrumbs>
);

export const Default: Story = { render: (args) => <Crumbs {...args} /> };

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['text', 'text-with-line', 'button-primary', 'button-gray', 'button-gray-border', 'path'] as BreadcrumbType[]).map((t) => (
        <div key={t} className="flex flex-col gap-2">
          <span className="typography-text-extra-small text-text-subtle">{t}</span>
          <Crumbs type={t} aria-label={`Breadcrumb, ${t}`} />
          <Crumbs type={t} divider="slash" aria-label={`Breadcrumb, ${t}, slash`} />
        </div>
      ))}
    </div>
  ),
};

export const WithDisabledLevel: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Workspace</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink disabled>Restricted</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink current>Report</BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumbs>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  render: (args) => <Crumbs {...args} />,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
