import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { EmptyState } from './empty-state';
import { Illustration } from './illustration';
import { Search } from 'lucide-react';

const meta = {
  id: 'patterns-empty-state',
  title: 'Patterns · Data/Empty state',
  component: EmptyState,
  tags: ['autodocs'],
  args: { title: 'No companies yet', description: 'Add your first company or import a list.' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'first-use', 'no-results', 'error', 'no-access'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    tone: { control: 'select', options: ['primary', 'gray'] },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

const actions = (
  <>
    <Button variant="outline" size="control-md">Import</Button>
    <Button variant="primary" size="control-md">Add company</Button>
  </>
);

export const FirstUse: Story = { args: { variant: 'first-use', actions } };
export const NoResults: Story = { args: { variant: 'no-results', title: 'No matches', description: 'Reset the filters or change the search.', actions: <Button variant="outline" size="sm">Reset filters</Button> } };
export const Error: Story = { args: { variant: 'error', title: 'Could not load companies', description: 'Try again; if it keeps failing, contact support.', actions: <Button variant="outline" size="sm">Try again</Button> } };
export const NoAccess: Story = { args: { variant: 'no-access', title: 'No access', description: 'Ask an admin for access.', actions: <Button variant="outline" size="sm">Request access</Button> } };
export const Default: Story = { args: { variant: 'default', title: 'No projects found', description: 'Your search did not match any projects.', actions } };
export const DefaultPrimaryLarge: Story = { args: { variant: 'default', size: 'lg', tone: 'primary', title: 'No projects found', actions } };
export const WithIllustration: Story = {
  args: {
    variant: 'default',
    title: 'No projects found',
    illustration: <Illustration size="md" icon={<Search className="h-icon-lg w-icon-lg" />} />,
    actions,
  },
};
export const IllustrationGray: Story = { render: () => <Illustration size="lg" tone="gray" icon={<Search className="h-icon-lg w-icon-lg" />} /> };

export const HeadingTitle: StoryObj<typeof EmptyState> = {
  args: { title: 'Page not found', titleAs: 'h1', description: 'The page you are looking for does not exist.' },
};

export const ExtraSmall: StoryObj<typeof EmptyState> = {
  args: { size: 'xs', title: 'No items yet', description: 'Items you add show up here.' },
};

export const PageLevel: StoryObj<typeof EmptyState> = {
  args: { size: 'page', title: 'Page not found', titleAs: 'h1', description: 'The page you are looking for does not exist.' },
};

export const PageStartAligned: StoryObj<typeof EmptyState> = {
  args: {
    size: 'page',
    align: 'start',
    kicker: '404',
    title: 'Page not found',
    titleAs: 'h1',
    icon: null,
    description: (
      <>
        <p>The page you are looking for does not exist or has moved.</p>
        <p>Check the address or go back to the start page.</p>
      </>
    ),
  },
};
