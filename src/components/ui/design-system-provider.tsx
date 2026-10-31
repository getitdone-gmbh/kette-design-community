'use client';

import * as React from 'react';

import { DesignSystemContext, type DesignSystemContextValue, type DesignSystemPreset, intlLocaleOf, useLabels, useLocale, usePreset } from './labels-context';
import { type DesignSystemLocale, type Labels } from './labels';
import { labelsDe } from './labels-de';
import { labelsEn } from './labels-en';

export type { DesignSystemLocale } from './labels';
export type { DesignSystemPreset } from './labels-context';

const labelsByLocale: Record<DesignSystemLocale, Labels> = { en: labelsEn, de: labelsDe };

export interface DesignSystemProviderProps {
  // Language of the built-in texts and the date and number formats. Defaults to `en`.
  locale?: DesignSystemLocale;
  // Overrides single built-in texts for every component below the provider.
  labels?: Partial<Labels>;
  // Product look for the component defaults below the provider. `zero` is the workload.zero look. Inherits from the parent provider and defaults to `zero` in this package (the theme it ships is the zero theme). Pass `preset="default"` for the former look of the components.
  preset?: DesignSystemPreset;
  children?: React.ReactNode;
}

// Nested providers inherit from the closest parent, so a subtree can switch only the locale or one label.
const DesignSystemProvider = ({ locale, labels, preset, children }: DesignSystemProviderProps) => {
  const parent = React.useContext(DesignSystemContext);
  const resolvedLocale = locale ?? parent.locale;
  const resolvedPreset = preset ?? parent.preset;
  const value = React.useMemo<DesignSystemContextValue>(
    () => ({
      locale: resolvedLocale,
      preset: resolvedPreset,
      labels: { ...(locale ? labelsByLocale[locale] : parent.labels), ...labels },
    }),
    [locale, resolvedLocale, resolvedPreset, labels, parent.labels],
  );
  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
};
DesignSystemProvider.displayName = 'DesignSystemProvider';

export { DesignSystemProvider, intlLocaleOf, useLabels, useLocale, usePreset };
