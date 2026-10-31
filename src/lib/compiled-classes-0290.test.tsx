// Guard for 0.29.0: every class of the new top bar, sheet and scroll region rules must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { ScrollArea } from '../components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetNavLink, SheetTitle } from '../components/ui/sheet';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { TopBar, TopBarBreadcrumb, TopBarEnd, TopBarMobileMenu, TopBarStart } from '../components/ui/topbar';
import { Button } from '../components/ui/button';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.29.0 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the top bar, sheet header, nav link and scroll regions in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <TopBar>
            <TopBarStart>
              <TopBarBreadcrumb items={[{ label: 'vacancy', href: '#' }, { label: 'Middle', href: '#' }, { label: 'Level', href: '#' }, { label: 'Demands' }]} />
            </TopBarStart>
            <TopBarEnd>
              <Button data-topbar-action="" icon={<svg />}>
                Ask
              </Button>
            </TopBarEnd>
            <TopBarMobileMenu defaultOpen items={[{ label: 'Pricing', href: '#pricing', current: 'location' }, { group: 'More', items: [{ label: 'Docs', href: '/docs' }] }]} />
          </TopBar>
          <Sheet open>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Title</SheetTitle>
              </SheetHeader>
              <SheetDescription>Text</SheetDescription>
              <SheetNavLink href="#a" variant="nav" aria-current="page">
                Section
              </SheetNavLink>
            </SheetContent>
          </Sheet>
          <ScrollArea>content</ScrollArea>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Cell</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
