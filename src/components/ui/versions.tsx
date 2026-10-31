'use client';

import { Download, History, RotateCcw } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { DataStatePanel } from './data-state-panel';
import { intlLocaleOf, useLabels, useLocale, usePreset } from './labels-context';
import { Skeleton } from './skeleton';

export interface VersionItem {
  id: string;
  // Version number or tag, e.g. 3 or "3.1".
  version: number | string;
  author?: string;
  date?: Date | string | number;
  // Change note.
  note?: string;
  // Marks the live version. Only one should be current.
  current?: boolean;
  // File size text of this version, e.g. "2.4 MB". Shown in the `card` variant.
  size?: string;
}

// Texts of the component. Precedence: this prop, then the provider labels, then English.
export interface VersionsLabels {
  // Accessible name of the list.
  title: string;
  current: string;
  restore: string;
  restoring: string;
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  noNote: string;
  version: (version: string | number) => string;
  by: (name: string) => string;
  restoreAria: (version: string | number) => string;
  downloadAria: (version: string | number) => string;
}

export interface VersionsProps extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children'> {
  items: VersionItem[];
  // Shows a restore button on every non-current version.
  onRestore?: (item: VersionItem) => void;
  // Id of a version being restored right now. Its button shows a busy state.
  restoringId?: string;
  state?: 'default' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  labels?: Partial<VersionsLabels>;
  // Formats the date of a version. Defaults to Intl medium date in the provider locale.
  formatDate?: (date: Date) => string;
  // `list` is the flat history with the note on a second line. `card` is one bordered row per version on a single line (version, current, author, date, size, note), the current one with a brand border. Defaults to `card` in the zero preset, otherwise `list`.
  variant?: 'list' | 'card';
  // Shows a download icon button on every version.
  onDownload?: (item: VersionItem) => void;
}

// Version history, newest first as given. The current version is marked, older ones can be restored.
const Versions = React.forwardRef<HTMLUListElement, VersionsProps>(
  ({ className, items, onRestore, restoringId, state = 'default', onRetry, labels, formatDate, variant: variantProp, onDownload, 'aria-label': ariaLabel, ...props }, ref) => {
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const variant = variantProp ?? (zero ? 'card' : 'list');
    const locale = intlLocaleOf(useLocale());
    const t = {
      title: labels?.title ?? l.versionsTitle,
      current: labels?.current ?? l.currentVersion,
      restore: labels?.restore ?? l.chatRestore,
      restoring: labels?.restoring ?? l.versionRestoring,
      loading: labels?.loading ?? l.loading,
      emptyTitle: labels?.emptyTitle ?? l.noVersionsYet,
      emptyDescription: labels?.emptyDescription,
      errorTitle: labels?.errorTitle ?? l.couldNotLoad,
      errorDescription: labels?.errorDescription,
      retry: labels?.retry ?? l.tryAgain,
      noNote: labels?.noNote ?? l.noVersionNote,
      version: labels?.version ?? l.versionLabel,
      by: labels?.by ?? l.versionBy,
      restoreAria: labels?.restoreAria ?? l.restoreVersion,
      downloadAria: labels?.downloadAria ?? l.downloadVersion,
    };
    const dateText = (date: Date) => (formatDate ? formatDate(date) : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date));
    if (state === 'error') {
      return <DataStatePanel kind="error" title={t.errorTitle} description={t.errorDescription} onRetry={onRetry} retryText={t.retry} className={className} />;
    }
    if (state === 'empty' || (state === 'default' && items.length === 0)) {
      return <DataStatePanel kind="empty" title={t.emptyTitle} description={t.emptyDescription} icon={<History aria-hidden="true" />} className={className} />;
    }
    if (state === 'loading') return <Skeleton variant="row-single" rows={3} label={t.loading} className={className} />;
    const card = variant === 'card';
    return (
      <ul ref={ref} aria-label={ariaLabel ?? t.title} className={cn('m-0 flex list-none flex-col p-0 text-text-default', card && 'gap-label', className)} {...props}>
        {items.map((item) => {
          const busy = restoringId === item.id;
          const parsed = item.date === undefined ? undefined : new Date(item.date);
          const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
          if (card) {
            const parts = [
              item.author ? t.by(item.author) : null,
              date ? <time key="date" dateTime={date.toISOString()}>{dateText(date)}</time> : null,
              item.size ?? null,
              item.note ?? null,
            ].filter((part) => part !== null);
            return (
              <li
                key={item.id}
                aria-current={item.current ? 'true' : undefined}
                data-current={item.current || undefined}
                className={cn(
                  'flex items-center gap-2 rounded-control border border-solid px-3 py-2',
                  item.current ? 'border-border-brand bg-background-selected-default' : 'border-border-default bg-card',
                )}
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
                  <b className="typography-ui-semibold">{t.version(item.version)}</b>
                  {item.current ? <Badge variant="info">{t.current}</Badge> : null}
                  <span className={cn('typography-ui min-w-0 truncate', item.current ? 'text-general-brand-on-container' : 'text-text-subtle')}>
                    {parts.map((part, index) => (
                      <React.Fragment key={index}>
                        {index > 0 ? ' \u00b7 ' : ''}
                        {part}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
                {onRestore && !item.current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw aria-hidden="true" />}
                    onClick={() => onRestore(item)}
                    disabled={busy}
                    aria-busy={busy || undefined}
                    aria-label={t.restoreAria(item.version)}
                  >
                    {busy ? t.restoring : t.restore}
                  </Button>
                ) : null}
                {onDownload ? (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t.downloadAria(item.version)} onClick={() => onDownload(item)}>
                    <Download aria-hidden="true" className="h-icon-sm w-icon-sm" />
                  </Button>
                ) : null}
              </li>
            );
          }
          return (
            <li
              key={item.id}
              aria-current={item.current ? 'true' : undefined}
              data-current={item.current || undefined}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-0 border-b border-solid border-hairline px-3 py-3 last:border-b-0',
                item.current && 'rounded-item bg-background-neutral-default [&_.text-text-subtle]:text-text-subtle-on-muted',
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="typography-ui-semibold">{t.version(item.version)}</b>
                  {item.current ? <Badge variant="info">{t.current}</Badge> : null}
                  {item.author ? <span className="typography-ui text-text-subtle">{t.by(item.author)}</span> : null}
                </div>
                <p className={cn('typography-ui m-0 mt-1', item.note ? 'text-text-default' : 'text-text-subtle')}>{item.note ?? t.noNote}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {date ? (
                  <time dateTime={date.toISOString()} className="typography-text-extra-small text-text-subtle">
                    {dateText(date)}
                  </time>
                ) : null}
                {onRestore && !item.current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw aria-hidden="true" />}
                    onClick={() => onRestore(item)}
                    disabled={busy}
                    aria-busy={busy || undefined}
                    aria-label={t.restoreAria(item.version)}
                  >
                    {busy ? t.restoring : t.restore}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  },
);
Versions.displayName = 'Versions';

export { Versions };
