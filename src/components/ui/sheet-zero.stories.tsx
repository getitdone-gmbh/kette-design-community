import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { useState } from 'react';

import { Button } from './button';
import { Input } from './input';
import { ListItem } from './list-item';
import {
  Sheet,
  SheetBody,
  SheetConfirm,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetMeta,
  SheetPath,
  SheetSection,
  SheetStage,
  SheetStages,
  SheetTitle,
  useSheetStages,
  type SheetMode,
  type SheetState,
} from './sheet';
import { AutosaveStatus } from './autosave-status';

const meta = {
  id: 'primitives-sheet-zero',
  title: 'Primitives · Overlays/Sheet zero',
  component: SheetContent,
  tags: ['autodocs'],
  argTypes: {
    handle: { description: 'Grabber at the top edge of a bottom sheet. Dragging it down closes the sheet (through the discard guard); the close button stays the keyboard and screen reader way.' },
    discardGuard: { description: 'While `state` is `dirty`, Escape, a click on the scrim, the close button, SheetClose and the swipe show "Discard changes?" as a step in the same sheet instead of closing.' },
    discardTitle: { description: 'Question of the discard step. Wins over the provider text.' },
    discardDescription: { description: 'Sentence under the question of the discard step. Wins over the provider text.' },
  },
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
  footerStatus,
}: {
  state?: SheetState;
  mode?: SheetMode;
  stack?: number;
  statusPlacement?: 'any' | 'footer';
  footerStatus?: React.ReactNode;
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
          <SheetFooter variant="zero" status={footerStatus}>
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

// `status={false}` on SheetFooter switches the footer status off (KETTE-87). `undefined` and `null` keep the default "Saved" status, a node replaces it. The status in SheetMeta stays.
export const FooterStatusOff: Story = { render: () => <Demo mode="push" footerStatus={false} /> };

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

// Phone (ZERO-912): one modal layer. Picking a status pushes a stage into the same sheet (back header, Escape goes back), deleting asks in a confirmation step instead of a dialog over the sheet. 44px close button, grabber on the bottom sheet.
const STATUSES = ['Open', 'In progress', 'In review', 'Done'];

const StatusRow = ({ status }: { status: string }) => {
  const { push } = useSheetStages();
  return <ListItem title="Status" trailing={status} chevron onClick={() => push('status')} className="min-h-target-lg" />;
};

const StatusStage = ({ status, onPick }: { status: string; onPick: (status: string) => void }) => {
  const { back } = useSheetStages();
  return (
    <SheetBody className="p-2">
      {STATUSES.map((option) => (
        <ListItem
          key={option}
          title={option}
          selected={option === status}
          aria-current={option === status ? 'true' : undefined}
          className="min-h-target-lg"
          onClick={() => {
            onPick(option);
            back();
          }}
        />
      ))}
    </SheetBody>
  );
};

const PhoneTaskSheet = () => {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState('In progress');
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="min-h-screen p-4">
      <Button onClick={() => setOpen(true)}>Open task</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" handle padded={false} className="top-12 flex flex-col rounded-t-surface">
          <SheetStages>
            <SheetStage id="task" label="Homepage hero">
              <SheetHeader variant="zero" className="pt-6">
                <SheetTitle variant="zero">Homepage hero</SheetTitle>
                <SheetDescription className="sr-only">Task NOR-142</SheetDescription>
              </SheetHeader>
              <SheetBody className="p-2">
                <StatusRow status={status} />
                <ListItem title="Assignee" trailing="Mara K." className="min-h-target-lg" />
              </SheetBody>
              <SheetFooter variant="zero" status={<span />}>
                <Button variant="ghost" className="max-md:min-h-target-lg" onClick={() => setConfirm(true)}>
                  Delete task
                </Button>
              </SheetFooter>
            </SheetStage>
            <SheetStage id="status" title="Status">
              <StatusStage status={status} onPick={setStatus} />
            </SheetStage>
          </SheetStages>
          <SheetConfirm
            open={confirm}
            onOpenChange={setConfirm}
            title="Delete task?"
            description="The task and its 3 comments are removed."
            confirmLabel="Delete"
            tone="destructive"
            onConfirm={() => {
              setConfirm(false);
              setOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const PhoneStagesAndConfirm: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' }, layoutInvariants: { widths: [390] } },
  render: () => <PhoneTaskSheet />,
  // Keyboard path (the modal sheet blocks pointer events on the page while it opens): push, pick, back with focus return, confirm step, Escape.
  play: async () => {
    const screen = within(document.body);
    const status = await screen.findByRole('button', { name: /Status/ });
    status.focus();
    await userEvent.keyboard('{Enter}');
    const heading = await screen.findByRole('heading', { name: 'Status' });
    await waitFor(() => expect(heading).toHaveFocus());
    screen.getByRole('button', { name: 'Done' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: /Status/ })).toHaveFocus());
    screen.getByRole('button', { name: 'Delete task' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete task' })).toHaveFocus());
  },
};

// Unsaved input is protected: once the name changes the sheet is dirty and Escape, the scrim, the close button and the swipe ask "Discard changes?" in the same sheet.
const PhoneDiscardDemo = () => {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('New business');
  const dirty = name !== 'New business';
  return (
    <div className="min-h-screen p-4">
      <Button onClick={() => setOpen(true)}>Edit pipeline</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" handle padded={false} discardGuard state={dirty ? 'dirty' : 'default'} className="top-12 flex flex-col rounded-t-surface">
          <SheetHeader variant="zero" className="pt-6">
            <SheetTitle variant="zero">Edit pipeline</SheetTitle>
            <SheetDescription className="sr-only">Pipeline name</SheetDescription>
          </SheetHeader>
          <SheetBody className="p-5">
            <label htmlFor="pipeline-name" className="typography-ui-medium mb-2 block">
              Name
            </label>
            <Input id="pipeline-name" value={name} onChange={(event) => setName(event.target.value)} />
          </SheetBody>
          <SheetFooter variant="zero">
            <Button variant="primary" className="max-md:min-h-target-lg" onClick={() => setOpen(false)}>
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const PhoneDiscardGuard: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' }, layoutInvariants: { widths: [390] } },
  render: () => <PhoneDiscardDemo />,
  play: async () => {
    const screen = within(document.body);
    const field = await screen.findByLabelText('Name');
    field.focus();
    await userEvent.keyboard('{End} 2');
    await userEvent.keyboard('{Escape}');
    await screen.findByRole('group', { name: 'Discard changes?' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
  },
};
