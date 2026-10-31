import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';

import { CopyIcon } from '@radix-ui/react-icons';
import { Button } from './button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Input } from './input';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Tabs, TabsList, TabsTrigger } from './tabs';

const meta = {
  id: 'primitives-dialog',
  title: 'Primitives · Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Share</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue="https://ui.shadcn.com/docs/installation" readOnly />
            </div>
            <Button type="submit" size="sm" className="p-4">
              <span className="sr-only">Copy</span>
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  ],
  args: {} as any,
};

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de` translates the built-in close text. `DialogContent` takes `closeLabel` (accessible name of the close button), which wins over the provider and the English default.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <Dialog open>
        <DialogContent closeLabel="Dialog zumachen">
          <DialogHeader>
            <DialogTitle>Link teilen</DialogTitle>
            <DialogDescription>Der Schließen-Text kommt hier aus der Prop closeLabel.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DesignSystemProvider>
  ),
};

// Initial focus lands on the checked radio (else the first) in the scrolling body, not on the language tabs. The body pads itself so focus rings are not clipped.
export const RadioGroupInitialFocus: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Book a call</Button>
      </DialogTrigger>
      <DialogContent scrollable>
        <Tabs defaultValue="en">
          <TabsList>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="de">Deutsch</TabsTrigger>
          </TabsList>
        </Tabs>
        <DialogHeader>
          <DialogTitle>Book a call</DialogTitle>
          <DialogDescription>Pick a topic.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <RadioGroup aria-label="Topic" defaultValue="strategy" className="gap-3">
            {['strategy', 'delivery', 'review'].map((topic) => (
              <div key={topic} className="flex items-center gap-3">
                <RadioGroupItem value={topic} id={`topic-${topic}`} />
                <Label htmlFor={`topic-${topic}`} className="capitalize">
                  {topic}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Opt-in for dialogs without DialogBody: first form control wins over the tabs.
export const FirstFieldFocus: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Book a call</Button>
      </DialogTrigger>
      <DialogContent initialFocus="first-field">
        <Tabs defaultValue="en">
          <TabsList>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="de">Deutsch</TabsTrigger>
          </TabsList>
        </Tabs>
        <DialogHeader>
          <DialogTitle>Book a call</DialogTitle>
          <DialogDescription>Pick a topic.</DialogDescription>
        </DialogHeader>
        <RadioGroup aria-label="Topic" className="gap-3">
          {['strategy', 'delivery'].map((topic) => (
            <div key={topic} className="flex items-center gap-3">
              <RadioGroupItem value={topic} id={`first-${topic}`} />
              <Label htmlFor={`first-${topic}`} className="capitalize">
                {topic}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </DialogContent>
    </Dialog>
  ),
};

// Escape inside an open select list, menu or popover closes that layer only. A second Escape closes the dialog.
export const NestedLayers: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Contact us</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact us</DialogTitle>
          <DialogDescription>Escape closes an open list first.</DialogDescription>
        </DialogHeader>
        <Select>
          <SelectTrigger aria-label="Salutation">
            <SelectValue placeholder="Salutation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mr">Mr</SelectItem>
            <SelectItem value="ms">Ms</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Topic</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Sales</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Details</Button>
          </PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>
  ),
};

const stickyFields = Array.from({ length: 20 }, (_, index) => `Field ${index + 1}`);

// A dialog that scrolls as a whole with a sticky header and footer. Shift+Tab from the last field up to the first keeps each field clear of the bars (WCAG 2.4.11).
export const StickyHeaderAndFooter: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] p-0">
        <DialogHeader className="sticky top-0 z-raised border-0 border-b border-solid border-hairline bg-background p-6">
          <DialogTitle>Edit record</DialogTitle>
          <DialogDescription>The header stays in view while the form scrolls.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 px-6">
          {stickyFields.map((label) => (
            <label key={label} className="flex flex-col gap-1 text-sm">
              {label}
              <input className="h-10 rounded-control border border-solid border-border bg-background px-3" />
            </label>
          ))}
        </form>
        <DialogFooter className="sticky bottom-0 z-raised border-0 border-t border-solid border-hairline bg-background p-6">
          <Button type="button">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
