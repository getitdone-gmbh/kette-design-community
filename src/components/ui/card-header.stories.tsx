import type { Meta, StoryObj } from '@storybook/react';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { DesignSystemProvider } from './design-system-provider';
import { Link } from './link';

const meta = {
  title: 'Patterns/Card header',
  component: Card,
  tags: ['autodocs'],
  // onClick turns the card into a button, so it must not get an auto action arg
  parameters: { actions: { argTypesRegex: '^on(?!Click)[A-Z].*' } },
  argTypes: { variant: { control: 'select', options: ['default', 'surface'] } },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithActions: Story = {
  render: (args) => (
    <Card {...args} className="max-w-xl">
      <CardHeader
        divider
        actions={
          <>
            <Badge variant="subtle">12/20 seats</Badge>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal />
            </Button>
          </>
        }
      >
        <CardTitle>Team members</CardTitle>
        <CardDescription>Manage your team members and their account permissions.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">Body</CardContent>
    </Card>
  ),
};

export const Accent: Story = {
  render: (args) => (
    <Card {...args} className="max-w-xl">
      <CardHeader accent>
        <CardTitle>Team members</CardTitle>
      </CardHeader>
    </Card>
  ),
};

export const SurfaceInteractive: Story = {
  args: { variant: 'surface', onClick: () => {} },
  render: (args) => (
    <Card {...args} className="max-w-sm" aria-label="Open demands">
      <CardHeader>
        <CardTitle>Open demands</CardTitle>
        <CardDescription>Three demands wait for a shortlist.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const SurfaceSelected: Story = { ...SurfaceInteractive, args: { variant: 'surface', onClick: () => {}, selected: true } };

// Center line of the title row versus every kind of header action. Each row has to match within 1px.
const centerOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2;
};

export const ActionAlignment: Story = {
  render: (args) => (
    <div className="flex max-w-xl flex-col gap-4">
      {[
        { id: 'button-sm', action: <Button variant="outline" size="sm">Inbox</Button> },
        { id: 'icon-sm', action: <Button variant="ghost" size="icon-sm" aria-label="More"><MoreHorizontal /></Button> },
        { id: 'badge', action: <Badge variant="secondary">12</Badge> },
        { id: 'link', action: <Link href="#all">View all</Link> },
        // Taller than the title row: the row grows, nothing is clipped, the title stays level with the action block.
        {
          id: 'tall',
          action: (
            <div className="flex flex-col items-end gap-1">
              <Button variant="outline" size="sm">Sync now</Button>
              <span className="text-xs text-card-foreground-muted">Last run 2 min ago</span>
            </div>
          ),
        },
      ].map(({ id, action }) => (
        <Card key={id} {...args} data-testid={`row-${id}`}>
          <CardHeader actions={action}>
            <CardTitle>Needs you</CardTitle>
            <CardDescription>Three items wait for you.</CardDescription>
          </CardHeader>
        </Card>
      ))}
      <Card {...args} data-testid="row-title-only">
        <CardHeader actions={<Button variant="outline" size="sm">Inbox</Button>}>
          <CardTitle>Needs you</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('[data-testid^="row-"]');
    rows.forEach((row) => {
      const title = row.querySelector('h3');
      const actions = row.querySelector('[data-slot="card-actions"]');
      if (!title || !actions?.firstElementChild) throw new Error('missing title or action');
      const delta = Math.abs(centerOf(title) - centerOf(actions.firstElementChild));
      if (delta > 1) throw new Error(`${row.getAttribute('data-testid')}: action center is ${delta.toFixed(1)}px off the title center`);
      const inner = actions.firstElementChild.getBoundingClientRect();
      const outer = row.getBoundingClientRect();
      if (inner.top < outer.top || inner.bottom > outer.bottom) throw new Error(`${row.getAttribute('data-testid')}: the action sticks out of the card`);
    });
  },
};

export const ActionAlignmentZero: Story = {
  ...ActionAlignment,
  decorators: [(Story) => <DesignSystemProvider preset="zero"><Story /></DesignSystemProvider>],
};

export const CompactDensity: Story = {
  args: { density: 'compact' },
  render: (args) => (
    <Card {...args} className="max-w-xl">
      <CardHeader divider actions={<Button variant="outline" size="sm">Inbox</Button>}>
        <CardTitle>Needs you</CardTitle>
        <CardDescription>20px padding on header, content and footer.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">Body</CardContent>
      <CardFooter divider>
        <Button variant="ghost" size="sm">View all</Button>
      </CardFooter>
    </Card>
  ),
};
