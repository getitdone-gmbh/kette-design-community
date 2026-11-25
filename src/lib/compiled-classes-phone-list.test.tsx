// Guard for ZERO-911: every class of the phone list mode of Table and DataGrid (container query variants, grid areas, chevron, state rows) must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { DataGrid } from '../components/ui/data-grid';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableLeadCell, TableRow } from '../components/ui/table';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('phone list classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the phone list in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Table phone="list">
            <TableHeader>
              <TableRow>
                <TableHead select aria-label="Select all" />
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow onClick={() => undefined} selected>
                <TableCell phone="lead">dot</TableCell>
                <TableCell phone="title">Frontend</TableCell>
                <TableCell phone="subtitle">Nordwind Handel</TableCell>
                <TableCell phone="value">Open</TableCell>
                <TableCell phone="meta">Today</TableCell>
                <TableCell phone="hidden">x</TableCell>
              </TableRow>
              <TableRow>
                <TableLeadCell name="Nordwind Handel" supportingText="nordwind.example.com" />
                <TableCell>1,200</TableCell>
              </TableRow>
              <TableEmpty columns={5} />
            </TableBody>
          </Table>
          <DataGrid phone="list" selectable columns={[{ id: 'title', header: 'Title', priority: 2 }]} rows={[{ id: 'a', title: 'A' }]} getRowId={(r) => r.id} onRowClick={() => undefined} />
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
