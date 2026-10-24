import type { Meta, StoryObj } from '@storybook/react';
import { Users } from 'lucide-react';

import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Chip } from './chip';
import { ListItem } from './list-item';

const meta = {
  title: 'Patterns/List item',
  component: ListItem,
  tags: ['autodocs'],
  // onClick turns the row into a button, so it must not get an auto action arg
  parameters: { actions: { argTypesRegex: '^on(?!Click)[A-Z].*' } },
  args: { title: 'Team members', subtitle: '12 Members in this Workspace', lead: <Users className="h-icon-md w-icon-md" /> },
} satisfies Meta<typeof ListItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = { args: { trailing: '12' } };
export const Navigation: Story = { args: { onClick: () => {}, chevron: true } };
export const Selected: Story = { args: { onClick: () => {}, chevron: true, selected: true } };
export const Disabled: Story = { args: { onClick: () => {}, chevron: true, disabled: true } };
export const WithStatus: Story = { args: { trailing: <Chip label="Active" variant="success" size="small" /> } };

// Link mode: a real anchor. With asChild the row styles go onto your own link component.
export const AsLink: Story = { args: { href: '#team', chevron: true } };
export const AsChildLink: Story = {
  render: (args) => (
    <ListItem {...args} chevron>
      <a href="#team">link</a>
    </ListItem>
  ),
  args: { asChild: true },
};

// Container-responsive row. The Card is the size container (`container`), so the row reacts to the card width. Under 420px (the `@area-2xs` container screen) the controls sit under the title, from 420px they move to the end of the row.
const NeedsYouCard = ({ width, id }: { width: number; id: string }) => (
  <Card container density="compact" style={{ width }} data-testid={id}>
    <CardHeader>
      <CardTitle>Needs you</CardTitle>
    </CardHeader>
    <CardContent>
      <ListItem
        responsive
        lead={<Users className="h-icon-md w-icon-md" />}
        title="Approve timesheet for March"
        subtitle="Due today"
        trailing={
          <>
            <span>Overdue</span>
            <Button variant="outline" size="sm">Review</Button>
          </>
        }
      />
    </CardContent>
  </Card>
);

export const ResponsiveInCard: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <NeedsYouCard width={360} id="card-narrow" />
      <NeedsYouCard width={640} id="card-wide" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const parts = (id: string) => {
      const card = canvasElement.querySelector(`[data-testid="${id}"]`);
      const title = card?.querySelector('.typography-ui-medium')?.getBoundingClientRect();
      const button = card?.querySelector('button')?.getBoundingClientRect();
      if (!title || !button) throw new Error(`missing parts in ${id}`);
      return { title, button };
    };
    const narrow = parts('card-narrow');
    if (narrow.button.top < narrow.title.bottom) throw new Error('narrow card: the controls must sit under the title');
    const wide = parts('card-wide');
    if (wide.button.top >= wide.title.bottom) throw new Error('wide card: the controls must sit beside the title');
  },
};
