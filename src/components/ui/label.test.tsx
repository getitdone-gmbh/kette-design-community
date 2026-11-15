import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from './label';

describe('Label', () => {
  it('renders the children', () => {
    render(<Label>Message</Label>);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('adds a decorative required marker when required', () => {
    const { container } = render(<Label required>Message</Label>);
    const marker = container.querySelector('[data-required-marker]');
    expect(marker).toHaveTextContent('*');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no marker by default', () => {
    const { container } = render(<Label>Message</Label>);
    expect(container.querySelector('[data-required-marker]')).toBeNull();
  });
});
