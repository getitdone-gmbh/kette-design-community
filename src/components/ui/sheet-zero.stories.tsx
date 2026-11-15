import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetMeta,
  SheetPath,
  SheetSection,
  SheetTitle,
  type SheetMode,
  type SheetState,
} from './sheet';
import { AutosaveStatus } from './autosave-status';

const meta = {
  id: 'primitives-sheet-zero',
  title: 'Primitives · Overlays/Sheet zero',
  component: SheetContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Slide out menu: size (440/520/640), mode (modal, push, overlay), stack depth, zero header, body sections and loading, error and dirty states.',
      },
    },
  },
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = ({
  state = 'default',
  mode = 'modal',
  stack = 0,
  statusPlacement = 'any',
}: {
  state?: SheetState;
  mode?: SheetMode;
  stack?: number;
  statusPlacement?: 'any' | 'footer';
}) => {
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState<SheetState>(state);
  return (
    <div className="min-h-screen p-6">
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet open={open} onOpenChange={setOpen} modal={mode !== 'push'}>
        <SheetContent size="md" mode={mode} padded={false} state={current} stackDepth={stack} statusPlacement={statusPlacement}>
          <SheetHeader variant="zero">
            <SheetPath>Companies / Acme GmbH</SheetPath>
            <SheetTitle variant="zero">Edit company</SheetTitle>
            <SheetDescription className="sr-only">Edit the company record</SheetDescription>
            <SheetMeta>
              <AutosaveStatus state={current === 'dirty' ? 'dirty' : current === 'error' ? 'error' : 'saved'} />
              <span>12 contacts</span>
              <span>3 open demands</span>
            </SheetMeta>
          </SheetHeader>
          <SheetBody onRetry={() => setCurrent('default')} errorMessage="Could not load this company">
            {[1, 2, 3].map((n) => (
              <SheetSection key={n} title="Label" description="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
                <div className="h-20 rounded-surface bg-muted" />
              </SheetSection>
            ))}
          </SheetBody>
          <SheetFooter variant="zero">
            <Button variant="ghost" size="control-md" onClick={() => setOpen(false)}>
              {current === 'dirty' ? 'Discard' : 'Cancel'}
            </Button>
            <Button variant="primary" size="control-md" disabled={current !== 'dirty' && current !== 'default'}>
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const PushMedium: Story = { render: () => <Demo mode="push" /> };
export const Overlay: Story = { render: () => <Demo mode="overlay" /> };
export const StackLevel2: Story = { render: () => <Demo mode="overlay" stack={1} /> };
export const Loading: Story = { render: () => <Demo mode="push" state="loading" /> };
export const Error: Story = { render: () => <Demo mode="push" state="error" /> };
export const Dirty: Story = { render: () => <Demo mode="push" state="dirty" /> };

// The save status is drawn once, in the footer. The AutosaveStatus in SheetMeta is hidden by statusPlacement="footer".
export const StatusInFooterOnly: Story = { render: () => <Demo mode="push" state="dirty" statusPlacement="footer" /> };

// A docked push sheet opened by a click takes focus (the first control inside), so the keyboard continues in the sheet. The play function clicks the button.
const PushOpenedByClickDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen p-6">
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent size="md" mode="push" padded={false}>
          <SheetHeader variant="zero">
            <SheetTitle variant="zero">Company details</SheetTitle>
            <SheetDescription className="sr-only">Docked details</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Button variant="outline">First action</Button>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
};
export const PushOpenedByClick: Story = {
  render: () => <PushOpenedByClickDemo />,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('button')?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog || !dialog.contains(document.activeElement)) throw new globalThis.Error('Focus did not move into the push sheet');
  },
};
