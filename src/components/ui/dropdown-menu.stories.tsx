import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

const meta = {
  id: 'primitives-dropdownmenu',
  title: 'Primitives · Overlays/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {/* DROPDOWNMENU-A11Y-03: pair the label's id with the following group's aria-labelledby
              so a screen reader announces "My Account, group" instead of an anonymous group. */}
          <DropdownMenuLabel id="dropdown-story-account-label">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup aria-labelledby="dropdown-story-account-label">
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Keyboard shortcuts
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Email</DropdownMenuItem>
                  <DropdownMenuItem>Message</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>More...</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              New Team
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  ],
  args: {} as any,
};

// Figma "_Command dropdown menu item" Checkbox=True rows, plus the radio-group variant — both
// rendered `defaultOpen` so Chromatic/axe exercise the token-styled panel and the checked/selected
// indicator without a manual interaction step.
export const WithCheckboxAndRadioItems: Story = {
  decorators: [
    (Story) => (
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {/* DROPDOWNMENU-A11Y-03: same label/group id pairing for the checkbox run and the
              radio group below, so both read as named groups to a screen reader. */}
          <DropdownMenuLabel id="dropdown-story-appearance-label">Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup aria-labelledby="dropdown-story-appearance-label">
            <DropdownMenuCheckboxItem checked>Show toolbar</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Show status bar</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem disabled>Show panel (unavailable)</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel id="dropdown-story-panel-position-label">Panel position</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="bottom" aria-labelledby="dropdown-story-panel-position-label">
            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  ],
  args: {} as any,
};

/** `variant="destructive"` renders an item in the destructive role (delete, remove, sign out). */
export const WithDestructiveItem: Story = {
  args: {
    children: (
      <>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            Delete
            <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </>
    ),
  },
};

const OpensOverlayDemo = () => {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="typography-ui m-0">Open the menu, choose an item and close the overlay with Escape: focus goes back to the Actions button, not to the page.</p>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onSelect={() => setDialog(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSheet(true)}>Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>The menu item that opened this dialog is gone. Focus returns to the menu trigger when you close it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Details</SheetTitle>
            <SheetDescription>Same fallback for Sheet, Drawer and ConfirmDialog.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

/** A menu item that opens a Dialog, Sheet, Drawer or ConfirmDialog. The item unmounts with the menu, so on close focus returns to the menu trigger (WCAG 2.4.3). A sub menu item returns to the outermost trigger. */
export const OpensOverlay: Story = {
  render: () => <OpensOverlayDemo />,
  args: {} as any,
};

/** `density="touch"` makes every row 44px high below the sm breakpoint (touch-target-lg token, WCAG 2.5.5). Use it for menus opened from a mobile trigger. `density="auto"` does the same on coarse pointers (touch screens) at any width. Default keeps the dense rows. Resize the viewport to see it. */
export const TouchDensity: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: {
    children: (
      <>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Touch menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" density="touch">
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Show archived</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </>
    ),
  },
};
