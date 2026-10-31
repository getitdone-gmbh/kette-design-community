// Guard for 0.30.0: every class of the SecondaryNav touch hit area and layout header, the scrolling line tabs, the small select triggers, the TableEmpty frame and the status chip below sm must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { AutosaveStatus } from '../components/ui/autosave-status';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { SecondaryNav, SecondaryNavLayout } from '../components/ui/secondary-nav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableEmpty } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TopBarEnd } from '../components/ui/topbar';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;

const sections = [{ id: 's', label: 'Area', items: [{ id: 'a', label: 'One', count: 2 }, { id: 'b', label: 'Two' }] }];

describe('0.30.0 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the nav hit area and header, line tabs, small selects, the empty frame and the status chip in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <SecondaryNavLayout title="Area" actions={<button type="button">Add</button>} nav={<SecondaryNav aria-label="Area" orientation="responsive" sections={sections} defaultValue="a" />}>
            Content
          </SecondaryNavLayout>
          <SecondaryNav aria-label="Row" orientation="horizontal" sections={sections} defaultValue="b" />
          <Tabs defaultValue="a">
            <TabsList variant="line" aria-label="Sections">
              <TabsTrigger value="a" count={3}>One</TabsTrigger>
              <TabsTrigger value="b">Two</TabsTrigger>
            </TabsList>
          </Tabs>
          {(['xs', 'sm', 'md'] as const).map((size) => (
            <Select key={size} defaultValue="a">
              <SelectTrigger aria-label={size} size={size}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">A</SelectItem>
              </SelectContent>
            </Select>
          ))}
          <Table scrollLabel="Rows">
            <TableBody>
              <TableEmpty columns={2} title="Nothing" description="Change the filters." />
              <TableEmpty columns={2} message="Nothing" />
            </TableBody>
          </Table>
          <TopBarEnd>
            <AutosaveStatus state="dirty" />
          </TopBarEnd>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
