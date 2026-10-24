import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { vi } from 'vitest';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card component', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className with the token classes', () => {
    render(<Card className="max-w-[320px]">Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('max-w-[320px]', 'rounded-surface');
  });

  it('renders the composable sub-parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  describe('tokens', () => {
    it('uses the surface radius, hairline border and semantic card colors, not a raw palette class', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass(
        'rounded-surface',
        'bg-card',
        'text-card-foreground',
        'border-border',
        'shadow-xs',
      );
      expect(card).not.toHaveClass('rounded-default');
    });

    it('never renders a raw Tailwind palette color class', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      const rawPaletteClass =
        /(^|\s)(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;
      expect(card.className).not.toMatch(rawPaletteClass);
    });

    it('uses the dedicated card-foreground-muted token for CardDescription, not the undefined muted-foreground class', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-card-foreground-muted');
      expect(description).not.toHaveClass('text-muted-foreground');
    });
  });

  describe('interactive (onClick present)', () => {
    it('is not a button and not tab-reachable without onClick', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveClass('hover:bg-background-neutral-default');
    });

    it('becomes a keyboard-operable button once onClick is passed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Card onClick={onClick}>Content</Card>);
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

  describe('disabled', () => {
    it('sets aria-disabled and data-disabled instead of the HTML disabled attribute', () => {
      render(<Card disabled>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('data-disabled', 'true');
      expect(card).toHaveClass('aria-disabled:opacity-50', 'aria-disabled:pointer-events-none');
    });

    it('suppresses interactivity even when onClick is passed', () => {
      const onClick = jest.fn();
      render(
        <Card disabled onClick={onClick}>
          Content
        </Card>,
      );
      const card = screen.getByText('Content');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabindex');
    });

    it('does not set aria-disabled when disabled is not passed', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content')).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('invalid', () => {
    it('sets aria-invalid and the error border token', () => {
      render(<Card invalid>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveAttribute('aria-invalid', 'true');
      expect(card).toHaveAttribute('data-invalid', 'true');
      expect(card).toHaveClass('aria-[invalid=true]:border-error');
    });

    it('adds an sr-only "(invalid)" cue', () => {
      render(<Card invalid>Content</Card>);
      expect(screen.getByText('(invalid)')).toHaveClass('sr-only');
    });
  });

  describe('selected', () => {
    it('sets data-selected and the primary border/background-accent tokens', () => {
      render(<Card selected>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveAttribute('data-selected', 'true');
      expect(card).toHaveClass('data-[selected=true]:border-primary', 'data-[selected=true]:bg-background-accent');
    });

    it('adds an sr-only "(selected)" cue when not interactive', () => {
      render(<Card selected>Content</Card>);
      expect(screen.getByText('(selected)')).toHaveClass('sr-only');
    });

    it('uses aria-pressed instead of the sr-only cue once interactive', () => {
      render(
        <Card selected onClick={() => {}}>
          Content
        </Card>,
      );
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('(selected)')).not.toBeInTheDocument();
    });

    it('does not set data-selected when selected is not passed', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content')).not.toHaveAttribute('data-selected');
    });
  });

  describe('accessible name (CARD-A11Y-04)', () => {
    it('resolves a concise accessible name via aria-label on an interactive card with rich nested content', () => {
      render(
        <Card onClick={() => {}} aria-label="Card title">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Some description text.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Body content that would otherwise be concatenated into the accessible name.</p>
          </CardContent>
        </Card>,
      );
      expect(screen.getByRole('button', { name: 'Card title' })).toBeInTheDocument();
    });
  });
});

describe('Card link mode', () => {
  it('renders a real link without button role or extra tab stop', () => {
    render(
      <Card href="/report" aria-label="Report">
        Body
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Report' });
    expect(link).toHaveAttribute('href', '/report');
    expect(link).not.toHaveAttribute('role');
    expect(link).not.toHaveAttribute('tabindex');
    expect(link).toHaveClass('cursor-pointer', 'hover:bg-background-neutral-default');
  });

  it('asChild styles the given link element', () => {
    render(
      <Card asChild>
        <a href="/x">Inner</a>
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Inner' });
    expect(link).toHaveClass('rounded-surface', 'cursor-pointer');
  });

  it('disabled link has no href and is marked disabled', () => {
    render(
      <Card href="/report" disabled>
        Body
      </Card>,
    );
    const el = screen.getByText('Body');
    expect(el).not.toHaveAttribute('href');
    expect(el).toHaveAttribute('aria-disabled', 'true');
    expect(el).not.toHaveClass('cursor-pointer');
  });

  it('a div card stays a div', () => {
    render(<Card>Body</Card>);
    expect(screen.getByText('Body').tagName).toBe('DIV');
  });
});

describe('Card today state', () => {
  it('marks the current day without announcing it as selected', () => {
    render(<Card today>Mon 14</Card>);
    const card = screen.getByText(/Mon 14/).closest('div') as HTMLElement;
    expect(card).toHaveAttribute('aria-current', 'date');
    expect(card).toHaveAttribute('data-today', 'true');
    expect(card).not.toHaveAttribute('data-selected');
    expect(card).toHaveClass('data-[today=true]:border-border-brand');
    expect(screen.getByText('(today)')).toHaveClass('sr-only');
    expect(screen.queryByText('(selected)')).not.toBeInTheDocument();
  });

  it('keeps aria-pressed for selection on an interactive today card and skips the suffix', () => {
    render(
      <Card today selected onClick={() => {}}>
        Mon 14
      </Card>,
    );
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-current', 'date');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('(today)')).not.toBeInTheDocument();
  });
});

describe('Interactive Card nested controls (0.15)', () => {
  const setup = () => {
    const onCardClick = vi.fn();
    const onInner = vi.fn();
    render(
      <Card onClick={onCardClick} aria-label="Plan">
        <button type="button" onClick={onInner}>
          Inner action
        </button>
        <a href="#x">Inner link</a>
        <input aria-label="Inner field" />
        <span>Plain text</span>
      </Card>,
    );
    return { onCardClick, onInner };
  };

  it('ignores Enter and Space from nested buttons, links and inputs', async () => {
    const user = userEvent.setup();
    const { onCardClick, onInner } = setup();
    screen.getByRole('button', { name: 'Inner action' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onInner).toHaveBeenCalledTimes(2);
    screen.getByRole('link', { name: 'Inner link' }).focus();
    await user.keyboard('{Enter}');
    screen.getByLabelText('Inner field').focus();
    await user.keyboard('{Enter} ');
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('still activates from the card itself with Enter and Space and with a pointer click', async () => {
    const user = userEvent.setup();
    const { onCardClick } = setup();
    const card = screen.getByRole('button', { name: 'Plan' });
    card.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onCardClick).toHaveBeenCalledTimes(2);
    await user.click(screen.getByText('Plain text'));
    expect(onCardClick).toHaveBeenCalledTimes(3);
  });
});

describe('Card density', () => {
  const renderCard = (density?: 'default' | 'compact') =>
    render(
      <Card density={density} data-testid="card">
        <CardHeader divider>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer" divider>
          Footer
        </CardFooter>
      </Card>,
    );

  it('keeps 24px padding by default', () => {
    renderCard();
    expect(screen.getByTestId('content')).toHaveClass('p-6', 'pt-0');
    expect(screen.getByTestId('footer')).toHaveClass('p-6');
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-density');
  });

  it('compact gives header, content and footer 20px without class overrides', () => {
    renderCard('compact');
    expect(screen.getByTestId('card')).toHaveAttribute('data-density', 'compact');
    expect(screen.getByTestId('content')).toHaveClass('p-5', 'pt-0');
    expect(screen.getByTestId('footer')).toHaveClass('p-5');
    expect(screen.getByText('Title').parentElement).toHaveClass('p-5', 'pb-5');
  });

  it('container makes the card a size container', () => {
    render(
      <Card container data-testid="card">
        x
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('@container');
  });

  it('places the actions in the title row, centered on it', () => {
    render(
      <Card>
        <CardHeader actions={<button type="button">Act</button>}>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>,
    );
    const actions = screen.getByRole('button', { name: 'Act' }).parentElement;
    expect(actions).toHaveAttribute('data-slot', 'card-actions');
    expect(actions).toHaveClass('row-start-1', 'col-start-2', 'self-center', '-my-2');
    expect(actions).not.toHaveClass('h-0');
  });

  it('does not clip taller actions: no fixed height and no overflow rule on the actions box', () => {
    render(
      <Card>
        <CardHeader
          actions={
            <div>
              <button type="button">Sync</button>
              <span>Last run 2 min ago</span>
            </div>
          }
        >
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>,
    );
    const actions = screen.getByRole('button', { name: 'Sync' }).parentElement?.parentElement;
    expect(actions).toHaveAttribute('data-slot', 'card-actions');
    expect(actions?.className).not.toMatch(/(^|\s)(h-|overflow-)/);
    expect(screen.getByText('Last run 2 min ago')).toBeVisible();
    // The title centers in the first row, so it stays level with the actions when the row grows.
    expect(actions?.parentElement?.className).toContain('[&>:first-child:not([data-slot=card-actions])]:self-center');
  });
});
