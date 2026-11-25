import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';

import { FileIcon, type FileIconProps } from './file-icon';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'data-display-file-icon',
  title: 'Patterns · Data/File icon',
  component: FileIcon,
  tags: ['autodocs'],
  args: { name: 'contract.pdf', size: 'md' },
  argTypes: { size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof FileIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Kinds: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {['report.pdf', 'letter.docx', 'budget.xlsx', 'deck.pptx', 'photo.png', 'clip.mp4', 'bundle.zip', 'app.ts', 'notes.xyz'].map((name) => (
        <FileIcon key={name} name={name} size="lg" />
      ))}
      <FileIcon kind="folder" size="lg" />
    </div>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <FileIcon ext="pdf" size="sm" />
      <FileIcon ext="pdf" size="md" />
      <FileIcon ext="pdf" size="lg" />
    </div>
  ),
};
export const FourCharExtensions: Story = {
  parameters: { docs: { description: { story: 'Four character extensions such as DOCX, XLSX and PPTX fit the label at md and lg without truncating.' } } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {['docx', 'xlsx', 'pptx', 'webm'].map((ext) => (
        <FileIcon key={`md-${ext}`} ext={ext} size="md" />
      ))}
      {['docx', 'xlsx', 'pptx', 'webm'].map((ext) => (
        <FileIcon key={`lg-${ext}`} ext={ext} size="lg" />
      ))}
    </div>
  ),
};
export const UploadFailed: Story = { args: { error: true, decorative: false } };

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

// The document variant (Figma File icon Variant=Document, prototype k-file-icon): sheet with the glyph and the extension tag under it as one centred group.
export const DocumentVariant: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {['report.pdf', 'budget.xlsx', 'pitch.pptx', 'photo.png', 'demo.mp4', 'backup.zip', 'config.json', 'notes.fig'].map((file) => (
        <FileIcon key={file} name={file} variant="document" />
      ))}
      <FileIcon name="report.pdf" variant="document" error />
    </div>
  ),
};

// Every kind once: folder, the common file types and a name without an extension.
const centeringFiles: Array<Pick<FileIconProps, 'name' | 'kind'>> = [
  { kind: 'folder' },
  { name: 'photo.png' },
  { name: 'report.pdf' },
  { name: 'letter.docx' },
  { name: 'budget.xlsx' },
  { name: 'deck.pptx' },
  { name: 'demo.webm' },
  { name: 'clip.mp4' },
  { name: 'bundle.zip' },
  { name: 'app.ts' },
  { name: 'README' },
  { name: 'notes.markdown' },
  // Wide unknown extensions: the tag stays inside the tile and may be clipped.
  { name: 'file.mmmm' },
  { name: 'file.WWWW' },
];
// Known four character extensions are never clipped.
const uncut = ['docx', 'xlsx', 'pptx', 'webm'];
const centeringVariants: Array<Pick<FileIconProps, 'variant' | 'size'>> = [
  { variant: 'document' },
  { variant: 'tile', size: 'xs' },
  { variant: 'tile', size: 'sm' },
  { variant: 'tile', size: 'md' },
  { variant: 'tile', size: 'lg' },
  { variant: 'bare', size: 'md' },
];
const fileLabel = (file: Pick<FileIconProps, 'name' | 'kind'>) => file.name ?? file.kind ?? '';

// The font shorthand can be empty (for example with tabular-nums), so the font is built from its parts.
const loadFontOf = (el: HTMLElement) => {
  const c = getComputedStyle(el);
  return document.fonts.load(`${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`, el.textContent || undefined);
};

// fonts.ready can resolve before a font has started loading; load the font of every measured text first, so the fallback font never decides a width.
const loadFonts = async (root: HTMLElement) => {
  await Promise.all([...root.querySelectorAll<HTMLElement>('b, span')].map(loadFontOf));
  await document.fonts.ready;
};

// G1: without a tag the glyph centre is the tile centre; with a tag glyph and tag form one group in the tile centre, the glyph horizontally centred (1px).
// G2/G3: the tag lies inside the tile, horizontally centred, 2px under the glyph without overlap, and its text is not cut.
const checkIcons = (root: HTMLElement) => {
  const icons = [...root.querySelectorAll<HTMLElement>('[data-kind]')];
  expect(icons.length).toBeGreaterThan(0);
  const centre = (r: { left: number; top: number; width: number; height: number }) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  for (const icon of icons) {
    const tile = icon.getBoundingClientRect();
    const glyph = (icon.querySelector('svg') as SVGElement).getBoundingClientRect();
    const tag = icon.querySelector('b');
    const shown = tag && getComputedStyle(tag).display !== 'none' ? tag : null;
    expect(Math.abs(centre(glyph).x - centre(tile).x)).toBeLessThanOrEqual(1);
    if (!shown) {
      expect(Math.abs(centre(glyph).y - centre(tile).y)).toBeLessThanOrEqual(1);
      continue;
    }
    const box = shown.getBoundingClientRect();
    const top = Math.min(glyph.top, box.top);
    const left = Math.min(glyph.left, box.left);
    const group = { left, top, width: Math.max(glyph.right, box.right) - left, height: Math.max(glyph.bottom, box.bottom) - top };
    expect(Math.abs(centre(group).x - centre(tile).x)).toBeLessThanOrEqual(1);
    expect(Math.abs(centre(group).y - centre(tile).y)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.top - glyph.bottom - 2)).toBeLessThanOrEqual(1);
    expect(box.left).toBeGreaterThanOrEqual(tile.left);
    expect(box.right).toBeLessThanOrEqual(tile.right);
    expect(box.top).toBeGreaterThanOrEqual(tile.top);
    expect(box.bottom).toBeLessThanOrEqual(tile.bottom);
    expect(Math.abs(centre(box).x - centre(tile).x)).toBeLessThanOrEqual(1);
    if (uncut.includes((shown.textContent ?? '').toLowerCase())) expect(shown.scrollWidth).toBeLessThanOrEqual(shown.clientWidth);
  }
};

// G4: in a row the tile is vertically centred on the text next to it; in a preview box the icon sits in the middle of the box.
const checkPlacement = (root: HTMLElement) => {
  for (const row of root.querySelectorAll<HTMLElement>('[data-centering-row]')) {
    const icon = (row.querySelector('[data-kind]') as HTMLElement).getBoundingClientRect();
    const text = (row.querySelector('[data-centering-text]') as HTMLElement).getBoundingClientRect();
    expect(Math.abs(icon.top + icon.height / 2 - (text.top + text.height / 2))).toBeLessThanOrEqual(1);
  }
  for (const box of root.querySelectorAll<HTMLElement>('[data-centering-box]')) {
    const area = box.getBoundingClientRect();
    const icon = (box.querySelector('[data-kind]') as HTMLElement).getBoundingClientRect();
    expect(Math.abs(icon.left + icon.width / 2 - (area.left + area.width / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(icon.top + icon.height / 2 - (area.top + area.height / 2))).toBeLessThanOrEqual(1);
  }
};

const CenteringGrid = ({ preset }: { preset?: boolean }) => (
  <div className="flex flex-col gap-6">
    <table className="border-separate border-spacing-2">
      <tbody>
        {centeringFiles.map((file) => (
          <tr key={fileLabel(file)}>
            <th scope="row" className="typography-caption text-left text-text-subtle">
              {fileLabel(file)}
            </th>
            {(preset ? [{}, ...centeringVariants] : centeringVariants).map((variant) => (
              <td key={`${variant.variant}-${variant.size}`}>
                <div className="flex items-center gap-2">
                  <FileIcon {...file} {...variant} />
                  <FileIcon {...file} {...variant} error />
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <ul className="flex max-w-md flex-col gap-2">
      <li data-centering-row="" className="flex items-center gap-3">
        <FileIcon kind="folder" />
        <span data-centering-text="" className="flex min-w-0 flex-col">
          <span className="typography-ui-medium truncate text-text-default">Concepts</span>
          <span className="typography-caption text-text-subtle">8 files</span>
        </span>
      </li>
      <li data-centering-row="" className="flex items-center gap-3">
        <FileIcon name="Workshop whiteboard.png" />
        <span data-centering-text="" className="flex min-w-0 flex-col">
          <span className="typography-ui-medium truncate text-text-default">Workshop whiteboard.png</span>
          <span className="typography-caption text-text-subtle">3.6 MB</span>
        </span>
      </li>
    </ul>
    <div className="flex flex-wrap gap-3">
      {[{ kind: 'folder' as const }, { name: 'photo.png' }, { name: 'report.pdf' }].map((file) => (
        <div key={fileLabel(file)} data-centering-box="" className="flex h-24 w-32 items-center justify-center rounded-card bg-muted">
          <FileIcon {...file} size="lg" />
        </div>
      ))}
    </div>
  </div>
);

// Geometry check (ZERO-812): glyph, or glyph and tag as a group, in the centre of every tile, tag inside, centred, without overlap and uncut, tiles centred on their row and preview box. Kinds by variant and size, with and without a tag, in the error state. Upload rows and message attachments: FileUpload With Queue Bar and With Queue Fill, Message With Attachment.
export const Centering: Story = {
  render: () => <CenteringGrid />,
  play: async ({ canvasElement }) => {
    await loadFonts(canvasElement);
    checkIcons(canvasElement);
    checkPlacement(canvasElement);
  },
};

// Same check in the zero preset: its default (document variant) first, then every variant.
export const CenteringZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
  render: () => <CenteringGrid preset />,
  play: Centering.play,
};
