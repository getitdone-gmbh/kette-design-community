import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Badge } from './badge';
import { Chip } from './chip';
import { LoadingSpinner } from './loading-spinner';
import { Progress } from './progress';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastViewport } from './toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

describe('Chip additions', () => {
  it('default chip has no new classes or trailing content', () => {
    render(<Chip label="Design" />);
    const chip = screen.getByTitle('Design').closest('div') as HTMLElement;
    expect(chip.className).not.toMatch(/border-dashed|highlight-hit/);
    expect(chip.querySelector('[data-chip-count]')).toBeNull();
  });

  it('dashed gives the transparent dashed filter chip, also at the control size', () => {
    render(<Chip label="Add filter" dashed size="control" variant="outline" />);
    const chip = screen.getByTitle('Add filter').closest('div');
    expect(chip).toHaveClass('border-dashed', 'bg-transparent');
    expect(chip).not.toHaveClass('bg-muted');
  });

  it('hit uses the highlight tokens', () => {
    render(<Chip label="React" hit size="control" variant="outline" />);
    expect(screen.getByTitle('React').closest('div')).toHaveClass('bg-highlight-hit-default', 'text-highlight-hit-on');
  });

  it('meta and count render after the label', () => {
    render(<Chip label="React" meta="3+ yrs" count={5} />);
    expect(screen.getByText('3+ yrs')).toHaveClass('text-text-muted');
    expect(screen.getByText('5')).toHaveAttribute('data-chip-count');
  });

  it('selected still shows the check and aria-pressed when interactive', () => {
    render(<Chip label="React" selected onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});

const badgeEl = (name: string) => screen.getByText(name).closest('div') as HTMLElement;

describe('Badge product variants', () => {
  it.each(['backoffice', 'workstream', 'vacancy', 'jobsearch', 'coldcall'] as const)('product-%s uses its subtle pair', (product) => {
    render(<Badge variant={`product-${product}`}>Label</Badge>);
    expect(badgeEl('Label')).toHaveClass(`bg-product-${product}-subtle`, 'text-foreground', 'border-transparent');
  });

  it('bordered adds the product border colour only for product variants', () => {
    const { rerender } = render(<Badge variant="product-vacancy" bordered>Label</Badge>);
    expect(badgeEl('Label')).toHaveClass('border-product-vacancy-border');
    expect(badgeEl('Label')).not.toHaveClass('border-transparent');
    rerender(<Badge variant="default" bordered>Label</Badge>);
    expect(badgeEl('Label')).toHaveClass('border-transparent');
  });

  it('default badge is unchanged', () => {
    render(<Badge>Label</Badge>);
    expect(badgeEl('Label')).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});

describe('Progress label', () => {
  it('without label the bar is the root, as before', () => {
    const { container } = render(<Progress aria-label="p" value={40} className="w-72" />);
    expect(container.firstChild).toBe(screen.getByRole('progressbar'));
    expect(screen.getByRole('progressbar')).toHaveClass('w-72');
  });

  it.each(['right', 'bottom', 'top-floating', 'bottom-floating'] as const)('label=%s shows the rounded percent and keeps the bar semantics', (label) => {
    const { container } = render(<Progress aria-label="p" value={39.6} label={label} />);
    expect(container.querySelector('[data-progress-label]')).toHaveTextContent('40%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '39.6');
  });

  it('floating bubble follows the indicator end', () => {
    const { container } = render(<Progress aria-label="p" value={60} label="top-floating" />);
    expect(container.querySelector('[data-progress-label]')).toHaveStyle({ left: '60%' });
  });
});

describe('LoadingSpinner styles', () => {
  it('default output is the original ring without wrappers', () => {
    render(<LoadingSpinner data-testid="s" />);
    const spinner = screen.getByTestId('s');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full');
    expect(spinner.children).toHaveLength(0);
  });

  it('line and dots are labelled indicators that respect reduced motion', () => {
    const { rerender } = render(<LoadingSpinner variant="line" label="Saving" />);
    expect(screen.getByRole('status', { name: 'Saving' }).querySelector('svg')).toHaveClass('animate-spin', 'motion-reduce:animate-none');
    rerender(<LoadingSpinner variant="dots" />);
    expect(screen.getByRole('status', { name: 'Loading' }).querySelectorAll('circle')).toHaveLength(8);
  });

  it('shows supporting text for any style', () => {
    render(<LoadingSpinner supportingText="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Toast inverse variant', () => {
  const renderToast = (variant?: 'inverse' | 'default') =>
    render(
      <ToastProvider>
        <Toast open variant={variant}>
          <ToastDescription>Task deleted</ToastDescription>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

  it('uses the inverse surface and marks the group for the nested controls', () => {
    renderToast('inverse');
    const toast = screen.getByText('Task deleted').closest('li') as HTMLElement;
    expect(toast).toHaveClass('inverse', 'bg-foreground', 'text-background');
    expect(screen.getByRole('button', { name: 'Undo' }).className).toContain('group-[.inverse]:underline');
  });

  it('default toast is unchanged', () => {
    renderToast();
    const toast = screen.getByText('Task deleted').closest('li') as HTMLElement;
    expect(toast).toHaveClass('bg-surface-canvas');
    expect(toast).not.toHaveClass('inverse');
  });
});

describe('Tooltip tone and supporting text', () => {
  const renderTip = (props = {}) =>
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent {...props}>Title</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

  it('dark by default and unchanged', async () => {
    renderTip();
    const content = document.querySelector('[data-tone]') as HTMLElement;
    expect(content).toHaveAttribute('data-tone', 'dark');
    expect(content).toHaveClass('bg-foreground');
  });

  it('light uses the popover surface', () => {
    renderTip({ tone: 'light' });
    expect(document.querySelector('[data-tone=light]')).toHaveClass('bg-popover', 'border-hairline');
  });

  it('renders supporting text on a second line', () => {
    renderTip({ supportingText: 'Helpful detail' });
    expect(screen.getAllByText('Helpful detail').length).toBeGreaterThan(0);
  });

  it('opens on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent tone="light">Hello</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect((await screen.findAllByText('Hello')).length).toBeGreaterThan(0);
  });
});
