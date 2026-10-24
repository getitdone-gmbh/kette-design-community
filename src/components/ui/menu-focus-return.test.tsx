import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { ConfirmDialog } from './confirm-dialog';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from './drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet';

type Kind = 'dialog' | 'sheet' | 'drawer' | 'confirm';

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

const Overlay = ({ kind, open, onOpenChange }: { kind: Kind; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (kind === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle>Sheet</SheetTitle>
          <SheetDescription>Body</SheetDescription>
        </SheetContent>
      </Sheet>
    );
  }
  if (kind === 'drawer') {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Drawer</DrawerTitle>
          <DrawerDescription>Body</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );
  }
  if (kind === 'confirm') {
    return <ConfirmDialog open={open} onOpenChange={onOpenChange} title="Delete" description="Sure?" onConfirm={() => onOpenChange(false)} />;
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Dialog</DialogTitle>
        <DialogDescription>Body</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

const Harness = ({ kind, sub = false }: { kind: Kind; sub?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {sub ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setOpen(true)}>Open overlay</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem onSelect={() => setOpen(true)}>Open overlay</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Overlay kind={kind} open={open} onOpenChange={setOpen} />
    </>
  );
};

describe('focus return to the menu trigger', () => {
  it.each<Kind>(['dialog', 'sheet', 'drawer', 'confirm'])('%s opened from a DropdownMenu item returns focus to the menu trigger on Escape', async (kind) => {
    const user = userEvent.setup();
    render(<Harness kind={kind} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Open overlay' }));
    await flush();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('works for an item in a sub menu, focus goes to the outermost trigger', async () => {
    const user = userEvent.setup();
    render(<Harness kind="dialog" sub />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'More' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Open overlay' }));
    await flush();
    await user.keyboard('{Escape}');
    await flush();
    expect(trigger).toHaveFocus();
  });

  it('an opener that stays in the page still wins over the menu fallback', async () => {
    const user = userEvent.setup();
    const Both = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Noop</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setOpen(true)}>Plain opener</Button>
          <Overlay kind="dialog" open={open} onOpenChange={setOpen} />
        </>
      );
    };
    render(<Both />);
    const plain = screen.getByRole('button', { name: 'Plain opener' });
    plain.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');
    await flush();
    expect(plain).toHaveFocus();
  });

  it('respects preventDefault from the consumer', async () => {
    const user = userEvent.setup();
    const Prevented = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setOpen(true)}>Open overlay</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>Body</DialogDescription>
            </DialogContent>
          </Dialog>
        </>
      );
    };
    render(<Prevented />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Open overlay' }));
    await flush();
    await user.keyboard('{Escape}');
    await flush();
    expect(trigger).not.toHaveFocus();
  });
});
