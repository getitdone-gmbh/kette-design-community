import type { Meta, StoryObj } from '@storybook/react';

import { FileIcon } from './file-icon';
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

// The document variant (Figma File icon Variant=Document, prototype k-file-icon): sheet, glyph on top, extension tag across the lower left edge.
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
