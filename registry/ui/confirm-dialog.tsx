'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFeaturedIcon,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLabels } from '@/components/ui/labels-context';

interface ConfirmDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Optional trigger element, rendered with asChild.
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  // Optional body between the text and the buttons. Omit for the compact title, text and buttons layout.
  children?: React.ReactNode;
  // Optional featured icon beside the title, for example an alert icon.
  icon?: React.ReactNode;
  // `destructive` (default) renders the destructive confirm button, `primary` the brand confirm button.
  tone?: 'destructive' | 'primary';
  // When set, the confirm button stays disabled until the user typed exactly this value, for example the name.
  confirmValue?: string;
  // Label of the confirm input. Defaults to the provider text "Type {value} to confirm".
  confirmInputLabel?: string;
  confirmInputPlaceholder?: string;
  // Button texts. Win over the provider text.
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  // Disables the actions while the confirmation runs.
  pending?: boolean;
  // A confirmation interrupts the user and asks for an answer, so it is an `alertdialog` by default (focus starts on Cancel, or on the confirm input, and a click outside does not close it). Pass `dialog` for a dismissible one.
  role?: 'alertdialog' | 'dialog';
  className?: string;
}

// Modal Type Destructive right aligned (Figma): title, text, optional body and confirm input, right aligned actions.
const ConfirmDialog = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  icon,
  tone = 'destructive',
  confirmValue,
  confirmInputLabel,
  confirmInputPlaceholder,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  role = 'alertdialog',
  className,
}: ConfirmDialogProps) => {
  const l = useLabels({ confirm: confirmLabel, cancel: cancelLabel });
  const inputId = React.useId();
  const [inner, setInner] = React.useState(defaultOpen);
  const [typed, setTyped] = React.useState('');
  const open = openProp ?? inner;
  const needsInput = confirmValue !== undefined;
  const matches = !needsInput || typed === confirmValue;

  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInner(next);
    if (!next) setTyped('');
    onOpenChange?.(next);
  };
  const confirm = () => {
    if (!matches || pending) return;
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent size="sm" role={role} initialFocus={needsInput ? 'first-field' : 'auto'} className={className}>
        <DialogHeader orientation={icon ? 'horizontal' : 'vertical'}>
          {icon && <DialogFeaturedIcon tone={tone === 'destructive' ? 'destructive' : 'brand'}>{icon}</DialogFeaturedIcon>}
          <div className="flex flex-col gap-2">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </div>
        </DialogHeader>
        {children}
        {needsInput && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>{confirmInputLabel ?? l.typeToConfirm(confirmValue)}</Label>
            <Input
              id={inputId}
              value={typed}
              placeholder={confirmInputPlaceholder}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  confirm();
                }
              }}
            />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} data-autofocus={needsInput ? undefined : ''} onClick={() => handleOpenChange(false)}>
            {l.cancel}
          </Button>
          <Button
            type="button"
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            disabled={!matches || pending}
            onClick={confirm}
          >
            {l.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog, type ConfirmDialogProps };
