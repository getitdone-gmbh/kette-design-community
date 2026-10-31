'use client';

import * as React from 'react';

import { labelsEn } from './labels-en';
import { applyLabelOverrides, type DesignSystemLocale, type LabelOverrides, type Labels } from './labels';

export type { DesignSystemLocale } from './labels';

// Product level look. `default` keeps every component default as shipped; `zero` switches the component defaults (outline button, segment tabs, soft alert, inverse toast, inset sheet, zero card) to the workload.zero look.
export type DesignSystemPreset = 'default' | 'zero';

export interface DesignSystemContextValue {
  locale: DesignSystemLocale;
  labels: Labels;
  preset: DesignSystemPreset;
}

export const DesignSystemContext = React.createContext<DesignSystemContextValue>({ locale: 'en', labels: labelsEn, preset: 'zero' });

// Built-in texts for the current locale. Pass instance props as `overrides` so they win over the provider.
export const useLabels = (overrides?: LabelOverrides): Labels =>
  applyLabelOverrides(React.useContext(DesignSystemContext).labels, overrides);

export const usePreset = (): DesignSystemPreset => React.useContext(DesignSystemContext).preset;

export const useLocale = (): DesignSystemLocale => React.useContext(DesignSystemContext).locale;

// BCP 47 tag for Intl and date formatting.
export const intlLocaleOf = (locale: DesignSystemLocale) => (locale === 'de' ? 'de-DE' : 'en-US');

// Overrides single texts for a subtree without touching the locale. Keeps the German dictionary out of the bundle.
export const LabelScope = ({ labels, children }: { labels: LabelOverrides; children?: React.ReactNode }) => {
  const parent = React.useContext(DesignSystemContext);
  const value = React.useMemo(() => ({ ...parent, labels: applyLabelOverrides(parent.labels, labels) }), [parent, labels]);
  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
};
