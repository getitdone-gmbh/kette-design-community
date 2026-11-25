import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { FileUpload, FileUploadItem } from './file-upload';

const file = (name: string) => new File(['x'], name, { type: 'text/plain' });

describe('FileUpload', () => {
  it('renders a labelled file input with the title, description and hint', () => {
    render(<FileUpload hint="SVG, PNG or JPG" />);
    expect(screen.getByLabelText(/Click to upload/)).toHaveAttribute('type', 'file');
    expect(screen.getByText('or drag and drop', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('SVG, PNG or JPG')).toBeInTheDocument();
  });

  it('reports chosen files and only the first without multiple', async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    const { rerender } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    await user.upload(screen.getByLabelText(/Click to upload/), [file('a.txt'), file('b.txt')]);
    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.txt']);
    rerender(<FileUpload multiple onFilesSelected={onFilesSelected} />);
    await user.upload(screen.getByLabelText(/Click to upload/), [file('a.txt'), file('b.txt')]);
    expect(onFilesSelected.mock.calls[1][0]).toHaveLength(2);
  });

  it('accepts dropped files and shows the dragging state', () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload multiple onFilesSelected={onFilesSelected} />);
    const zone = screen.getByText('or drag and drop', { exact: false }).closest('label') as HTMLElement;
    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute('data-dragging', 'true');
    fireEvent.drop(zone, { dataTransfer: { files: [file('x.txt')] } });
    expect(zone).not.toHaveAttribute('data-dragging');
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: 'x.txt' })]);
  });

  it('ignores drops while disabled', () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload disabled onFilesSelected={onFilesSelected} />);
    const zone = screen.getByText('or drag and drop', { exact: false }).closest('label') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [file('x.txt')] } });
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Click to upload/)).toBeDisabled();
    expect(zone).toHaveAttribute('data-disabled', 'true');
  });

  it('is keyboard focusable through the input and shows the focus ring classes on the zone', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    await user.tab();
    expect(screen.getByLabelText(/Click to upload/)).toHaveFocus();
    const zone = screen.getByText('or drag and drop', { exact: false }).closest('label');
    expect(zone).toHaveClass('peer-focus-visible:ring-[3px]');
  });

  it('marks the input invalid and describes it with the error', () => {
    render(<FileUpload hint="hint" error="File type not supported" />);
    const input = screen.getByLabelText(/Click to upload/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('File type not supported');
    expect(screen.queryByText('hint')).not.toBeInTheDocument();
  });

  it('shows the loading title, busy state and a polite status', () => {
    const { container } = render(<FileUpload loading loadingTitle="Uploading 2 files..." />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Uploading 2 files...');
    expect(screen.queryByText('or drag and drop', { exact: false })).not.toBeInTheDocument();
  });

  it('renders queued items in a list', () => {
    render(
      <FileUpload>
        <FileUploadItem name="a.pdf" progress={40} />
      </FileUpload>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<FileUpload ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('FileUploadItem', () => {
  it('shows name, formatted size and a progress bar', () => {
    render(
      <ul>
        <FileUploadItem name="design.pdf" size={204800} progress={40} />
      </ul>,
    );
    expect(screen.getByText('design.pdf')).toBeInTheDocument();
    expect(screen.getByText('200 KB')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Uploading design.pdf' })).toHaveAttribute('aria-valuenow', '40');
  });

  it('completes with a check, full progress and a status text', () => {
    render(
      <ul>
        <FileUploadItem name="a.pdf" status="complete" size="4.2 MB" />
      </ul>,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Upload complete')).toBeInTheDocument();
  });

  it('shows an error, hides progress and offers retry and remove', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(
      <ul>
        <FileUploadItem name="a.pdf" status="error" error="Too large" onRetry={onRetry} onRemove={onRemove} />
      </ul>,
    );
    expect(screen.getByText('Too large')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry a.pdf' }));
    await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    expect(onRetry).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalled();
  });

  it('fill variant tints the row and shows percent text and a spinner', () => {
    render(
      <ul>
        <FileUploadItem name="a.pdf" variant="fill" progress={70} size="16 MB" />
      </ul>,
    );
    expect(screen.getByText('16 MB - 70% uploaded')).toBeInTheDocument();
    expect(document.querySelector('[data-progress-fill]')).toHaveStyle({ width: '70%' });
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

describe('FileUploadItem selected status', () => {
  it('shows a chosen file as not uploaded without any progress', () => {
    render(
      <ul>
        <FileUploadItem name="a.pdf" size="4.2 MB" status="selected" onRemove={() => {}} />
      </ul>,
    );
    expect(screen.getByText('4.2 MB - Not uploaded')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove a.pdf' })).toBeInTheDocument();
  });

  it('lets the text be overridden by prop', () => {
    render(
      <ul>
        <FileUploadItem name="a.pdf" status="selected" notUploadedText="Pending" />
      </ul>,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('FileUpload overlay mode', () => {
  const dragWithFiles = (type: 'dragEnter' | 'dragLeave' | 'drop') =>
    act(() => {
      fireEvent[type](document, { dataTransfer: { types: ['Files'], files: [] } });
    });

  it('is hidden until a file is dragged over the page and hides again on leave', () => {
    const { container } = render(<FileUpload mode="overlay" titleText="Drop here" />);
    const zone = container.querySelector('label') as HTMLElement;
    expect(zone).toHaveClass('hidden', 'absolute', 'inset-0');
    dragWithFiles('dragEnter');
    expect(zone).not.toHaveClass('hidden');
    dragWithFiles('dragLeave');
    expect(zone).toHaveClass('hidden');
  });

  it('ignores drags without files and hides after a drop elsewhere', () => {
    const { container } = render(<FileUpload mode="overlay" />);
    const zone = container.querySelector('label') as HTMLElement;
    act(() => {
      fireEvent.dragEnter(document, { dataTransfer: { types: ['text/plain'] } });
    });
    expect(zone).toHaveClass('hidden');
    dragWithFiles('dragEnter');
    dragWithFiles('drop');
    expect(zone).toHaveClass('hidden');
  });

  it('delivers dropped files and takes the input out of the tab order', () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload mode="overlay" onFilesSelected={onFilesSelected} />);
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1');
    dragWithFiles('dragEnter');
    const file = new File(['x'], 'a.txt');
    fireEvent.drop(container.querySelector('label') as HTMLElement, { dataTransfer: { files: [file], types: ['Files'] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('keeps the visible zone by default', () => {
    const { container } = render(<FileUpload />);
    expect(container.querySelector('label')).not.toHaveClass('hidden');
  });
});

describe('FileUpload external trigger', () => {
  it('opens the file dialog from an external button and keeps the forwarded ref', async () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<FileUpload ref={ref} mode="overlay" trigger={(open) => <button type="button" onClick={open}>Upload</button>} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    expect(ref.current).toBe(input);
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled or loading', async () => {
    const { container, rerender } = render(<FileUpload disabled trigger={(open) => <button type="button" onClick={open}>Upload</button>} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    rerender(<FileUpload loading trigger={(open) => <button type="button" onClick={open}>Upload</button>} />);
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(click).not.toHaveBeenCalled();
  });
});


describe('FileUploadItem icon alignment (0.45.1, ZERO-812)', () => {
  it('centres the file icon on the name and meta row and keeps the progress below, under the text', () => {
    const { container } = render(
      <ul>
        <FileUploadItem name="design.pdf" size="4.2 MB" progress={40} onRemove={() => {}} />
      </ul>,
    );
    const row = container.querySelector('li') as HTMLElement;
    expect(row).toHaveClass('grid', 'grid-cols-[auto_minmax(0,1fr)_auto]', 'items-center');
    expect(row).not.toHaveClass('items-start');
    const progress = screen.getByRole('progressbar').closest('[data-upload-progress]') as HTMLElement;
    expect(progress).toHaveClass('row-start-2', 'col-start-2');
    // Reading order: name, meta, progress, then the actions.
    const remove = screen.getByRole('button', { name: 'Remove design.pdf' });
    expect(progress.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
