import { render, screen, waitFor } from '@testing-library/react';

import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title as an h1 with subtitle and actions', () => {
    render(<PageHeader title="Team members" subtitle="Manage your team" actions={<button type="button">Invite</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Team members' })).toBeInTheDocument();
    expect(screen.getByText('Manage your team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
  });

  it('default style has a divider, zero style does not (unchanged opt-in)', () => {
    const { rerender } = render(<PageHeader title="t" />);
    expect(screen.getByRole('banner')).toHaveClass('border-b');
    rerender(<PageHeader title="t" variant="zero" />);
    expect(screen.getByRole('banner')).not.toHaveClass('border-b');
    rerender(<PageHeader title="t" variant="zero" divider />);
    expect(screen.getByRole('banner')).toHaveClass('border-b');
  });

  it('supports another heading level', () => {
    render(<PageHeader title="t" titleAs="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders leading, badges, breadcrumbs, tabs and the attributes column', () => {
    render(
      <PageHeader
        variant="record"
        title="Nordwind Handel GmbH"
        leading={<span data-testid="lead" />}
        badges={<span>Client</span>}
        breadcrumbs={<nav aria-label="Breadcrumb" />}
        tabs={<div role="tablist" />}
        attributes={<div data-testid="attrs" />}
      />,
    );
    ['lead', 'attrs'].forEach((id) => expect(screen.getByTestId(id)).toBeInTheDocument());
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('banner style renders the cover above the title and optional divider', () => {
    render(<PageHeader variant="banner" title="Lena Hartmann" subtitle="lena.hartmann@example.com" cover={<div data-testid="cover" />} divider />);
    expect(screen.getByTestId('cover')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Lena Hartmann' })).toBeInTheDocument();
    expect(screen.getByRole('banner').querySelector('hr')).not.toBeNull();
  });

  it('banner-avatar overlaps the cover with a large avatar and supports centered', () => {
    render(
      <PageHeader variant="banner-avatar" centered title="Olivia" cover={<div />} leading={<span data-testid="av" />} actions={<button type="button">Edit</button>} />,
    );
    const av = screen.getByTestId('av');
    expect(av.parentElement).toHaveClass('h-avatar-profile', 'w-avatar-profile', 'rounded-full');
    expect(screen.getByRole('banner').children[1]).toHaveClass('-mt-10', 'items-center');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('avatar style stays on the standard layout', () => {
    render(<PageHeader variant="avatar" title="Olivia" leading={<span data-testid="av" />} />);
    expect(screen.getByRole('banner')).toHaveClass('lg:flex-row');
  });

  it('renders scope chips after the subtitle and nothing without the prop', () => {
    const { rerender, container } = render(<PageHeader title="t" subtitle="sub" />);
    expect(container.querySelector('[data-scope-chips]')).toBeNull();
    rerender(<PageHeader title="t" subtitle="sub" scopeChips={<span>Nordwind Handel GmbH</span>} />);
    const row = container.querySelector('[data-scope-chips]') as HTMLElement;
    expect(row).toHaveTextContent('Nordwind Handel GmbH');
    expect(screen.getByText('sub').compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders scope chips in the banner layout too', () => {
    const { container } = render(<PageHeader variant="banner" title="t" scopeChips={<span>Scope</span>} />);
    expect(container.querySelector('[data-scope-chips]')).toHaveTextContent('Scope');
  });
});


describe('PageHeader title role', () => {
  it('zero renders the page-title role (24/600), default keeps the heading role', () => {
    const { rerender } = render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toHaveClass('typography-h3');
    rerender(<PageHeader title="Dashboard" variant="zero" />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toHaveClass('typography-page-title');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).not.toHaveClass('typography-h3');
  });

  describe('primaryAction', () => {
    it('stays visible on a phone: rendered in its own slot that is never hidden below sm', () => {
      render(
        <PageHeader
          title="Invoices"
          primaryAction={<button type="button">New invoice</button>}
          actions={<button type="button">Export</button>}
          overflow={<div role="menuitem">Export</div>}
        />,
      );
      const slot = screen.getByRole('button', { name: 'New invoice' }).parentElement as HTMLElement;
      expect(slot).toHaveAttribute('data-slot', 'primary-action');
      expect(slot.className).not.toMatch(/(^|\s)(hidden|max-sm:hidden|sm:hidden)(\s|$)/);
      // The other actions still collapse into the More menu below sm.
      const actions = screen.getByRole('button', { name: 'Export' }).parentElement as HTMLElement;
      expect(actions).toHaveClass('max-sm:hidden');
    });

    it('renders without actions or overflow and without an extra wrapper', () => {
      render(<PageHeader title="Invoices" primaryAction={<button type="button">New invoice</button>} />);
      expect(screen.getByRole('button', { name: 'New invoice' }).parentElement).toHaveAttribute('data-slot', 'primary-action');
      expect(document.querySelector('[data-slot="header-actions"]')).toBeNull();
    });

    it('groups actions and primary action in one row from sm up and stacks them below', () => {
      render(<PageHeader title="Invoices" primaryAction={<button type="button">New invoice</button>} actions={<button type="button">Export</button>} />);
      const group = document.querySelector('[data-slot="header-actions"]') as HTMLElement;
      // One group that does not wrap from sm up: the actions wrap among themselves, the primary action stays at the end of the group and never drops alone.
      expect(group).toHaveClass('flex', 'sm:flex-nowrap');
      expect(group).not.toHaveClass('flex-wrap');
      expect(group.lastElementChild).toHaveAttribute('data-slot', 'primary-action');
      const actions = screen.getByRole('button', { name: 'Export' }).parentElement as HTMLElement;
      expect(actions).toHaveAttribute('data-slot', 'actions');
      expect(actions).toHaveClass('flex-wrap', 'min-w-0');
      expect(actions.parentElement).toBe(group);
    });

    it('follows the prototype order on a phone: title, tabs, then the primary action', () => {
      render(
        <PageHeader
          title="Invoices"
          tabs={<div role="tablist" aria-label="Scope" />}
          primaryAction={<button type="button">New invoice</button>}
          actions={<button type="button">Export</button>}
        />,
      );
      const slot = document.querySelector('[data-slot="primary-action"]') as HTMLElement;
      const group = document.querySelector('[data-slot="header-actions"]') as HTMLElement;
      // Below sm the title row and the group dissolve, the primary action becomes an item of the header column and is ordered last, behind the tabs.
      expect(slot).toHaveClass('max-sm:order-last');
      expect(group).toHaveClass('max-sm:contents');
      expect(group.parentElement).toHaveClass('max-sm:contents');
      const column = group.parentElement?.parentElement as HTMLElement;
      expect(column).toContainElement(screen.getByRole('tablist'));
      expect(column).toHaveClass('flex-col');
    });

    it('banner layout dissolves the title row below sm so the primary action can follow the tabs', () => {
      render(<PageHeader variant="banner" title="Ada" tabs={<div role="tablist" aria-label="Scope" />} primaryAction={<button type="button">Follow</button>} />);
      const slot = document.querySelector('[data-slot="primary-action"]') as HTMLElement;
      expect(slot).toHaveClass('max-sm:order-last');
      expect(slot.parentElement).toHaveClass('max-sm:contents');
    });

    it('works in the banner layout too', () => {
      render(<PageHeader variant="banner" title="Ada" primaryAction={<button type="button">Follow</button>} overflow={<div role="menuitem">Block</div>} />);
      expect(screen.getByRole('button', { name: 'Follow' }).parentElement).toHaveAttribute('data-slot', 'primary-action');
      expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    });

    it('adds no gap-making wrapper when only actions and overflow are used (unchanged)', () => {
      render(<PageHeader title="t" actions={<button type="button">Export</button>} overflow={<div role="menuitem">Export</div>} />);
      expect(document.querySelector('[data-slot="header-actions"]')).toBeNull();
      expect(document.querySelector('[data-slot="primary-action"]')).toBeNull();
    });
  });

  describe('empty actions', () => {
    it('removes the actions wrapper from the layout while all its children are hidden', async () => {
      const { rerender } = render(
        <PageHeader
          title="t"
          actions={
            <>
              <button type="button" hidden>
                Import
              </button>
              <button type="button" style={{ display: 'none' }}>
                Export
              </button>
            </>
          }
        />,
      );
      const wrapper = screen.getByRole('banner').querySelector('[data-empty]') as HTMLElement;
      await waitFor(() => expect(wrapper).toHaveAttribute('data-empty', 'true'));
      expect(wrapper).toHaveClass('data-[empty=true]:hidden');
      // A shown child brings it back.
      rerender(
        <PageHeader
          title="t"
          actions={
            <>
              <button type="button" hidden>
                Import
              </button>
              <button type="button">Export</button>
            </>
          }
        />,
      );
      await waitFor(() => expect(wrapper).not.toHaveAttribute('data-empty'));
    });

    it('keeps the wrapper while a child is shown', () => {
      render(<PageHeader title="t" actions={<button type="button">Export</button>} />);
      expect(screen.getByRole('button', { name: 'Export' }).parentElement).not.toHaveAttribute('data-empty');
    });

    it('collapses the group of actions and primary action when every child is hidden', async () => {
      render(
        <PageHeader
          title="t"
          actions={
            <button type="button" hidden>
              Export
            </button>
          }
          primaryAction={
            <button type="button" hidden>
              New
            </button>
          }
        />,
      );
      const group = document.querySelector('[data-slot="header-actions"]') as HTMLElement;
      await waitFor(() => expect(group.querySelector('[data-slot="actions"]')).toHaveAttribute('data-empty', 'true'));
      await waitFor(() => expect(group.querySelector('[data-slot="primary-action"]')).toHaveAttribute('data-empty', 'true'));
    });
  });
});
