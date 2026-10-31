import type { Meta, StoryObj } from '@storybook/react';

import { Versions } from './versions';
import { DesignSystemProvider } from './design-system-provider';

const items = [
  { id: 'v3', version: 3, current: true, author: 'Lena Hartmann', date: '2026-10-01T10:00:00Z', note: 'Added payment terms' },
  { id: 'v2', version: 2, author: 'Tobias Lindner', date: '2026-09-12T10:00:00Z', note: 'Updated pricing table' },
  { id: 'v1', version: 1, author: 'Lena Hartmann', date: '2026-09-01T10:00:00Z' },
];

const meta = {
  id: 'data-display-versions',
  title: 'Patterns · Data/Versions',
  component: Versions,
  tags: ['autodocs'],
  args: { items, onRestore: () => undefined },
} satisfies Meta<typeof Versions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Restoring: Story = { args: { restoringId: 'v2' } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { items: [] } };
export const ErrorState: Story = { args: { state: 'error', onRetry: () => undefined } };

const german = {
  title: 'Versionsverlauf',
  current: 'Aktuell',
  restore: 'Wiederherstellen',
  restoring: 'Wird wiederhergestellt',
  emptyTitle: 'Noch keine Versionen',
  emptyDescription: 'Gespeicherte Versionen erscheinen hier.',
  errorTitle: 'Versionen konnten nicht geladen werden',
  errorDescription: 'Pruefe die Verbindung und versuche es erneut.',
  retry: 'Erneut versuchen',
  version: (n: string | number) => `Version ${n}`,
  by: (name: string) => `von ${name}`,
  noNote: 'Keine Aenderungsnotiz',
  restoreAria: (n: string | number) => `Version ${n} wiederherstellen`,
};

export const CustomLabelsAndDate: Story = {
  parameters: { docs: { description: { story: 'The `labels` prop wins over the provider locale, which wins over English. `formatDate` lets the consumer format dates.' } } },
  args: { labels: german, formatDate: (date: Date) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) },
};
export const ErrorWithDescription: Story = {
  args: { state: 'error', onRetry: () => undefined, labels: { errorDescription: 'Check your connection and try again.' } },
};
export const EmptyWithDescription: Story = {
  args: { items: [], labels: { emptyDescription: 'Saved versions of this document show up here.' } },
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
