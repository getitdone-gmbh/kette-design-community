import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Card } from './Card';

describe('Card component', () => {
  it('renders correctly', () => {
    const Child = <Card children />;
    const { getByTestId } = render(Child);
    const cardElement = getByTestId('card');
    expect(cardElement).toHaveClass('flex');
    expect(cardElement).toBeInTheDocument();
  });

  it('should render children', () => {
    const { getByTestId } = render(<Card children={<div data-testid="card-test-child">Child</div>}></Card>);
    const childElement = getByTestId('card-test-child');
    expect(childElement).toBeInTheDocument();
  });

  describe('interactive (onClick present)', () => {
    it('is not a button and not tab-reachable without onClick', () => {
      render(<Card children="Content" />);
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveClass('hover:bg-background-neutral-default');
    });

    it('becomes a keyboard-operable button once onClick is passed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Card onClick={onClick} children="Content" />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveClass('hover:bg-background-neutral-default', 'focus-visible:ring-focus', 'focus-visible:ring-ring-default');

      await user.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);

      card.focus();
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(2);

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('tokens (MAT-CARD-02)', () => {
    it('uses the surface radius tier (12px), not the mismatched rounded-default', () => {
      const { getByTestId } = render(<Card children="Content" />);
      const card = getByTestId('card');
      expect(card).toHaveClass('rounded-surface', 'border-border', '[&>img]:rounded-tl-surface', '[&>img]:rounded-tr-surface');
      expect(card).not.toHaveClass('rounded-default');
    });
  });

  describe('isFluid (MAT-CARD-03)', () => {
    it('applies the @container class, not the literal "isFluid" class', () => {
      const { getByTestId } = render(<Card isFluid children="Content" />);
      const card = getByTestId('card');
      expect(card).toHaveClass('@container');
      expect(card).not.toHaveClass('isFluid');
    });

    it('does not apply @container when isFluid is not passed', () => {
      const { getByTestId } = render(<Card children="Content" />);
      expect(getByTestId('card')).not.toHaveClass('@container');
    });
  });

  describe('disabled (MAT-CARD-04)', () => {
    it('sets aria-disabled and data-disabled instead of the HTML disabled attribute', () => {
      const { getByTestId } = render(<Card disabled children="Content" />);
      const card = getByTestId('card');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('data-disabled', 'true');
      expect(card).toHaveClass('aria-disabled:opacity-disabled', 'aria-disabled:pointer-events-none');
    });

    it('suppresses interactivity even when onClick is passed', () => {
      const onClick = jest.fn();
      const { getByTestId } = render(
        <Card disabled onClick={onClick} children="Content" />,
      );
      const card = getByTestId('card');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabindex');
    });
  });

  describe('invalid (MAT-CARD-04)', () => {
    it('sets aria-invalid and the error border token', () => {
      const { getByTestId } = render(<Card invalid children="Content" />);
      const card = getByTestId('card');
      expect(card).toHaveAttribute('aria-invalid', 'true');
      expect(card).toHaveAttribute('data-invalid', 'true');
      expect(card).toHaveClass('aria-[invalid=true]:border-error');
    });

    it('adds an sr-only "(invalid)" cue', () => {
      render(<Card invalid children="Content" />);
      expect(screen.getByText('(invalid)')).toHaveClass('sr-only');
    });
  });

  describe('selected (MAT-CARD-04)', () => {
    it('sets data-selected and the primary border/background-accent tokens', () => {
      const { getByTestId } = render(<Card selected children="Content" />);
      const card = getByTestId('card');
      expect(card).toHaveAttribute('data-selected', 'true');
      expect(card).toHaveClass('data-[selected=true]:border-primary', 'data-[selected=true]:bg-background-accent');
    });

    it('adds an sr-only "(selected)" cue when not interactive', () => {
      render(<Card selected children="Content" />);
      expect(screen.getByText('(selected)')).toHaveClass('sr-only');
    });

    it('uses aria-pressed instead of the sr-only cue once interactive', () => {
      render(<Card selected onClick={() => {}} children="Content" />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('(selected)')).not.toBeInTheDocument();
    });
  });

  describe('accessible name (CARD-A11Y-04)', () => {
    it('resolves a concise accessible name via aria-label on an interactive card with rich nested content', () => {
      render(
        <Card
          onClick={() => {}}
          aria-label="Card title"
          children={
            <>
              <p>Category</p>
              <h3>Card title</h3>
              <p>Description that would otherwise be concatenated into the accessible name.</p>
            </>
          }
        />,
      );
      expect(screen.getByRole('button', { name: 'Card title' })).toBeInTheDocument();
    });
  });
});

describe('Card text colour', () => {
  it('keeps text-foreground by default', () => {
    render(<Card>Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('text-foreground');
  });

  it('inherits the text colour when transparent', () => {
    render(<Card transparent>Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('text-inherit');
    expect(card).not.toHaveClass('text-foreground');
  });
});

describe('Card disabled click guard (0.28.1)', () => {
  it('never calls onClick while disabled, even when the click is dispatched directly', () => {
    const onClick = vi.fn();
    render(<Card disabled onClick={onClick}>Body</Card>);
    fireEvent.click(screen.getByText('Body'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
