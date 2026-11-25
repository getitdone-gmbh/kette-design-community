import type { Meta, StoryObj } from '@storybook/react';

import { ArrowRight, Search } from 'lucide-react';

import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { EmptyState } from './empty-state';
import { Illustration } from './illustration';
import { Table, TableBody, TableEmpty, TableHead, TableHeader, TableRow } from './table';

const meta = {
  id: 'patterns-empty-state',
  title: 'Patterns · Data/Empty state',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One body for every empty, no-result, error and no-access state: a dashed frame with card corners, a bare line icon, a short title and an optional smaller line, plus the actions. The root fills the free height of a flex column and centres the content, so a state in a card or sheet sits in the middle. Inside a table row, grid cell or an already framed box pass `outlined={false}` so there is one frame. Same body as `DataStatePanel` kind="empty".',
      },
    },
  },
  args: { title: 'No companies yet', description: 'Add your first company or import a list.' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'first-use', 'no-results', 'error', 'no-access'], description: 'Default glyph and live region role (`error` is an alert).' },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'page'], description: 'Title role: xs and sm ui-medium, md and lg ui-lg-semibold, page the page title.' },
    tone: { control: 'select', options: ['primary', 'gray'], description: '`primary` colours the icon in the brand icon colour.' },
    outlined: { control: 'boolean', description: 'Dashed frame around the body (default). Set false inside a table row, grid cell or an already framed box.' },
    align: { control: 'select', options: ['center', 'start'], description: 'Centred (default) or aligned to the start edge for page states beside left aligned content.' },
    title: { control: 'text', description: 'Short title line.' },
    titleAs: { control: 'select', options: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], description: 'Element of the title. A heading level for pages like 404 or access denied.' },
    titleSize: { control: 'select', options: ['default', 'display'], description: '`display` sets the title in the display-sm role; default keeps the role of the size.' },
    description: { control: 'text', description: 'Smaller line under the title. Plain text renders as one paragraph, a node renders in a block.' },
    kicker: { control: 'text', description: 'Short line above the title, for example "404".' },
    children: { control: false, description: 'Further content below the description.' },
    icon: { control: false, description: 'Overrides the default glyph of the variant. `null` renders no icon.' },
    illustration: { control: false, description: 'Replaces the icon with a larger Illustration.' },
    actions: { control: false, description: 'Action buttons. Stacked for the four state variants, in a row for `default`.' },
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
// Locked by plan (prototype "Matches gesperrt"): the no-access state keeps the tabs of the page, says what stays free and offers one primary action that leads to the plans.
export const Locked: Story = {
  args: {
    variant: 'no-access',
    title: 'Recommended is part of jobsearch.zero',
    description: 'Your profile, your CV and 50 CV imports a month stay free.',
    actions: (
      <Button variant="primary" size="md" icon={<ArrowRight aria-hidden />}>
        Choose jobsearch.zero
      </Button>
    ),
  },
};
export const NoAccess: Story = { args: { variant: 'no-access', title: 'No access', description: 'Ask an admin for access.', actions: <Button variant="outline" size="sm">Request access</Button> } };
// The activity timeline state of workload.zero: frame, bare icon and one short line, nothing else.
export const Default: Story = { args: { variant: 'first-use', title: 'No activity yet.', description: undefined } };
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

// Inside a table the row is the frame: TableEmpty passes `outlined={false}`, so the state has no second border.
export const InATable: StoryObj<typeof EmptyState> = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty columns={3} title="No matches" description="Reset the filters or change the search." actions={<Button variant="outline" size="control-sm">Reset filters</Button>} />
      </TableBody>
    </Table>
  ),
};

// A card with a fixed height and a flex column body: the state takes the free height (flex-1) and its content sits in the middle between head and foot.
export const CenteredInACard: StoryObj<typeof EmptyState> = {
  render: () => (
    <Card className="flex h-64 w-80 flex-col">
      <CardHeader>
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <EmptyState variant="first-use" title="All done!" description="Nothing left for today." />
      </CardContent>
      <CardFooter>
        <Button variant="link" size="link-sm">
          Open tasks
        </Button>
      </CardFooter>
    </Card>
  ),
};
