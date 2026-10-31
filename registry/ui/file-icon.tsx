'use client';

import { File, FileArchive, FileCode, FileSpreadsheet, FileText, FileVideo, Folder, Image as ImageIcon, Presentation, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { useLabels, usePreset } from '@/components/ui/labels-context';

export type FileKind = 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'archive' | 'code' | 'folder' | 'other';

const EXTENSION_KIND: Record<string, FileKind> = {
  pdf: 'document', doc: 'document', docx: 'document', txt: 'document', md: 'document', rtf: 'document', odt: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', ods: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', key: 'presentation', odp: 'presentation',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', heic: 'image',
  mp4: 'video', mov: 'video', webm: 'video', avi: 'video', mkv: 'video',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', json: 'code', html: 'code', css: 'code', py: 'code', xml: 'code',
};

// Extension without dot, lower case. Empty when the name has none.
export const fileExtensionOf = (name: string) => {
  const index = name.lastIndexOf('.');
  return index > 0 && index < name.length - 1 ? name.slice(index + 1).toLowerCase() : '';
};

export const fileKindOf = (extension: string): FileKind => EXTENSION_KIND[extension.toLowerCase().replace(/^\./, '')] ?? 'other';

const kindStyle: Record<FileKind, { icon: LucideIcon; tile: string }> = {
  document: { icon: FileText, tile: 'bg-data-file-doc-subtle text-data-file-doc-on' },
  spreadsheet: { icon: FileSpreadsheet, tile: 'bg-data-file-sheet-subtle text-data-file-sheet-on' },
  presentation: { icon: Presentation, tile: 'bg-data-file-slide-subtle text-data-file-slide-on' },
  image: { icon: ImageIcon, tile: 'bg-data-file-image-subtle text-data-file-image-on' },
  video: { icon: FileVideo, tile: 'bg-data-file-video-subtle text-data-file-video-on' },
  archive: { icon: FileArchive, tile: 'bg-data-file-archive-subtle text-data-file-archive-on' },
  code: { icon: FileCode, tile: 'bg-data-file-code-subtle text-data-file-code-on' },
  // Folders have no generic-file extension; they reuse the neutral generic tokens with the folder glyph.
  folder: { icon: Folder, tile: 'bg-data-file-generic-subtle text-data-file-generic-on' },
  other: { icon: File, tile: 'bg-data-file-generic-subtle text-data-file-generic-on' },
};
// PDF has its own colour within the document kind.
const pdfTile = 'bg-data-file-pdf-subtle text-data-file-pdf-on';

// Document variant: the extension tag is a solid fill (`colors.data.file.<type>.default`) with the matching `on-default` text, in light and dark (tokens 5.8).
const documentTag: Record<FileKind, string> = {
  document: 'bg-data-file-doc-default text-data-file-doc-on-default',
  spreadsheet: 'bg-data-file-sheet-default text-data-file-sheet-on-default',
  presentation: 'bg-data-file-slide-default text-data-file-slide-on-default',
  image: 'bg-data-file-image-default text-data-file-image-on-default',
  video: 'bg-data-file-video-default text-data-file-video-on-default',
  archive: 'bg-data-file-archive-default text-data-file-archive-on-default',
  code: 'bg-data-file-code-default text-data-file-code-on-default',
  folder: 'bg-data-file-generic-default text-data-file-generic-on-default',
  other: 'bg-data-file-generic-default text-data-file-generic-on-default',
};
// Static strings so Tailwind finds the classes.
const pdfTag = 'bg-data-file-pdf-default text-data-file-pdf-on-default';

const sizeStyle = {
  xs: { box: 'h-8 w-8 rounded-item', icon: 'h-icon-sm w-icon-sm', label: 'hidden' },
  sm: { box: 'h-control-md w-control-md rounded-item', icon: 'h-icon-sm w-icon-sm', label: 'hidden' },
  md: { box: 'h-control-xl w-control-xl rounded-item', icon: 'h-icon-sm w-icon-sm', label: 'typography-avatar-xs' },
  lg: { box: 'h-14 w-14 rounded-surface', icon: 'h-icon-lg w-icon-lg', label: 'typography-micro font-semibold' },
} as const;

export interface FileIconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  // Extension without dot. Shown as label and used to pick the type.
  ext?: string;
  // File name. The extension is taken from it when `ext` is missing.
  name?: string;
  // Overrides the type derived from the extension.
  kind?: FileKind;
  size?: keyof typeof sizeStyle;
  // `tile` is the tinted square (`size` xs is the 32px tile, sm 40, md 48 in neutral). `document` is the page outline with a filled extension tag (28 by 32, `size` is ignored). `bare` is the type glyph in the kind colour without a box or label (`size` sets the glyph size). Defaults to `document` in the zero preset, otherwise `tile`.
  variant?: 'tile' | 'document' | 'bare';
  // Failed upload: destructive border and tint.
  error?: boolean;
  // Decorative by default because the file name carries the meaning. Set false to expose "Document PDF" as an image.
  decorative?: boolean;
}

// File type tile built on the data-file tokens (AA in light and dark).
const FileIcon = React.forwardRef<HTMLSpanElement, FileIconProps>(
  ({ className, ext, name, kind, size = 'md', variant: variantProp, error = false, decorative = true, ...props }, ref) => {
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const variant = variantProp ?? (zero ? 'document' : 'tile');
    const extension = (ext ?? (name ? fileExtensionOf(name) : '')).toLowerCase().replace(/^\./, '');
    const resolved = kind ?? fileKindOf(extension);
    const { icon: Glyph, tile: kindTile } = kindStyle[resolved];
    const tile = extension === 'pdf' ? pdfTile : kindTile;
    const s = sizeStyle[size];
    const accessibleName = `${l.fileKind(resolved)}${extension ? ` ${extension.toUpperCase()}` : ''}${error ? `, ${l.uploadFailed}` : ''}`;
    if (variant === 'bare') {
      const textClass = tile.split(' ').find((c) => c.startsWith('text-'));
      return (
        <span
          ref={ref}
          data-kind={resolved}
          data-variant="bare"
          data-error={error || undefined}
          {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': accessibleName })}
          className={cn('inline-flex shrink-0 items-center justify-center', error ? 'text-text-destructive' : textClass, className)}
          {...props}
        >
          <Glyph aria-hidden="true" className={s.icon} />
        </span>
      );
    }
    if (variant === 'document') {
      return (
        <span
          ref={ref}
          data-kind={resolved}
          data-variant="document"
          data-error={error || undefined}
          {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': accessibleName })}
          className={cn(
            'relative inline-flex h-8 w-7 shrink-0 items-start justify-center pt-1 rounded-tight rounded-tr-control border border-solid bg-background-default text-icon-subtle',
            error ? 'border-border-destructive text-text-destructive' : 'border-input',
            className,
          )}
          {...props}
        >
          <Glyph aria-hidden="true" className="h-icon-2xs w-icon-2xs" />
          {extension ? (
            <b
              className={cn(
                'typography-file-tag absolute -left-1 bottom-1 max-w-8 truncate rounded-hairline px-micro',
                error ? 'bg-background-destructive-bold-default text-text-on-destructive' : extension === 'pdf' ? pdfTag : documentTag[resolved],
              )}
            >
              {extension.slice(0, 4)}
            </b>
          ) : null}
        </span>
      );
    }
    return (
      <span
        ref={ref}
        data-kind={resolved}
        data-error={error || undefined}
        {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': accessibleName })}
        className={cn(
          'inline-flex shrink-0 flex-col items-center justify-center border border-solid',
          error ? 'border-border-destructive bg-background-destructive-subtle text-text-destructive-on-subtle' : cn('border-hairline', tile),
          s.box,
          className,
        )}
        {...props}
      >
        <Glyph aria-hidden="true" className={s.icon} />
        {extension ? <b className={cn('max-w-full truncate px-1 uppercase', s.label)}>{extension.slice(0, 4)}</b> : null}
      </span>
    );
  },
);
FileIcon.displayName = 'FileIcon';

export { FileIcon };
