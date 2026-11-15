import { screen } from '@testing-library/react';
import * as React from 'react';
import { render } from '../../lib/render-default-look';

import { Textarea } from './textarea';

describe('Textarea', () => {
  it('keeps the 10rem minimum by default', () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveClass('min-h-[10rem]');
  });

  it('minRows replaces the minimum height and sets the visible rows', () => {
    render(<Textarea aria-label="Notes" minRows={2} />);
    const field = screen.getByRole('textbox', { name: 'Notes' });
    expect(field).not.toHaveClass('min-h-[10rem]');
    expect(field).toHaveClass('min-h-0');
    expect(field).toHaveAttribute('rows', '2');
  });

  it('an explicit rows prop still wins', () => {
    render(<Textarea aria-label="Notes" minRows={2} rows={4} />);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute('rows', '4');
  });

  it('autoResize turns off manual resizing, sets the height from the content and keeps the ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', { configurable: true, get: () => 96 });
    const { rerender } = render(<Textarea ref={ref} aria-label="Sentence" minRows={1} autoResize defaultValue="one" />);
    const field = screen.getByRole('textbox', { name: 'Sentence' });
    expect(ref.current).toBe(field);
    expect(field).toHaveClass('resize-none', 'overflow-hidden');
    expect(field.style.height).toBe('96px');
    rerender(<Textarea ref={ref} aria-label="Sentence" minRows={1} autoResize value="one two three" onChange={() => {}} />);
    expect(field.style.height).toBe('96px');
    delete (HTMLTextAreaElement.prototype as { scrollHeight?: number }).scrollHeight;
  });
});
