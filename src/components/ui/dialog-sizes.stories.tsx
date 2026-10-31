import type { Meta, StoryObj } from '@storybook/react';
import { Archive, Trash2 } from 'lucide-react';

import { Button } from './button';
import { Input } from './input';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFeaturedIcon,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

const meta = {
  id: 'primitives-dialog-sizes',
  title: 'Primitives · Overlays/Dialog sizes',
  component: DialogContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Modal sizes sm 440 and md 520 with the horizontal header and a featured icon.' } },
  },
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = ({ size, destructive = false }: { size: 'sm' | 'md' | 'lg' | 'xl'; destructive?: boolean }) => (
  <Dialog open>
    <DialogContent size={size}>
      <DialogHeader orientation="horizontal">
        <DialogFeaturedIcon tone={destructive ? 'destructive' : 'success'}>{destructive ? <Trash2 /> : <Archive />}</DialogFeaturedIcon>
        <div className="flex flex-col gap-1">
          <DialogTitle>{destructive ? 'Delete company?' : 'Archive company?'}</DialogTitle>
          <DialogDescription>Acme GmbH will be hidden from all lists. You can restore it later from the archive.</DialogDescription>
        </div>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:space-x-0">
        <Button variant="outline" size="control-md">
          Cancel
        </Button>
        <Button variant={destructive ? 'destructive' : 'primary'} size="control-md">
          {destructive ? 'Delete' : 'Archive'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const Small440: Story = { render: () => <Demo size="sm" /> };
export const Medium520: Story = { render: () => <Demo size="md" /> };
export const Large640: Story = { render: () => <Demo size="lg" /> };
export const ExtraLarge900: Story = { render: () => <Demo size="xl" /> };
export const Destructive: Story = { render: () => <Demo size="sm" destructive /> };

// Long content: DialogBody scrolls, the header and the footer stay in view.
export const ScrollingBody: Story = {
  render: () => (
    <Dialog open>
      <DialogContent size="lg" scrollable>
        <DialogHeader>
          <DialogTitle>Application</DialogTitle>
          <DialogDescription>Fill in all sections.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} className="py-2 text-sm">
              Section {i + 1}
            </p>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="control-md">
            Cancel
          </Button>
          <Button variant="primary" size="control-md">
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// The first field takes focus on open, the scrolling body never does.
export const ScrollingBodyWithFields: Story = {
  render: () => (
    <Dialog open>
      <DialogContent size="lg" scrollable>
        <DialogHeader>
          <DialogTitle>Application</DialogTitle>
          <DialogDescription>The first field is focused on open.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 p-1">
          {Array.from({ length: 12 }, (_, i) => (
            <Input key={i} aria-label={`Field ${i + 1}`} placeholder={`Field ${i + 1}`} />
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="primary" size="control-md">
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
