import type { Meta, StoryObj } from '@storybook/react';
import { FilePlus, FolderOpen, Search, UserPlus } from 'lucide-react';

import { Avatar, AvatarFallback } from './avatar';
import { Button } from './button';
import {
  Command,
  CommandEmptyState,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemText,
  CommandKbd,
  CommandKeys,
  CommandList,
  CommandSeparator,
} from './command';

const meta = {
  id: 'primitives-command-bar',
  title: 'Primitives · Actions/Command bar',
  component: Command,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'Command bar: actions with key chips and sequences, stacked user rows, empty state with actions.' } },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const frame = 'w-[456px] rounded-surface border border-solid border-hairline shadow-popover';

export const Actions: Story = {
  render: () => (
    <Command className={frame}>
      <CommandInput placeholder="Search" shortcut={<CommandKbd>⌘/</CommandKbd>} />
      <CommandList>
        <CommandGroup heading="Recent">
          <CommandItem>
            <FolderOpen className="h-icon-sm w-icon-sm" aria-hidden />
            Marketing site redesign
          </CommandItem>
          <CommandItem>
            <FilePlus className="h-icon-sm w-icon-sm" aria-hidden />
            Create new document
            <CommandKeys keys={['⌘N']} />
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup>
          <CommandItem>
            <UserPlus className="h-icon-sm w-icon-sm" aria-hidden />
            My profile
            <CommandKeys keys={['⌘K', 'P']} />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

const person = (initials: string, n: 1 | 2) => (
  <Avatar size="sm">
    <AvatarFallback size="sm" className={n === 1 ? 'bg-data-avatar-1-default text-data-avatar-1-on' : 'bg-data-avatar-2-default text-data-avatar-2-on'}>
      {initials}
    </AvatarFallback>
  </Avatar>
);

export const UsersStacked: Story = {
  render: () => (
    <Command className={frame}>
      <CommandInput placeholder="Search" shortcut={<CommandKbd>⌘/</CommandKbd>} />
      <CommandList>
        <CommandGroup heading="Recent">
          <CommandItem>
            {person('PB', 1)}
            <CommandItemText title="Tobias Lindner" description="@tobias" />
          </CommandItem>
          <CommandItem>
            {person('OR', 2)}
            <CommandItemText title="Lena Hartmann" description="@lena" />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Empty: Story = {
  render: () => (
    <Command className={frame} shouldFilter={false}>
      <CommandInput defaultValue="Landing page design" shortcut={<CommandKbd>⌘/</CommandKbd>} />
      <CommandEmptyState
        title="No projects found"
        description={'"Landing page design" did not match any projects. Would you like to create a project?'}
        actions={
          <>
            <Button variant="outline" size="control-md">
              View projects
            </Button>
            <Button variant="primary" size="control-md" icon={<Search />}>
              New project
            </Button>
          </>
        }
      />
    </Command>
  ),
};
