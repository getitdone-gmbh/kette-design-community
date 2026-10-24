import { render, screen } from '@testing-library/react';

import { Section } from './section';

describe('Section variants use semantic surface tokens', () => {
  it('white renders the background token instead of a raw white', () => {
    render(<Section variant="white" data-testid="s"><p>x</p></Section>);
    expect(screen.getByTestId('s')).toHaveClass('bg-background');
    expect(screen.getByTestId('s')).not.toHaveClass('bg-white');
  });

  it('primary pairs the primary surface with the primary foreground', () => {
    render(<Section variant="primary" data-testid="s"><p>x</p></Section>);
    expect(screen.getByTestId('s')).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});

describe('Section content frame', () => {
  it('keeps the 1170px cap by default and a maxWidth in px as an inline style', () => {
    const { rerender } = render(<Section data-testid="s"><p>x</p></Section>);
    const frame = screen.getByText('x').parentElement as HTMLElement;
    expect(frame).toHaveClass('max-w-[1170px]');
    rerender(<Section data-testid="s" maxWidth={856}><p>x</p></Section>);
    expect((screen.getByText('x').parentElement as HTMLElement).style.maxWidth).toBe('856px');
  });

  it('contentClassName replaces the default cap', () => {
    render(<Section contentClassName="max-w-content mx-auto"><p>x</p></Section>);
    const frame = screen.getByText('x').parentElement as HTMLElement;
    expect(frame).toHaveClass('max-w-content', 'mx-auto');
    expect(frame).not.toHaveClass('max-w-[1170px]');
    expect(frame.getAttribute('style')).toBeNull();
  });
});
