import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetPath, SheetTitle } from './sheet';

const meta = {
  id: 'primitives-sheet-work-area',
  title: 'Primitives · Overlays/Sheet work area',
  component: SheetContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A push sheet docks to the work area instead of the window edge. `container` portals it into the work area element (positioned absolute, the element must be relative). `inset` keeps a fixed sheet below the top bar and clear of the sidebar.',
      },
    },
  },
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stand-in for the app shell: top bar, sidebar and the work area.
const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen flex-col bg-sidebar-background text-text-default">
    <header className="flex h-topbar shrink-0 items-center border-0 border-b border-solid border-hairline px-4 typography-ui-medium">Top bar</header>
    <div className="flex min-h-0 flex-1">
      <aside className="w-sidebar shrink-0 p-4 typography-ui text-sidebar-muted-foreground">Sidebar</aside>
      {children}
    </div>
  </div>
);

const Panel = () => (
  <>
    <SheetHeader variant="zero">
      <SheetPath>Demands / Frontend Dev React</SheetPath>
      <SheetTitle variant="zero">Frontend Dev React</SheetTitle>
      <SheetDescription>Docked to the work area.</SheetDescription>
    </SheetHeader>
    <SheetBody />
  </>
);

const ContainerDemo = () => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  return (
    <Shell>
      <main ref={setHost} className="relative min-w-0 flex-1 overflow-hidden rounded-surface border border-solid border-border bg-background p-6">
        <h1 className="typography-sheet-title m-0">Demands</h1>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close sheet' : 'Open sheet'}
        </Button>
        <Sheet open={open && host !== null} modal={false} onOpenChange={setOpen}>
          <SheetContent mode="push" size="md" padded={false} container={host}>
            <Panel />
          </SheetContent>
        </Sheet>
      </main>
    </Shell>
  );
};

// Scoped with `container`: the sheet sits inside the work area card, below the top bar and next to the sidebar.
export const PushInContainer: Story = { render: () => <ContainerDemo /> };

// Scoped with `inset`: a fixed sheet that starts below the top bar.
export const PushBelowTopBar: Story = {
  render: () => (
    <Shell>
      <main className="min-w-0 flex-1 rounded-surface border border-solid border-border bg-background p-6">
        <h1 className="typography-sheet-title m-0">Demands</h1>
        <Sheet open modal={false}>
          <SheetContent mode="push" size="md" padded={false} inset="topbar">
            <Panel />
          </SheetContent>
        </Sheet>
      </main>
    </Shell>
  ),
};
