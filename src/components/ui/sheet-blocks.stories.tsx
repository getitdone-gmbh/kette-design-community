import type { Meta, StoryObj } from '@storybook/react';
import { ChevronsUpDown, Plus, X } from 'lucide-react';
import * as React from 'react';

import { Button } from './button';
import { Chip } from './chip';
import { SheetSection } from './sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { TableSelectCell, TableToggleCell } from './table-cells';

const meta = {
  id: 'patterns-sheet-blocks',
  title: 'Patterns · Interface/Sheet blocks',
  component: SheetSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Table blocks for slide out menu content (Figma Sheet block Types Workdays table, Stage table, Language table). They are compositions of Table, the table cells and Button, so no domain code lives in the primitives.',
      },
    },
  },
} satisfies Meta<typeof SheetSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[520px] max-w-full rounded-surface border border-solid border-border-default bg-background p-6">
    {children}
  </div>
);

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WorkdaysTable: Story = {
  render: () => (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Works</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead align="right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((day, index) => {
            const works = index < 5;
            return (
              <TableRow key={day}>
                <TableCell>{day}</TableCell>
                <TableToggleCell label={`${day} is a workday`} defaultChecked={works} />
                <TableCell className="text-text-subtle">{works ? '09:00' : '-'}</TableCell>
                <TableCell className="text-text-subtle">{works ? '17:30' : '-'}</TableCell>
                <TableCell align="right">{works ? '8.0' : '0.0'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Frame>
  ),
};

const stages = [
  { name: 'Lead', probability: '10%', days: '14', dot: 'bg-data-stage-1' },
  { name: 'Contacted', probability: '25%', days: '10', dot: 'bg-data-stage-2' },
  { name: 'Proposal', probability: '60%', days: '7', dot: 'bg-data-stage-3' },
  { name: 'Won', probability: '100%', days: '0', dot: 'bg-data-stage-4' },
];

export const StageTable: Story = {
  render: () => (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="sr-only">Reorder</span>
            </TableHead>
            <TableHead>Stage</TableHead>
            <TableHead align="right">Probability</TableHead>
            <TableHead align="right">Days without activity</TableHead>
            <TableHead>
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.name}>
              <TableCell>
                <Button variant="ghost" size="icon-sm" aria-label={`Reorder ${stage.name}`}>
                  <ChevronsUpDown aria-hidden="true" className="h-icon-sm w-icon-sm" />
                </Button>
              </TableCell>
              <TableCell>
                <Chip variant="outline" size="small" dotLeading dotColor={stage.dot} label={stage.name} />
              </TableCell>
              <TableCell align="right">{stage.probability}</TableCell>
              <TableCell align="right">{stage.days}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${stage.name}`}>
                  <X aria-hidden="true" className="h-icon-sm w-icon-sm" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="outline" size="sm" className="mt-3">
        <Plus aria-hidden="true" className="h-icon-sm w-icon-sm" />
        Stage
      </Button>
    </Frame>
  ),
};

const levels = [
  { value: 'a2', label: 'A2' },
  { value: 'b2', label: 'B2' },
  { value: 'c1', label: 'C1' },
  { value: 'native', label: 'Native' },
];

const LanguageTableDemo = () => {
  const [rows, setRows] = React.useState([
    { language: 'English', level: 'c1' },
    { language: 'German', level: 'native' },
    { language: 'Spanish', level: 'b2' },
  ]);
  return (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Language</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.language}>
              <TableCell>{row.language}</TableCell>
              <TableSelectCell label={`Level for ${row.language}`} options={levels} defaultValue={row.level} />
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${row.language}`}
                  onClick={() => setRows((all) => all.filter((r) => r !== row))}
                >
                  <X aria-hidden="true" className="h-icon-sm w-icon-sm" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setRows((all) => [...all, { language: `Language ${all.length + 1}`, level: 'b2' }])}
      >
        <Plus aria-hidden="true" className="h-icon-sm w-icon-sm" />
        Language
      </Button>
    </Frame>
  );
};

export const LanguageTable: Story = { render: () => <LanguageTableDemo /> };
