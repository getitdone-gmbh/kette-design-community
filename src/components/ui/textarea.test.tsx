import { screen } from '@testing-library/react';
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
});
