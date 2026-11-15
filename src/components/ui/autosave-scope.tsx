'use client';

import * as React from 'react';

import type { AutosaveStatusProps } from './autosave-status';

// What a status that is hidden by `SheetContent statusPlacement="footer"` hands to the footer, so the footer shows the same state, label and retry.
export type HandedStatus = Pick<AutosaveStatusProps, 'state' | 'label' | 'onRetry' | 'retryLabel'>;

export interface AutosaveScope {
  // The sheet draws its save status in the footer only.
  footerOnly: boolean;
  // A footer that draws the status is mounted. Without one the status stays where it is placed.
  footerShown: boolean;
  setFooterShown: (shown: boolean) => void;
  handed: HandedStatus | null;
  hand: (status: HandedStatus | null) => void;
}

// null: a status is drawn where it is placed. A footer, a dialog, a popover and a nested sheet reset the scope to null, because a portal keeps the React context of the sheet that opened it.
export const AutosaveScopeContext = React.createContext<AutosaveScope | null>(null);

export const AutosaveScopeReset = ({ children }: { children: React.ReactNode }) => <AutosaveScopeContext.Provider value={null}>{children}</AutosaveScopeContext.Provider>;
