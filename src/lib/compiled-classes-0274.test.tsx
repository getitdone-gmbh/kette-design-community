// Guard for 0.27.4: every class of the small sizes, the touch density and the More slot must generate CSS, in the default and the zero preset.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { Button } from '../components/ui/button';
import { ButtonGroup, ButtonGroupItem } from '../components/ui/button-group';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { MultiSelect, MultiSelectProvider } from '../components/ui/multiselect';
import { PageHeader } from '../components/ui/page-header';
import { Pagination } from '../components/ui/pagination';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

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

// `command` is the selector hook of the MultiSelect click-outside handler, not a utility.
const compiled = async (el: HTMLElement) => (await missingCompiledClasses(collectRenderedClasses(el))).filter((c) => c !== 'command');

describe('0.27.4 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the small sizes in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <ButtonGroup aria-label="Range" size="sm">
            <ButtonGroupItem>Prev</ButtonGroupItem>
            <ButtonGroupItem icon={<svg />} aria-label="Next" />
          </ButtonGroup>
          <Pagination variant="card-button-group" size="sm" pageCount={9} defaultPage={5} />
          <MultiSelectProvider>
            <MultiSelect id="a" ariaLabel="Skills" size="sm" chipsInside options={[{ id: 'a', label: 'A' }]} selected={['a']} onChange={() => undefined} />
          </MultiSelectProvider>
          <MultiSelectProvider>
            <MultiSelect id="b" ariaLabel="Skills" size="sm" useSheet options={[{ id: 'a', label: 'A' }]} selected={[]} onChange={() => undefined} />
          </MultiSelectProvider>
          <PageHeader title="Shifts" actions={<Button>Publish</Button>} overflow={<DropdownMenuItem>Export</DropdownMenuItem>} />
        </DesignSystemProvider>,
      );
      expect(await compiled(baseElement)).toEqual([]);
    });

    it(`generates CSS for the touch rows in the ${preset} preset`, async () => {
      for (const density of ['touch', 'auto'] as const) {
        const { baseElement, unmount } = render(
          <DesignSystemProvider preset={preset}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>Open</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent density={density}>
                <DropdownMenuItem>Item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DesignSystemProvider>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await screen.findByRole('menu');
        expect(await compiled(baseElement)).toEqual([]);
        unmount();
      }
    });
  }
});
