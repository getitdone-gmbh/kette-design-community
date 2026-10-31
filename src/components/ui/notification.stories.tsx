import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle, FolderClosed, UploadCloud } from 'lucide-react';

import { Avatar, AvatarFallback } from './avatar';
import { Notification, NotificationAction } from './notification';

const meta = {
  id: 'patterns-notification',
  title: 'Patterns · Interface/Notification',
  component: Notification,
  tags: ['autodocs'],
  // onDismiss renders the close button, so it must not get an auto action arg
  parameters: { actions: { argTypesRegex: '^on(?!Dismiss)[A-Z].*' } },
  argTypes: { variant: { control: 'select', options: ['default', 'inverse'] }, layout: { control: 'select', options: ['desktop', 'mobile'] } },
  args: {
    title: "We've just released a new update!",
    description: 'Check out the all new dashboard view. Pages and exports now load faster.',
    actions: (
      <>
        <NotificationAction>Dismiss</NotificationAction>
        <NotificationAction>Changelog</NotificationAction>
      </>
    ),
  },
} satisfies Meta<typeof Notification>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = { args: { onDismiss: () => {} } };
export const Mobile: Story = { args: { layout: 'mobile', onDismiss: () => {} } };
export const Success: Story = { args: { icon: <CheckCircle className="h-icon-md w-icon-md" />, iconTone: 'success', title: 'Successfully updated profile' } };
export const Destructive: Story = { args: { icon: <FolderClosed className="h-icon-md w-icon-md" />, iconTone: 'destructive', title: 'This project has been unpublished' } };
export const WithAvatar: Story = { args: { avatar: <Avatar size="md"><AvatarFallback>EP</AvatarFallback></Avatar>, title: 'Emily Park', description: "I've finished adding my notes." } };
export const Progress: Story = {
  args: {
    icon: <UploadCloud className="h-icon-md w-icon-md" />,
    title: "Uploading 'website-FINAL06.fig'",
    description: 'Please wait while we upload your file.',
    progress: 60,
    progressLabel: '60% uploaded...',
    onDismiss: () => {},
  },
};
export const Snackbar: Story = {
  args: { variant: 'inverse', title: 'Task deleted', description: undefined, actions: <NotificationAction>Undo</NotificationAction>, onDismiss: () => {} },
};
// Secondary line on the inverse surface uses text-inverse-subtle (4.5:1 or more in every theme, light and dark); axe covers it here.
export const SnackbarWithDescription: Story = {
  args: {
    variant: 'inverse',
    title: 'Timer running',
    description: 'Started at 09:12 on Project Atlas',
    actions: <NotificationAction>Stop</NotificationAction>,
    onDismiss: () => {},
  },
};

// DR-WBDASH-042: without onDismiss there is no close button, so the text keeps its full width (no reserved right padding).
// Phone case from the expanded timer: inverse surface, icon tile, long title and three actions in one row, not dismissible. The test runner measures the title at 320 and 390 pixels (layoutInvariants): it keeps at least 96px, the page does not scroll sideways.
const TITLE_MIN = 96;
export const NonDismissiblePhone: Story = {
  args: {
    variant: 'inverse',
    icon: <UploadCloud className="h-icon-md w-icon-md" />,
    title: 'Timer running on Project Atlas, Frontend relaunch',
    description: undefined,
    actions: (
      <>
        <NotificationAction>Pause</NotificationAction>
        <NotificationAction>Stop</NotificationAction>
        <NotificationAction>Switch</NotificationAction>
      </>
    ),
  },
  decorators: [(Story) => <div data-testid="frame" style={{ width: '100%' }}><Story /></div>],
  parameters: {
    layout: 'padded',
    layoutInvariants: {
      widths: [320, 390],
      minWidth: [{ selector: '[data-testid="frame"] [role="status"] p', px: TITLE_MIN }],
      noOverflow: ['[data-testid="frame"]'],
    },
  },
};
export const NonDismissiblePhoneDefault: Story = {
  args: {
    icon: <UploadCloud className="h-icon-md w-icon-md" />,
    title: 'Timer running on Project Atlas, Frontend relaunch',
    description: 'Started at 09:12',
    progress: 40,
    progressLabel: '40%',
    actions: (
      <>
        <NotificationAction>Pause</NotificationAction>
        <NotificationAction>Stop</NotificationAction>
      </>
    ),
  },
  decorators: NonDismissiblePhone.decorators,
  parameters: {
    layout: 'padded',
    layoutInvariants: {
      widths: [320, 390],
      minWidth: [{ selector: '[data-testid="frame"] [role="status"] p', px: TITLE_MIN }],
      noOverflow: ['[data-testid="frame"]'],
    },
  },
};
// Dismissible keeps the reserved close-button space, so the close button never overlaps the title.
export const DismissiblePhone: Story = {
  args: { ...NonDismissiblePhone.args, onDismiss: () => {} },
  decorators: NonDismissiblePhone.decorators,
  parameters: NonDismissiblePhone.parameters,
};
// Width window where the actions used to reach the close button (about 600px): the actions end before the close button.
export const DismissibleTablet: Story = {
  args: DismissiblePhone.args,
  decorators: NonDismissiblePhone.decorators,
  parameters: {
    layout: 'padded',
    layoutInvariants: {
      widths: [592, 600, 608],
      leftOf: [{ each: ['button:Pause', 'button:Stop', 'button:Switch'], of: 'button:Dismiss' }],
    },
  },
};
