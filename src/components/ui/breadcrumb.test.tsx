import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from './breadcrumb';

const renderCrumbs = (props: React.ComponentProps<typeof Breadcrumbs> = {}) =>
  render(
    <Breadcrumbs {...props}>
      <BreadcrumbItem>
        <BreadcrumbLink href="/" icon={<svg data-testid="home" />} aria-label="Home" />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbEllipsis />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink current>Team</BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumbs>,
  );

describe('Breadcrumbs', () => {
  it('is a labelled nav with an ordered list and a current page', () => {
    renderCrumbs();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    const current = screen.getByText('Team');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('text type: 32px segments, text-small role, subtle text, current is default text', () => {
    renderCrumbs();
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveClass('h-control-sm', 'typography-text-small', 'text-text-subtle', 'hover:text-text-default');
    expect(screen.getByText('Team')).toHaveClass('aria-[current=page]:text-text-default');
  });

  it('separators are hidden from assistive tech and dropped after the last item', () => {
    const { container } = renderCrumbs();
    const seps = container.querySelectorAll('[data-separator]');
    expect(seps).toHaveLength(4);
    seps.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
    expect(container.querySelectorAll('li')[3].lastElementChild).toHaveClass('group-last/crumb:hidden');
  });

  it('divider slash uses the 20px slot, path type uses the 12px slot', () => {
    const { container, rerender } = renderCrumbs({ divider: 'slash' });
    expect(container.querySelector('[data-separator]')).toHaveClass('h-icon-md', 'w-icon-md');
    rerender(
      <Breadcrumbs type="path">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Root</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(container.querySelector('[data-separator]')).toHaveClass('h-icon-2xs', 'w-icon-2xs');
    expect(container.querySelector('ol')).toHaveClass('gap-gap-control');
  });

  it.each([
    ['button-primary', 'aria-[current=page]:bg-background-brand-subtle'],
    ['button-gray', 'aria-[current=page]:bg-muted'],
    ['button-gray-border', 'aria-[current=page]:bg-background'],
  ] as const)('type %s styles the current segment', (type, cls) => {
    renderCrumbs({ type });
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass(cls, 'px-2', 'rounded-item');
  });

  it('text with line adds the hairline frame', () => {
    const { container } = renderCrumbs({ type: 'text-with-line' });
    expect(container.querySelector('ol')).toHaveClass('border-y', 'border-border-default');
  });

  it('disabled levels are not links and are dimmed', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem>
          <BreadcrumbLink disabled>Locked</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink current>Here</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Locked')).toHaveAttribute('aria-disabled', 'true');
  });

  it('links are tabbable in order with the focus ring', async () => {
    renderCrumbs();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('focus-visible:ring-focus');
  });

  it('ellipsis exposes a screen reader label', () => {
    renderCrumbs();
    expect(screen.getByText('More levels')).toHaveClass('sr-only');
  });

  it('asChild keeps one link element', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem>
          <BreadcrumbLink asChild icon={<svg data-testid="i" />}>
            <a href="/x">X</a>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByTestId('i')).toBeInTheDocument();
  });
});
