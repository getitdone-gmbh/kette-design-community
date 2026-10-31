// Guard for 0.29.1: every class of the back link, the end slot ceilings, the compact cookie card and the isolated table wrapper must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { AutosaveStatus } from '../components/ui/autosave-status';
import { CookieConsent } from '../components/ui/cookie-consent';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from '../components/ui/navigation-menu';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { TopBar, TopBarBreadcrumb, TopBarEnd, TopBarStart } from '../components/ui/topbar';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.29.1 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the back link, end slot, compact cookie card and table wrapper in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <TopBar>
            <TopBarStart>
              <TopBarBreadcrumb items={[{ label: 'vacancy', href: '#' }, { label: 'Middle', href: '#' }, { label: 'Level', href: '#' }, { label: 'Demands' }]} />
            </TopBarStart>
            <TopBarEnd>
              <AutosaveStatus state="dirty" />
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger data-topbar-action="" icon={<svg />}>
                      Products
                    </NavigationMenuTrigger>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </TopBarEnd>
          </TopBar>
          <CookieConsent positioning="static" description="Text" onAccept={() => undefined} onDecline={() => undefined} onCustomize={() => undefined} />
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
