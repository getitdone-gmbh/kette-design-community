// Guard for library 0.36.0 to 0.39.0: the changed classes of components in this package must generate CSS, in the default and the zero preset (port of the library revenue-library and runzero-gaps guards without the components this package does not ship).
import { render } from '@testing-library/react';

import { Avatar, AvatarFallback, AvatarOnlineIndicator } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { FacetFilter, FacetGroup, FacetOption } from '../components/ui/facet-filter';
import { FilterChipBar } from '../components/ui/filter-chip-bar';
import { Input } from '../components/ui/input';
import { Pagination } from '../components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Sheet, SheetContent, SheetTitle } from '../components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { VerifiedTick } from '../components/ui/verified-tick';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.36.0 to 0.39.0 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the changed components in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Badge icon={<svg />} iconPosition="end">
            Lead
          </Badge>
          <Badge variant="product-meeting">Meeting</Badge>
          <Button wrap>A long label that may wrap</Button>
          <Input aria-label="Large" size="2xl" />
          <Checkbox aria-label="Comfortable" comfortable />
          <RadioGroup aria-label="Choice" defaultValue="a">
            <RadioGroupItem value="a" aria-label="A" comfortable />
          </RadioGroup>
          {(['online', 'away', 'call', 'offline'] as const).map((status) => (
            <Avatar key={status}>
              <AvatarFallback>LH</AvatarFallback>
              <AvatarOnlineIndicator status={status} />
            </Avatar>
          ))}
          {(['info', 'brand', 'success', 'neutral'] as const).map((tone) => (
            <VerifiedTick key={tone} tone={tone} />
          ))}
          <FilterChipBar chips={[{ id: 'a', label: 'State: open', href: '/x' }, 'Auth: none']} onRemove={() => undefined} />
          <FacetFilter>
            <FacetGroup label="Check state">
              <FacetOption label="Responds" name="state" value="open" count={4} defaultChecked />
              <FacetOption label="Timed out" name="state" value="timeout" count={0} disabled />
            </FacetGroup>
          </FacetFilter>
          {(['page', 'card', 'page-minimal', 'card-minimal', 'card-button-group', 'compact'] as const).map((variant) => (
            <Pagination key={variant} variant={variant} pageCount={9} page={4} total={180} pageSize={20} getPageHref={(p) => `/p/${p}`} />
          ))}
          <Pagination pageCount={4} page={1} disabled getPageHref={(p) => `/p/${p}`} />
          <Table scrollRegion="always">
            <TableCaption>Tools</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Search</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Sheet open>
            <SheetContent mobileFullscreen>
              <SheetTitle>Month</SheetTitle>
            </SheetContent>
          </Sheet>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
