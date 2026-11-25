'use client';

import { CheckCircle2, RotateCcw, Trash2, UploadCloud } from 'lucide-react';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { FileIcon } from './file-icon';
import { LoadingSpinner } from './loading-spinner';
import { Progress } from './progress';
import { useLabels, useLocale, usePreset, type DesignSystemLocale } from './labels-context';
import type { LabelProp } from './labels';

export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'title'> {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  name?: string;
  // Called with the chosen or dropped files. Without `multiple` only the first file is passed.
  onFilesSelected?: (files: File[]) => void;
  // Emphasised lead-in of the drop zone, for example "Click to upload". `titleText` is the string form of the same text.
  title?: React.ReactNode;
  titleText?: string;
  description?: React.ReactNode;
  descriptionText?: string;
  // Supporting text such as the accepted types and size limit.
  hint?: React.ReactNode;
  // Upload in progress: swaps the title for `loadingTitle` and announces it politely.
  loading?: boolean;
  loadingTitle?: React.ReactNode;
  loadingText?: string;
  // Validation message. Sets `aria-invalid` on the input and replaces the hint.
  error?: React.ReactNode;
  // `zone` (default) is the always visible drop zone. `overlay` shows nothing until a file is dragged over the page, then covers the nearest positioned ancestor with the drop target. Offer a button that calls `ref.current.click()` for keyboard users: the input is not tabbable in this mode.
  mode?: 'zone' | 'overlay';
  // External trigger: receives `open()`, which opens the file dialog, and renders before the zone. Use it for an "Upload" button elsewhere in a toolbar, and pair it with `mode="overlay"` for a drop-anywhere area. `open` does nothing while the field is disabled or loading.
  trigger?: (open: () => void) => React.ReactNode;
  // Queued files: render `FileUploadItem` elements.
  children?: React.ReactNode;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      accept,
      multiple = false,
      disabled = false,
      name,
      onFilesSelected,
      title: titleProp,
      titleText,
      description: descriptionProp,
      descriptionText,
      hint,
      loading = false,
      loadingTitle: loadingTitleProp,
      loadingText,
      error,
      mode = 'zone',
      trigger,
      children,
      id,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const title = titleProp ?? titleText ?? l.fileUploadTitle;
    const description = descriptionProp ?? descriptionText ?? l.fileUploadDescription;
    const loadingTitle = loadingTitleProp ?? loadingText ?? l.fileUploadLoading;
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );
    const open = () => {
      if (disabled || loading) return;
      innerRef.current?.click();
    };
    const autoId = React.useId();
    const inputId = id ?? `${autoId}-file`;
    const messageId = `${inputId}-message`;
    const titleId = `${inputId}-title`;
    const [dragging, setDragging] = React.useState(false);
    const overlay = mode === 'overlay';
    // The drop target fills with the brand tint while a file is over it (always in overlay mode), so its text switches to the on-tint roles.
    const tinted = (dragging || overlay) && !disabled;
    const [pageDragging, setPageDragging] = React.useState(false);
    // Overlay mode: watch the whole page for files being dragged, counting enter and leave pairs of nested elements.
    React.useEffect(() => {
      if (!overlay || disabled) return undefined;
      let depth = 0;
      const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
      const enter = (event: DragEvent) => {
        if (!hasFiles(event)) return;
        depth += 1;
        setPageDragging(true);
      };
      const leave = (event: DragEvent) => {
        if (!hasFiles(event)) return;
        depth = Math.max(0, depth - 1);
        if (depth === 0) setPageDragging(false);
      };
      const reset = () => {
        depth = 0;
        setPageDragging(false);
      };
      document.addEventListener('dragenter', enter);
      document.addEventListener('dragleave', leave);
      document.addEventListener('drop', reset);
      document.addEventListener('dragend', reset);
      return () => {
        document.removeEventListener('dragenter', enter);
        document.removeEventListener('dragleave', leave);
        document.removeEventListener('drop', reset);
        document.removeEventListener('dragend', reset);
      };
    }, [overlay, disabled]);
    const hasError = error != null && error !== false && error !== '';
    const message = hasError ? error : hint;

    const emit = (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list);
      onFilesSelected?.(multiple ? files : files.slice(0, 1));
    };

    return (
      <div className={cn(overlay ? 'contents' : 'flex w-full flex-col gap-3', className)} data-mode={mode} aria-busy={loading || undefined} {...props}>
        {trigger ? trigger(open) : null}
        <input
          ref={setRefs}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-labelledby={titleId}
          aria-describedby={message ? messageId : undefined}
          tabIndex={overlay ? -1 : undefined}
          className="peer sr-only"
          onChange={(event) => {
            emit(event.target.files);
            event.target.value = '';
          }}
        />
        <label
          htmlFor={inputId}
          data-dragging={dragging || undefined}
          data-invalid={hasError || undefined}
          data-disabled={disabled || undefined}
          data-loading={loading || undefined}
          onDragEnter={(event) => {
            if (disabled) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            setPageDragging(false);
            if (disabled) return;
            emit(event.dataTransfer?.files ?? null);
          }}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center gap-3 rounded-surface border border-solid text-center',
            // Zero: dashed drop zone on the muted fill (32/24 padding), the other themes keep the plain surface.
            zero ? 'border-dashed border-border-bold bg-muted px-6 py-8' : 'border-border-default bg-background px-6 py-4',
            'transition-[color,background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none',
            'hover:border-border-bold',
            'peer-focus-visible:border-border-focus peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/30',
            'data-[dragging=true]:border-border-brand data-[dragging=true]:bg-background-brand-subtle',
            'data-[invalid=true]:border-border-destructive',
            'data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-border-disabled data-[disabled=true]:bg-muted data-[disabled=true]:text-text-disabled',
            // Overlay: covers the positioned ancestor, only while a file is dragged over the page.
            overlay && 'absolute inset-0 z-raised justify-center border-dashed border-border-brand bg-background-brand-subtle',
            overlay && !pageDragging && 'hidden',
          )}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-icon-subtle"
          >
            <UploadCloud className="h-icon-sm w-icon-sm" />
          </span>
          <span className="flex flex-col items-center gap-1">
            <span className={cn('typography-ui', tinted ? 'text-general-brand-on-container' : zero ? 'text-text-subtle-on-muted' : 'text-text-subtle')}>
              <span id={titleId} className={cn('typography-ui-semibold', disabled ? 'text-text-disabled' : tinted || zero ? 'text-text-brand-on-subtle' : 'text-text-brand')}>
                {loading ? loadingTitle : title}
              </span>
              {loading ? null : <> {description}</>}
            </span>
            {message ? (
              <span
                id={messageId}
                // The error stays red on the muted zero drop zone; the on-subtle role (near white in zero dark) only while the zone is tinted for a drag.
                className={cn('typography-caption', hasError ? (tinted ? 'text-text-destructive-on-subtle' : 'text-text-destructive') : tinted ? 'text-general-brand-on-container' : zero ? 'text-text-subtle-on-muted' : 'text-text-subtle')}
              >
                {message}
              </span>
            ) : null}
          </span>
        </label>
        <span role="status" className="sr-only">
          {loading && typeof loadingTitle === 'string' ? loadingTitle : ''}
        </span>
        {children ? <ul className="flex flex-col gap-2">{children}</ul> : null}
      </div>
    );
  },
);
FileUpload.displayName = 'FileUpload';

export type FileUploadItemKind = 'document' | 'image' | 'video' | 'other';
export type FileUploadItemStatus = 'selected' | 'uploading' | 'complete' | 'error';


const formatBytes = (bytes: number, locale: DesignSystemLocale) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '');
  return `${locale === 'de' ? mb.replace('.', ',') : mb} MB`;
};

export interface FileUploadItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'children'> {
  name: string;
  // Bytes (formatted for you) or a ready string such as "4.2 MB".
  size?: number | string;
  // Overrides the file type shown in the tile. Without it the type comes from the file name extension.
  kind?: FileUploadItemKind;
  status?: FileUploadItemStatus;
  // Upload progress 0..100 while `status` is uploading.
  progress?: number;
  // `bar` shows a progress bar under the name, `fill` tints the row from the left and shows a spinner.
  variant?: 'bar' | 'fill';
  // Message shown instead of the size while `status` is error.
  error?: React.ReactNode;
  onRemove?: () => void;
  onRetry?: () => void;
  // Accessible names, a string or a function of the file name. Win over the provider text.
  removeLabel?: LabelProp<[string | undefined]>;
  retryLabel?: LabelProp<[string]>;
  uploadingLabel?: LabelProp<[string]>;
  completeLabel?: string;
  // Visible texts. Win over the provider text.
  errorText?: string;
  uploadedText?: LabelProp<[number]>;
  // Visible text for the `selected` status (chosen, not uploaded yet). Wins over the provider text.
  notUploadedText?: string;
}

const FileUploadItem = React.forwardRef<HTMLLIElement, FileUploadItemProps>(
  (
    {
      className,
      name,
      size,
      kind,
      status = 'uploading',
      progress = 0,
      variant = 'bar',
      error,
      onRemove,
      onRetry,
      removeLabel,
      retryLabel,
      uploadingLabel,
      completeLabel,
      errorText,
      uploadedText,
      notUploadedText,
      ...props
    },
    ref,
  ) => {
    const l = useLabels({
      remove: removeLabel,
      retryItem: retryLabel,
      uploading: uploadingLabel,
      uploadComplete: completeLabel,
      uploadFailed: errorText,
      uploadedPercent: uploadedText,
      fileNotUploaded: notUploadedText,
    });
    const locale = useLocale();
    const zero = usePreset() === 'zero';
    const percent = Math.round(Math.min(Math.max(progress, 0), 100));
    const sizeText = typeof size === 'number' ? formatBytes(size, locale) : size;
    const uploading = status === 'uploading';
    const meta =
      status === 'error'
        ? (error ?? l.uploadFailed)
        : status === 'selected'
          ? [sizeText, l.fileNotUploaded].filter(Boolean).join(' - ')
            : [sizeText, variant === 'fill' && uploading ? l.uploadedPercent(percent) : null].filter(Boolean).join(' - ');
    const actionClass = cn(
      'inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-item text-icon-subtle transition-colors hover:bg-muted hover:text-icon-default',
      focusRing,
    );

    return (
      <li
        ref={ref}
        data-status={status}
        data-variant={variant}
        className={cn(
          // The icon is centred on the name and meta row; the progress comes before the actions in the DOM (reading order) and sits below the text.
          'relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 overflow-hidden rounded-surface border border-solid bg-background',
          zero ? 'px-4 py-3' : 'p-4',
          status === 'error' ? 'border-border-destructive' : 'border-border-default',
          className,
        )}
        {...props}
      >
        {variant === 'fill' && uploading ? (
          <span
            role="progressbar"
            aria-label={l.uploading(name)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            data-progress-fill=""
            style={{ width: `${percent}%` }}
            className="absolute inset-y-0 left-0 bg-muted transition-[width] duration-150 motion-reduce:transition-none"
          />
        ) : null}
        <FileIcon name={name} kind={kind} error={status === 'error'} size="xs" className="relative" />
        <div className="relative flex min-w-0 flex-col gap-1">
          <span className="truncate typography-ui-medium text-foreground" title={name}>
            {name}
          </span>
          <span className={cn('typography-caption', status === 'error' ? 'text-text-destructive' : variant === 'fill' && uploading ? 'text-text-subtle-on-muted' : 'text-text-subtle')}>{meta}</span>
          {status === 'complete' ? <span className="sr-only">{l.uploadComplete}</span> : null}
        </div>
        {variant === 'bar' && status !== 'error' && status !== 'selected' ? (
          <div data-upload-progress="" className="relative col-start-2 row-start-2 flex items-center gap-3">
            <Progress
              aria-label={l.uploading(name)}
              value={status === 'complete' ? 100 : percent}
              className="flex-1"
            />
            <span className="typography-caption w-8 shrink-0 text-right tabular-nums text-text-subtle">
              {status === 'complete' ? 100 : percent}%
            </span>
          </div>
        ) : null}
        <div className="relative flex shrink-0 items-center gap-1">
          {variant === 'fill' && uploading ? <LoadingSpinner size="sm" label={l.uploading(name)} /> : null}
          {status === 'complete' ? <CheckCircle2 aria-hidden="true" className="h-icon-sm w-icon-sm text-icon-brand" /> : null}
          {status === 'error' && onRetry ? (
            <button type="button" className={actionClass} aria-label={l.retryItem(name)} onClick={onRetry}>
              <RotateCcw aria-hidden="true" className="h-icon-xs w-icon-xs" />
            </button>
          ) : null}
          {onRemove ? (
            <button type="button" className={actionClass} aria-label={l.remove(name)} onClick={onRemove}>
              <Trash2 aria-hidden="true" className="h-icon-xs w-icon-xs" />
            </button>
          ) : null}
        </div>
      </li>
    );
  },
);
FileUploadItem.displayName = 'FileUploadItem';

export { FileUpload, FileUploadItem };
