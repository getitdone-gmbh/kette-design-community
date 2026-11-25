import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { contrast, loadThemes } from '../../lib/token-contrast';
import { FileIcon, fileExtensionOf, fileKindOf, type FileKind } from './file-icon';

describe('file helpers', () => {
  it('derives extension and kind', () => {
    expect(fileExtensionOf('report.final.PDF')).toBe('pdf');
    expect(fileExtensionOf('README')).toBe('');
    expect(fileKindOf('xlsx')).toBe('spreadsheet');
    expect(fileKindOf('.png')).toBe('image');
    expect(fileKindOf('unknown')).toBe('other');
  });
});

describe('FileIcon', () => {
  it('uses the data-file tokens for the kind and shows the extension', () => {
    const { container } = render(<FileIcon name="slides.pptx" />);
    const icon = container.firstElementChild as HTMLElement;
    expect(icon).toHaveAttribute('data-kind', 'presentation');
    expect(icon).toHaveClass('bg-data-file-slide-subtle', 'text-data-file-slide-on');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('pptx')).toBeInTheDocument();
  });

  it('sizes the extension label with the smallest typography roles and keeps four characters', () => {
    const { rerender } = render(<FileIcon ext="docx" size="md" />);
    expect(screen.getByText('docx')).toHaveClass('typography-avatar-xs');
    expect(screen.getByText('docx').className).not.toMatch(/text-\[/);
    rerender(<FileIcon ext="docx" size="lg" />);
    expect(screen.getByText('docx')).toHaveClass('typography-micro');
    rerender(<FileIcon ext="markdown" size="lg" />);
    expect(screen.getByText('mark')).toBeInTheDocument();
  });

  it('gives pdf its own colour', () => {
    const { container } = render(<FileIcon ext="pdf" />);
    expect(container.firstElementChild).toHaveClass('bg-data-file-pdf-subtle');
  });

  it('exposes a name when not decorative, including the error state', () => {
    render(<FileIcon ext="zip" decorative={false} error />);
    expect(screen.getByRole('img', { name: 'Archive ZIP, Upload failed' })).toHaveAttribute('data-error', 'true');
  });

  it('hides the extension label at size sm', () => {
    render(<FileIcon ext="csv" size="sm" />);
    expect(screen.getByText('csv')).toHaveClass('hidden');
  });
});

describe('FileIcon lg size (0.13.2)', () => {
  it('lg is a 56px tile with a 24px glyph like the zero tile', () => {
    const { container } = render(<FileIcon ext="docx" size="lg" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveClass('h-14', 'w-14');
    expect(tile.querySelector('svg')).toHaveClass('h-icon-lg', 'w-icon-lg');
  });
});

describe('FileIcon folder kind (0.15)', () => {
  it('renders the folder glyph on the generic tokens without an extension label', () => {
    const { container } = render(<FileIcon kind="folder" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute('data-kind', 'folder');
    expect(tile).toHaveClass('bg-data-file-generic-subtle', 'text-data-file-generic-on');
    expect(tile.querySelector('b')).toBeNull();
    expect(tile.querySelector('svg')).toHaveClass('lucide-folder');
  });

  it('exposes the localized folder name when not decorative', () => {
    render(<FileIcon kind="folder" decorative={false} />);
    expect(screen.getByRole('img', { name: 'Folder' })).toBeInTheDocument();
  });
});

describe('FileIcon document variant tag (0.26.10)', () => {
  it('uses the file-tag typography role (uppercase comes from the role)', () => {
    render(<FileIcon ext="pdf" variant="document" />);
    const tag = screen.getByText('pdf');
    expect(tag).toHaveClass('typography-file-tag');
    expect(tag).not.toHaveClass('uppercase');
  });

  it('fills every tag with the default role and its on-default text', () => {
    const { rerender } = render(<FileIcon ext="png" variant="document" />);
    expect(screen.getByText('png')).toHaveClass('bg-data-file-image-default', 'text-data-file-image-on-default');
    rerender(<FileIcon ext="mp4" variant="document" />);
    expect(screen.getByText('mp4')).toHaveClass('bg-data-file-video-default', 'text-data-file-video-on-default');
    rerender(<FileIcon ext="pdf" variant="document" />);
    expect(screen.getByText('pdf')).toHaveClass('bg-data-file-pdf-default', 'text-data-file-pdf-on-default');
  });

  it('keeps 4.5:1 for every tag pair in every theme and mode', () => {
    for (const theme of loadThemes()) {
      for (const mode of ['light', 'dark'] as const) {
        const t = theme[mode];
        for (const type of ['archive', 'code', 'doc', 'generic', 'image', 'pdf', 'sheet', 'slide', 'video']) {
          expect(contrast(t[`data-file-${type}-on-default`], t[`data-file-${type}-default`])).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('keeps the destructive tag in the error state', () => {
    render(<FileIcon ext="pdf" variant="document" error />);
    expect(screen.getByText('pdf')).toHaveClass('bg-background-destructive-bold-default');
  });
});

describe('FileIcon kinds as used by FileUploadItem and MessageAttachment', () => {
  it.each<[string, FileKind]>([
    ['photo.png', 'image'],
    ['clip.mp4', 'video'],
    ['notes.xyz', 'other'],
  ])('derives the kind of %s', (name, kind) => {
    const { container } = render(<FileIcon name={name} />);
    expect(container.firstElementChild).toHaveAttribute('data-kind', kind);
  });
});

describe('FileIcon centering (0.45.1, ZERO-812)', () => {
  it('stacks glyph and tag of the document sheet as one centred group with a 2px gap', () => {
    const { container } = render(<FileIcon ext="pdf" variant="document" />);
    const sheet = container.firstElementChild as HTMLElement;
    expect(sheet).toHaveClass('flex-col', 'items-center', 'justify-center', 'gap-micro');
    expect(sheet).not.toHaveClass('items-start');
    expect(sheet).not.toHaveClass('pt-1');
  });

  it('keeps the document tag in the flow under the glyph, inside the sheet, without overlap or ring', () => {
    render(<FileIcon ext="pdf" variant="document" />);
    const tag = screen.getByText('pdf');
    expect(tag).toHaveClass('max-w-[theme(spacing.7)]', '-mx-px', 'overflow-hidden', 'whitespace-nowrap', 'px-micro');
    expect(tag).not.toHaveClass('max-w-7');
    expect(tag).not.toHaveClass('absolute');
    expect(tag).not.toHaveClass('-left-1');
    expect(tag).not.toHaveClass('ring-1');
  });

  it('gives four character tags the smaller inner padding so they stay readable', () => {
    render(<FileIcon ext="docx" variant="document" />);
    const tag = screen.getByText('docx');
    expect(tag).toHaveClass('px-px');
    expect(tag).not.toHaveClass('px-micro');
  });

  it('keeps the same tag placement in the error state', () => {
    const { container } = render(<FileIcon ext="pdf" variant="document" error />);
    expect(container.firstElementChild).toHaveClass('flex-col', 'gap-micro');
    expect(screen.getByText('pdf')).toHaveClass('max-w-[theme(spacing.7)]', '-mx-px');
  });

  it.each(['md', 'lg'] as const)('stacks glyph and label of the %s tile as one centred group with a 2px gap', (size) => {
    const { container } = render(<FileIcon ext="docx" size={size} />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveClass('flex-col', 'items-center', 'justify-center', 'gap-micro');
    const label = screen.getByText('docx');
    expect(label).toHaveClass('max-w-full', 'truncate');
    expect(label).not.toHaveClass('absolute');
  });

  it.each(['md', 'lg'] as const)('gives four character tile labels at %s the smaller padding so WEBM fits the 40px zero tile', (size) => {
    const { rerender } = render(<FileIcon ext="webm" size={size} />);
    expect(screen.getByText('webm')).toHaveClass('px-px');
    expect(screen.getByText('webm')).not.toHaveClass('px-1');
    rerender(<FileIcon ext="pdf" size={size} />);
    expect(screen.getByText('pdf')).toHaveClass('px-1');
  });

  it('centres a folder without a label on its own', () => {
    const { container } = render(<FileIcon kind="folder" variant="document" />);
    const sheet = container.firstElementChild as HTMLElement;
    expect(sheet).toHaveClass('items-center', 'justify-center');
    expect(sheet.querySelector('b')).toBeNull();
  });
});
