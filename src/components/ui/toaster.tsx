'use client';

import * as React from 'react';

import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';
import { ACTION_TOAST_DURATION, type ToastActionSpec, useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        return (
          <Toast key={id} duration={duration ?? (action ? ACTION_TOAST_DURATION : undefined)} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action && !React.isValidElement(action) ? (
              <ToastAction altText={(action as ToastActionSpec).altText ?? (action as ToastActionSpec).label} onClick={(action as ToastActionSpec).onClick}>
                {(action as ToastActionSpec).label}
              </ToastAction>
            ) : (
              action
            )}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
