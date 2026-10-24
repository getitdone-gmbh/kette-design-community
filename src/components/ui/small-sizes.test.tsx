import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

import { Button } from './button';
import { ButtonGroup, ButtonGroupItem } from './button-group';
import { Chip } from './chip';
import { DesignSystemProvider } from './design-system-provider';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from './dropdown-menu';
import { MultiSelect, MultiSelectProvider } from './multiselect';
import { PageHeader } from './page-header';
import { Pagination } from './pagination';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// kette-design-community ships the zero theme only (styles/theme.css), so the light :root block is the token source and only the zero preset is checked.
const rootBlock = readFileSync(join(process.cwd(), 'styles/theme.css'), 'utf8').split(/\n\}/)[0];
const token = (name: string) => {
  const match = rootBlock.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`no ${name} in styles/theme.css`);
  return match[1].trim();
};

// Pixel value of a size class against the token values of the theme: `h-control-sm`, `w-control-sm`, `min-h-[var(--size-control-sm)]`.
const pxOf = (el: HTMLElement, _theme: string, axis: 'h' | 'w' | 'min-h') => {
  const cls = [...el.classList].find((c) => c.startsWith(`${axis}-control-`) || c === `${axis}-[var(--size-control-sm)]`);
  if (!cls) throw new Error(`no ${axis} control class on ${el.className}`);
  const name = cls.startsWith(`${axis}-control-`) ? cls.replace(`${axis}-control-`, '') : 'sm';
  return Number.parseInt(token(`--size-control-${name}`), 10);
};

// Chain rule: the workload.zero prototype decides (zero: sm 28, md 32), the default scale is the token scale (sm 32, md 40).
const CASES: Array<['default' | 'zero', string, number]> = [['zero', 'zero', 28]];

const inProvider = (preset: 'default' | 'zero', ui: React.ReactElement) => render(<DesignSystemProvider preset={preset}>{ui}</DesignSystemProvider>);

describe.each(CASES)('small sizes, preset %s with theme %s', (preset, theme, controlSm) => {
  it('token control-sm is the Button sm height', () => {
    inProvider(preset, <Button size="sm">Probe</Button>);
    expect(pxOf(screen.getByRole('button', { name: 'Probe' }), theme, 'h')).toBe(controlSm);
  });

  it('ButtonGroup size sm is exactly control-sm high and its segments fill it', () => {
    inProvider(
      preset,
      <ButtonGroup aria-label="Range" size="sm">
        <ButtonGroupItem>Prev</ButtonGroupItem>
        <ButtonGroupItem>Today</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(pxOf(screen.getByRole('group', { name: 'Range' }), theme, 'h')).toBe(controlSm);
    for (const item of screen.getAllByRole('button')) expect(item).toHaveClass('h-full');
  });

  it('ButtonGroup default keeps its height', () => {
    inProvider(
      preset,
      <ButtonGroup aria-label="Range">
        <ButtonGroupItem>Prev</ButtonGroupItem>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Range' });
    if (preset === 'zero') expect(pxOf(group, theme, 'h')).toBe(32);
    else expect(pxOf(screen.getByRole('button', { name: 'Prev' }), theme, 'h')).toBe(40);
  });

  it('Pagination size sm: the button group variant sits on control-sm, page squares are control-sm', () => {
    const { unmount } = inProvider(preset, <Pagination variant="card-button-group" size="sm" pageCount={5} defaultPage={2} />);
    expect(pxOf(screen.getByRole('group'), theme, 'h')).toBe(controlSm);
    expect(screen.getByRole('button', { name: /Page 2/ })).toHaveClass('w-control-sm', 'h-full');
    unmount();
    inProvider(preset, <Pagination variant="page" size="sm" pageCount={5} defaultPage={2} />);
    expect(pxOf(screen.getByRole('button', { name: /Page 3/ }), theme, 'h')).toBe(controlSm);
    expect(pxOf(screen.getByRole('button', { name: /Previous/ }), theme, 'h')).toBe(controlSm);
  });

  it('MultiSelect size sm: the field is control-sm high at least, the toggle is smaller than the field', () => {
    inProvider(
      preset,
      <MultiSelectProvider>
        <MultiSelect id="sm" ariaLabel="Skills" size="sm" options={[{ id: 'a', label: 'A' }]} selected={[]} onChange={() => undefined} />
      </MultiSelectProvider>,
    );
    const field = screen.getAllByRole('combobox')[0];
    expect(pxOf(field, theme, 'min-h')).toBe(controlSm);
    expect(field).not.toHaveClass('min-h-[var(--size-control-md)]');
  });

  it('MultiSelect default keeps the control-md field', () => {
    inProvider(
      preset,
      <MultiSelectProvider>
        <MultiSelect id="md" ariaLabel="Skills" options={[{ id: 'a', label: 'A' }]} selected={[]} onChange={() => undefined} />
      </MultiSelectProvider>,
    );
    expect(screen.getAllByRole('combobox')[0].className).not.toContain('min-h-[var(--size-control-sm)]');
  });

  it('Chip control and medium are control-sm high, like Button sm', () => {
    inProvider(
      preset,
      <>
        <Chip size="control" label="Control" />
        <Chip size="medium" label="Medium" />
      </>,
    );
    expect(pxOf(screen.getByTitle('Control').closest('div') as HTMLElement, theme, 'h')).toBe(controlSm);
    expect(pxOf(screen.getByTitle('Medium').closest('div') as HTMLElement, theme, 'h')).toBe(controlSm);
  });

  it('PageHeader More trigger is a non-shrinking icon-sm button', () => {
    inProvider(preset, <PageHeader title="Shifts" overflow={<DropdownMenuItem>Export</DropdownMenuItem>} />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveClass('flex-none', 'shrink-0', 'h-control-sm', 'w-control-sm');
    expect(pxOf(trigger, theme, 'h')).toBe(controlSm);
    expect(pxOf(trigger, theme, 'w')).toBe(controlSm);
  });
});

describe('MultiSelect size sm chips inside', () => {
  it('uses the tight gap and drops the 40px inner minimum', () => {
    render(
      <MultiSelectProvider>
        <MultiSelect id="chips" ariaLabel="Skills" size="sm" chipsInside options={[{ id: 'a', label: 'Alpha' }]} selected={['a']} onChange={() => undefined} />
      </MultiSelectProvider>,
    );
    const inner = screen.getAllByRole('combobox')[0].firstElementChild as HTMLElement;
    expect(inner).toHaveClass('gap-1', 'min-h-0');
    expect(inner).not.toHaveClass('min-h-[40px]');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

describe('PageHeader overflow slot', () => {
  it('shows the More menu below sm and the actions from sm up', () => {
    render(<PageHeader title="Shifts" actions={<button type="button">Publish</button>} overflow={<DropdownMenuItem>Export</DropdownMenuItem>} />);
    const more = screen.getByRole('button', { name: 'More actions' });
    expect(more.closest('[data-slot="overflow"]')).toHaveClass('sm:hidden');
    expect(screen.getByRole('button', { name: 'Publish' }).parentElement).toHaveClass('max-sm:hidden');
  });

  it('is absent without overflow and leaves the actions alone', () => {
    render(<PageHeader title="Shifts" actions={<button type="button">Publish</button>} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' }).parentElement).not.toHaveClass('max-sm:hidden');
  });

  it('takes a custom label and opens a touch menu', async () => {
    render(<PageHeader title="Shifts" overflowLabel="More shift actions" overflow={<DropdownMenuItem>Export</DropdownMenuItem>} />);
    await userEvent.click(screen.getByRole('button', { name: 'More shift actions' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('data-density', 'touch');
    expect(within(menu).getByRole('menuitem', { name: 'Export' })).toHaveClass('max-sm:min-h-[var(--size-touch-target-lg)]');
  });

  it('works in the banner style too', () => {
    render(<PageHeader variant="banner" title="Team" actions={<button type="button">Invite</button>} overflow={<DropdownMenuItem>Export</DropdownMenuItem>} />);
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' }).parentElement).toHaveClass('max-sm:hidden');
  });
});

describe('DropdownMenu density', () => {
  const open = async (density?: 'default' | 'touch' | 'auto') => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent density={density}>
          <DropdownMenuItem>Item</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Check</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Radio</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    return screen.findByRole('menu');
  };

  it('default keeps the dense rows', async () => {
    const menu = await open();
    expect(menu).not.toHaveAttribute('data-density');
    expect(screen.getByRole('menuitem', { name: 'Item' }).className).not.toContain('touch-target');
  });

  it('touch makes every row type 44px high below sm', async () => {
    const menu = await open('touch');
    expect(menu).toHaveAttribute('data-density', 'touch');
    for (const row of [screen.getByRole('menuitem', { name: 'Item' }), screen.getByRole('menuitemcheckbox', { name: 'Check' }), screen.getByRole('menuitemradio', { name: 'Radio' })]) {
      expect(row).toHaveClass('max-sm:min-h-[var(--size-touch-target-lg)]');
    }
    expect(token('--size-touch-target-lg')).toBe('44px');
  });

  it('auto makes the rows 44px high on coarse pointers at any width', async () => {
    await open('auto');
    expect(screen.getByRole('menuitem', { name: 'Item' })).toHaveClass('[@media(pointer:coarse)]:min-h-[var(--size-touch-target-lg)]');
  });
});
