import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { Separator } from './separator';

describe('Separator', () => {
  it('is decorative by default (role=none, no separator semantics)', () => {
    render(<Separator data-testid="sep" />);
    const el = screen.getByTestId('sep');
    expect(el).toHaveAttribute('role', 'none');
    expect(el).not.toHaveAttribute('aria-orientation');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('exposes role=separator when decorative={false}', () => {
    render(<Separator decorative={false} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders a 1px horizontal rule by default using the border-subtle token', () => {
    render(<Separator data-testid="sep" />);
    const el = screen.getByTestId('sep');
    expect(el).toHaveClass('h-px', 'w-full', 'bg-border-subtle');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders a vertical rule and announces aria-orientation when semantic', () => {
    render(<Separator orientation="vertical" decorative={false} />);
    const el = screen.getByRole('separator');
    expect(el).toHaveClass('h-full', 'w-px');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('merges a consumer className', () => {
    render(<Separator className="my-4" data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveClass('my-4', 'bg-border-subtle');
  });
});
