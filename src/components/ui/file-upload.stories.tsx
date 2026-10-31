import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { Button } from './button';
import { FileUpload, FileUploadItem } from './file-upload';

const meta = {
  id: 'primitives-fileupload',
  title: 'Primitives · Inputs/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  // onFilesSelected is a data callback, not a rendering switch, so the default action arg is fine.
  args: { hint: 'SVG, PNG, JPG or GIF (max. 800x400px)' },
  argTypes: {
    titleText: { control: { type: 'text' }, description: 'String form of `title`. Wins over the provider text.' },
    descriptionText: { control: { type: 'text' }, description: 'String form of `description`. Wins over the provider text.' },
    loadingText: { control: { type: 'text' }, description: 'String form of `loadingTitle`. Wins over the provider text.' },
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = {
  name: 'Error',
  args: { error: 'File type not supported. Allowed: PDF, DOCX (max. 10 MB).' },
};
export const Loading: Story = { args: { loading: true, loadingTitle: 'Uploading 2 files...' } };

export const WithQueueBar: Story = {
  args: { multiple: true },
  render: (args) => (
    <FileUpload {...args}>
      <FileUploadItem name="Tech design requirements.pdf" size={204800} status="complete" onRemove={() => {}} />
      <FileUploadItem name="Dashboard recording.mp4" kind="video" size="16 MB" progress={40} onRemove={() => {}} />
      <FileUploadItem
        name="Dashboard prototype FINAL.fig"
        kind="other"
        size="4.2 MB"
        progress={80}
        onRemove={() => {}}
      />
      <FileUploadItem
        name="Invoice.pdf"
        status="error"
        error="Upload failed. File is too large."
        onRetry={() => {}}
        onRemove={() => {}}
      />
    </FileUpload>
  ),
};

export const WithQueueFill: Story = {
  args: { multiple: true, loading: true, loadingTitle: 'Uploading 3 files...' },
  render: (args) => (
    <FileUpload {...args}>
      {[0, 1, 2].map((index) => (
        <FileUploadItem
          key={index}
          name={`Dashboard prototype ${index + 1}.fig`}
          kind="other"
          variant="fill"
          size="4.2 MB"
          progress={70}
        />
      ))}
    </FileUpload>
  ),
};

export const Interactive: Story = {
  render: function Render() {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <FileUpload multiple onFilesSelected={(next) => setFiles((current) => [...current, ...next])}>
        {files.map((file) => (
          <FileUploadItem
            key={file.name}
            name={file.name}
            size={file.size}
            status="complete"
            onRemove={() => setFiles((current) => current.filter((entry) => entry !== file))}
          />
        ))}
      </FileUpload>
    );
  },
};

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de`. `FileUploadItem` takes `errorText`, `removeLabel` and `retryLabel` (string or function of the file name), `uploadingLabel`, `completeLabel` and `uploadedText`.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <FileUpload hint="PDF oder PNG, maximal 5 MB">
        <FileUploadItem name="lebenslauf.pdf" status="error" onRetry={() => {}} onRemove={() => {}} />
        <FileUploadItem name="foto.png" status="error" errorText="Datei zu groß" onRemove={() => {}} removeLabel={(name) => `${name} aus der Warteschlange nehmen`} />
      </FileUpload>
    </DesignSystemProvider>
  ),
};

export const SelectedNotUploaded: Story = {
  render: (args) => (
    <FileUpload {...args} multiple>
      <FileUploadItem name="Contract.pdf" size={204800} status="selected" onRemove={() => {}} />
      <FileUploadItem name="Contract.pdf" size={204800} status="selected" variant="fill" onRemove={() => {}} />
    </FileUpload>
  ),
};

// An Upload button elsewhere opens the file dialog through the `trigger` render prop.
export const ExternalTrigger: Story = {
  render: (args) => (
    <div className="relative flex min-h-64 flex-col gap-3 rounded-surface border border-solid border-border-default p-6">
      <FileUpload
        {...args}
        mode="overlay"
        multiple
        trigger={(open) => (
          <Button type="button" variant="outline" size="control-md" className="self-start" onClick={open}>
            Upload files
          </Button>
        )}
      />
      <p className="typography-ui text-text-subtle">Use the button or drag files over this card.</p>
    </div>
  ),
};

export const OverlayOnDrag: Story = {
  parameters: { docs: { description: { story: 'Nothing is shown until a file is dragged over the page, then the drop target covers the positioned parent.' } } },
  render: (args) => (
    <div className="relative min-h-64 rounded-surface border border-solid border-border-default p-6">
      <p className="typography-ui">Drag a file over this page.</p>
      <FileUpload {...args} mode="overlay" multiple />
    </div>
  ),
};
