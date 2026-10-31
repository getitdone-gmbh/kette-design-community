import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { Card, CardFooter, CardHeader, CardTitle } from './card';

describe('Card extensions', () => {
  it('default variant keeps the tinted hover classes when interactive', () => {
    render(<Card onClick={() => {}}>c</Card>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-background-neutral-default', 'active:brightness-95');
  });

  it('surface variant raises border and shadow instead of tinting', () => {
    render(
      <Card variant="surface" onClick={() => {}}>
        c
      </Card>,
    );
    const el = screen.getByRole('button');
    expect(el).toHaveClass('hover:border-border-bold', 'hover:shadow-sm');
    expect(el).not.toHaveClass('hover:bg-background-neutral-default');
  });

  it('CardHeader without the new props renders the original structure', () => {
    render(
      <CardHeader data-testid="h">
        <CardTitle>T</CardTitle>
      </CardHeader>,
    );
    expect(screen.getByTestId('h')).toHaveClass('flex', 'flex-col', 'p-6');
    expect(screen.getByTestId('h')).not.toHaveClass('border-t-4', 'border-b');
  });

  it('CardHeader renders actions, leading, accent and divider', () => {
    render(
      <CardHeader data-testid="h" accent divider leading={<span data-testid="lead" />} actions={<button type="button">Menu</button>}>
        <CardTitle>T</CardTitle>
      </CardHeader>,
    );
    expect(screen.getByTestId('h')).toHaveClass('border-t-4', 'border-b');
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'T' })).toBeInTheDocument();
  });

  it('CardFooter is unchanged by default and gains a divider and alignment opt-in', () => {
    const { rerender } = render(<CardFooter data-testid="f">x</CardFooter>);
    expect(screen.getByTestId('f')).toHaveClass('flex', 'p-6', 'pt-0');
    expect(screen.getByTestId('f')).not.toHaveClass('border-t');
    rerender(
      <CardFooter data-testid="f" divider align="end">
        x
      </CardFooter>,
    );
    expect(screen.getByTestId('f')).toHaveClass('border-t', 'justify-end');
  });
});

