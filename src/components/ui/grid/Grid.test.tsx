import { render } from '@testing-library/react';

import { Grid } from './Grid';

describe('Grid component', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<Grid />);
    const gridElement = getByTestId('grid');
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass('grid');
  });

  it('is a centered page-width frame: capped at max-w-content and centered with mx-auto', () => {
    const { getByTestId } = render(<Grid />);
    expect(getByTestId('grid')).toHaveClass('max-w-content', 'mx-auto');
  });

  it('lets a consumer drop the cap with max-w-none', () => {
    const { getByTestId } = render(<Grid className="max-w-none" />);
    expect(getByTestId('grid')).toHaveClass('max-w-none');
  });

  it('merges classes with tailwind-merge: a consumer class replaces the default it conflicts with', () => {
    const { getByTestId } = render(<Grid className="gap-6 max-w-none mx-0" />);
    const grid = getByTestId('grid');
    expect(grid).toHaveClass('gap-6', 'max-w-none', 'mx-0');
    expect(grid).not.toHaveClass('gap-10');
    expect(grid).not.toHaveClass('max-w-content');
    expect(grid).not.toHaveClass('mx-auto');
  });

  it('keeps the column classes of other breakpoints', () => {
    const { getByTestId } = render(<Grid columns={{ xs: 1, md: 4 }} className="gap-4" />);
    expect(getByTestId('grid')).toHaveClass('grid-cols-1', 'md:grid-cols-4', 'gap-4');
  });
});
