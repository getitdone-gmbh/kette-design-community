import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { Button } from './button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './sheet';
import { ConfirmDialog } from './confirm-dialog';

const meta = {
  id: 'compositions-dialogs-confirm-dialog',
  title: 'Compositions/Dialogs · Confirm dialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal Type Destructive right aligned. Compact title, text and buttons by default. Optional body, optional confirm input that enables the confirm button, and a primary (non-destructive) confirm button.',
      },
    },
  },
  args: {
    trigger: <Button variant="outline">Delete company</Button>,
    title: 'Delete Acme GmbH?',
    description: 'This removes the company and its contacts. This cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoBody: Story = {};
export const WithIcon: Story = { args: { icon: <AlertTriangle /> } };
export const WithBody: Story = {
  args: { children: <p className="typography-ui m-0 text-text-subtle">12 contacts and 3 open demands will be removed.</p> },
};
export const ConfirmInput: Story = { args: { confirmValue: 'Acme GmbH' } };
export const ConfirmInputCustomLabel: Story = {
  args: { confirmValue: 'Acme GmbH', confirmInputLabel: 'Company name', confirmInputPlaceholder: 'Acme GmbH' },
};
export const PrimaryConfirm: Story = {
  args: {
    trigger: <Button>Archive company</Button>,
    tone: 'primary',
    title: 'Archive Acme GmbH?',
    description: 'The company is hidden from lists and can be restored later.',
    confirmLabel: 'Archive',
  },
};

const AlertDialogExample = (props: React.ComponentProps<typeof ConfirmDialog>) => {
  const [open, setOpen] = useState(false);
  return <ConfirmDialog {...props} open={open} onOpenChange={setOpen} />;
};

// An alert dialog (role alertdialog): it interrupts and asks for an answer. Focus starts on Cancel (the safe action) and stays trapped, a click outside does not close it, Escape does. It opens from its button; the play function checks that a click outside leaves it open.
export const AlertDialog: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button');
    if (!trigger) throw new Error('No trigger button rendered');
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const dialog = document.querySelector('[role="alertdialog"]');
    if (!dialog) throw new Error('No alertdialog rendered');
    if (document.activeElement?.textContent !== 'Cancel') throw new Error(`Focus is on "${document.activeElement?.textContent}", expected Cancel`);
    // A click on the scrim must not close an alert dialog. The scrim is found by its marker: the fill class differs per look (bg-overlay, bg-overlay-scrim in zero).
    const scrim = document.querySelector<HTMLElement>('[data-modal-overlay]');
    if (!scrim) throw new Error('No scrim rendered');
    scrim.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    scrim.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!document.querySelector('[role="alertdialog"]')) throw new Error('A click outside closed the alert dialog');
  },
};

// The dismissible form (role dialog): a click on the scrim closes it, Escape does too. Focus starts on the first control like in any dialog.
export const PlainDialog: Story = {
  args: { role: 'dialog' },
  render: (args) => <AlertDialogExample {...args} />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button');
    if (!trigger) throw new Error('No trigger button rendered');
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (document.querySelector('[role="alertdialog"]')) throw new Error('An alertdialog rendered, expected a dialog');
    if (!document.querySelector('[role="dialog"]')) throw new Error('No dialog rendered');
    const scrim = document.querySelector<HTMLElement>('[data-modal-overlay]');
    if (!scrim) throw new Error('No scrim rendered');
    scrim.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    scrim.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (document.querySelector('[role="dialog"]')) throw new Error('A click outside did not close the dialog');
  },
};

// An alert dialog opened from a sheet: Escape closes the dialog only and focus goes back to the button in the sheet, the sheet stays open.
export const AlertDialogInSheet: Story = {
  args: { trigger: undefined },
  render: (args) => (
    <Sheet open modal>
      <SheetContent size="md" padded={false}>
        <SheetHeader>
          <SheetTitle>Edit company</SheetTitle>
          <SheetDescription>Acme GmbH</SheetDescription>
        </SheetHeader>
        <SheetFooter className="p-6">
          <ConfirmDialog {...args} trigger={<Button variant="outline">Delete company</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(300);
    const trigger = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Delete company');
    if (!trigger) throw new Error('The trigger is missing');
    trigger.click();
    await wait(300);
    if (!document.querySelector('[role="alertdialog"]')) throw new Error('The alert dialog did not open');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await wait(400);
    if (document.querySelector('[role="alertdialog"]')) throw new Error('Escape did not close the alert dialog');
    if (!document.querySelector('[data-slot="sheet-content"]')) throw new Error('Escape closed the sheet as well');
    if (document.activeElement !== trigger) throw new Error('Focus did not return to the button in the sheet');
  },
};
