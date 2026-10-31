import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DesignSystemProvider } from './design-system-provider';
import { ConfirmDialog } from './confirm-dialog';

const setup = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete Nordwind Handel?"
      description="Cannot be undone."
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange };
};

describe('ConfirmDialog', () => {
  it('renders title, text and right aligned actions without a body or input', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete Nordwind Handel?' })).toBeInTheDocument();
    expect(screen.getByText('Cannot be undone.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Confirm' }).parentElement).toHaveClass('sm:justify-end');
  });

  it('confirms and cancels', async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = setup();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses the destructive confirm button by default and the primary one on request', () => {
    const { unmount } = render(<ConfirmDialog open title="T" onConfirm={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Confirm' }).className).toContain('bg-background-destructive-bold-default');
    unmount();
    render(<ConfirmDialog open title="T" tone="primary" onConfirm={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Confirm' }).className).toContain('bg-button-background-primary-default');
  });

  it('keeps confirm disabled until the typed value matches', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup({ confirmValue: 'Nordwind Handel GmbH' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    const input = screen.getByLabelText('Type Nordwind Handel GmbH to confirm');
    expect(confirm).toBeDisabled();
    await user.type(input, 'Nordwind Handel');
    expect(confirm).toBeDisabled();
    await user.type(input, ' GmbH');
    expect(confirm).toBeEnabled();
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not confirm with Enter while the value does not match', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup({ confirmValue: 'Nordwind Handel' });
    await user.type(screen.getByRole('textbox'), 'Ac{Enter}');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('label precedence: prop wins over the English default', () => {
    setup({ confirmValue: 'x', confirmInputLabel: 'Company name', confirmLabel: 'Delete', cancelLabel: 'Back' });
    expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('takes the default texts from the provider locale', () => {
    render(
      <DesignSystemProvider locale="de">
        <ConfirmDialog open title="T" confirmValue="Nordwind Handel" onConfirm={() => undefined} />
      </DesignSystemProvider>,
    );
    expect(screen.getByLabelText('Zum Bestätigen Nordwind Handel eingeben')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bestätigen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
  });

  it('renders an optional body', () => {
    setup({ children: <p>12 contacts will be removed.</p> });
    expect(screen.getByText('12 contacts will be removed.')).toBeInTheDocument();
  });
});
