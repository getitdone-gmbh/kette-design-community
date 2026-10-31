import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

// Pages with a long scroll: opening a modal Radix layer (scroll lock on the body) must not move the page.
// The three body setups are the ones apps use: the library base (body fills the viewport), a body with h-screen (Workbase) and a body that grows with its content.
type BodySetup = 'library' | 'fixed' | 'auto';

const useBodySetup = (setup: BodySetup) => {
  useEffect(() => {
    const body = document.body;
    if (setup === 'fixed') body.classList.add('h-screen');
    if (setup === 'auto') {
      ['position:static', 'height:auto', 'inset:auto'].forEach((rule) => {
        const [name, value] = rule.split(':');
        body.style.setProperty(name, value, 'important');
      });
    }
    return () => {
      body.classList.remove('h-screen');
      body.style.removeProperty('position');
      body.style.removeProperty('height');
      body.style.removeProperty('inset');
    };
  }, [setup]);
};

const LongPage = ({ setup }: { setup: BodySetup }) => {
  useBodySetup(setup);
  return (
    <div data-testid="long-page">
      <div className="h-screen bg-surface-container-low p-4 text-body">Scroll down. The actions sit below the first screen.</div>
      <div className="flex flex-wrap items-center gap-4 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Goal actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit goal</DropdownMenuItem>
            <DropdownMenuItem>Delete goal</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete goal</DialogTitle>
              <DialogDescription>The page keeps its scroll position while this dialog is open.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Goal details</SheetTitle>
              <SheetDescription>The page keeps its scroll position while this sheet is open.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Select>
          <SelectTrigger aria-label="Status" className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-screen bg-surface-container-low p-4 text-body">End of the page.</div>
    </div>
  );
};

const scrollLockKeeps = {
  widths: [390],
  themes: ['neutral', 'zero'],
  scrollTo: 527,
  triggers: [
    { name: 'Goal actions', layer: '[role="menu"]' },
    { name: 'Open dialog', layer: '[role="dialog"]' },
    { name: 'Open sheet', layer: '[role="dialog"]' },
    { name: 'Status', layer: '[role="listbox"]' },
  ],
};

const meta = {
  title: 'Patterns · Interface/ModalScrollLock',
  component: LongPage,
  tags: ['autodocs'],
  parameters: { scrollLockKeeps },
} satisfies Meta<typeof LongPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LibraryBody: Story = { args: { setup: 'library' } };
export const FixedBodyHeight: Story = { args: { setup: 'fixed' } };
export const AutoBodyHeight: Story = { args: { setup: 'auto' } };
