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
}: {
  state?: SheetState;
  mode?: SheetMode;
  stack?: number;
}) => {
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState<SheetState>(state);
  return (
    <div className="min-h-screen p-6">
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet open={open} onOpenChange={setOpen} modal={mode !== 'push'}>
        <SheetContent size="md" mode={mode} padded={false} state={current} stackDepth={stack}>
          <SheetHeader variant="zero">
            <SheetPath>Companies / Acme GmbH</SheetPath>
            <SheetTitle variant="zero">{current === 'dirty' ? 'Unsaved changes' : current === 'loading' ? 'Loading' : 'Edit company'}</SheetTitle>
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
            <Button variant="outline" size="control-md" onClick={() => setOpen(false)}>
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
