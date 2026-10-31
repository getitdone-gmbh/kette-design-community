import type { Meta, StoryObj } from '@storybook/react';

import { MonthGrid, MonthGridCell, WeekGrid, WeekGridCell, WeekGridEntry, WeekGridRow, WeekGridTotals } from './calendar-grid';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-calendar-grids',
  title: 'Patterns · Data/Calendar grids',
  component: WeekGrid,
  tags: ['autodocs'],
  // onRetry shows the error button
  parameters: { actions: { argTypesRegex: '^on(?!Retry)[A-Z].*' } },
  args: {
    'aria-label': 'Week 41',
    rowHeaderLabel: 'Project',
    totalLabel: 'Total',
    columns: [
      { id: 'mon', label: 'Mon 6' },
      { id: 'tue', label: 'Tue 7', today: true },
      { id: 'wed', label: 'Wed 8' },
    ],
  },
} satisfies Meta<typeof WeekGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = (
  <>
    <WeekGridRow header="Website relaunch" total="26:00">
      <WeekGridCell>
        <WeekGridEntry project={1}>8:00 h</WeekGridEntry>
      </WeekGridCell>
      <WeekGridCell>
        <WeekGridEntry project={1} selected onClick={() => {}}>
          6:30 h
        </WeekGridEntry>
      </WeekGridCell>
      <WeekGridCell />
    </WeekGridRow>
    <WeekGridRow header="Internal" total="5:00">
      <WeekGridCell>
        <WeekGridEntry project={2}>1:00 h</WeekGridEntry>
      </WeekGridCell>
      <WeekGridCell />
      <WeekGridCell>
        <WeekGridEntry tone="suggested" project={2}>
          + 2:00 h
        </WeekGridEntry>
      </WeekGridCell>
    </WeekGridRow>
    <WeekGridRow header="Acme onboarding" total="16:30">
      <WeekGridCell />
      <WeekGridCell>
        <WeekGridEntry tone="warning" project={3}>
          10:00 h
        </WeekGridEntry>
      </WeekGridCell>
      <WeekGridCell>
        <WeekGridEntry tone="error" project={3}>
          12:00 h
        </WeekGridEntry>
      </WeekGridCell>
    </WeekGridRow>
    <WeekGridTotals values={['9:00', '16:30', '12:00']} total="47:30" />
  </>
);

export const Time: Story = { args: { children: rows } };
export const Shift: Story = {
  args: {
    rowHeaderLabel: 'Member',
    children: (
      <>
        <WeekGridRow header="Anna Becker" total="32 h">
          <WeekGridCell>
            <WeekGridEntry project={1}>08-16</WeekGridEntry>
          </WeekGridCell>
          <WeekGridCell>
            <WeekGridEntry tone="ok">06-14</WeekGridEntry>
          </WeekGridCell>
          <WeekGridCell />
        </WeekGridRow>
      </>
    ),
  },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorState: Story = { args: { state: 'error' } };

const days = Array.from({ length: 14 }, (_, i) => i + 1);

export const Month: StoryObj<typeof MonthGrid> = {
  render: (args) => (
    <MonthGrid {...args} aria-label="October">
      {days.map((d) => (
        <MonthGridCell key={d} day={d} label={`October ${d}`} outside={d === 1} nonWorking={d % 7 === 6 || d % 7 === 0} today={d === 9} selected={d === 10 ? true : undefined} note={d === 8 ? 'Vacation' : undefined}>
          {d > 1 && d % 7 !== 6 && d % 7 !== 0 && d !== 8 ? <WeekGridEntry project={1}>8:00 h</WeekGridEntry> : null}
        </MonthGridCell>
      ))}
    </MonthGrid>
  ),
};
// Five day layout: Saturday and Sunday cells are passed as usual and hidden, week totals stay correct.
export const MonthWeekdaysOnly: StoryObj<typeof MonthGrid> = {
  render: (args) => (
    <MonthGrid {...args} aria-label="October" weekdaysOnly weekTotals={['32:00', '40:00']}>
      {days.map((d) => (
        <MonthGridCell key={d} day={d} label={`October ${d}`} outside={d === 1}>
          {d > 1 && d % 7 !== 6 && d % 7 !== 0 ? <WeekGridEntry project={1}>8:00 h</WeekGridEntry> : null}
        </MonthGridCell>
      ))}
    </MonthGrid>
  ),
};
export const MonthLoading: StoryObj<typeof MonthGrid> = { render: () => <MonthGrid aria-label="October" state="loading" /> };
export const MonthEmpty: StoryObj<typeof MonthGrid> = { render: () => <MonthGrid aria-label="October" state="empty" /> };
export const MonthError: StoryObj<typeof MonthGrid> = { render: () => <MonthGrid aria-label="October" state="error" onRetry={() => {}} /> };

const manyColumns = ['Mon 6', 'Tue 7', 'Wed 8', 'Thu 9', 'Fri 10', 'Sat 11', 'Sun 12'].map((label, i) => ({ id: String(i), label }));

// Narrow container: the day columns keep their width and scroll, the row titles stay in place.
export const NarrowScrollWithStickyColumn: Story = {
  render: (args) => (
    <div className="w-80">
      <WeekGrid {...args} columns={manyColumns}>
        <WeekGridRow header="Website relaunch" total="26:00">
          {manyColumns.map((c, i) => (
            <WeekGridCell key={c.id}>{i < 5 ? <WeekGridEntry project={1}>5:12 h</WeekGridEntry> : null}</WeekGridCell>
          ))}
        </WeekGridRow>
        <WeekGridTotals values={manyColumns.map(() => '5:12')} total="26:00" />
      </WeekGrid>
    </div>
  ),
};

export const AddAffordance: Story = {
  render: (args) => (
    <WeekGrid {...args}>
      <WeekGridRow header="Website relaunch" total="8:00">
        <WeekGridCell>
          <WeekGridEntry dotColor="#7c3aed">8:00 h</WeekGridEntry>
        </WeekGridCell>
        <WeekGridCell onAdd={() => {}} addLabel="Log time for Website relaunch, Tue 7" />
        <WeekGridCell onAdd={() => {}} />
      </WeekGridRow>
    </WeekGrid>
  ),
};

export const EntryColors: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-2">
      <WeekGridEntry project={3}>Project slot 3</WeekGridEntry>
      <WeekGridEntry dotColor="bg-data-project-5">Token utility</WeekGridEntry>
      <WeekGridEntry dotColor="#e11d48">CSS colour</WeekGridEntry>
    </div>
  ),
};

export const MonthWithAdd: StoryObj<typeof MonthGrid> = {
  render: (args) => (
    <MonthGrid {...args} aria-label="October">
      {days.map((d) => (
        <MonthGridCell key={d} day={d} label={`October ${d}`} onAdd={() => {}} />
      ))}
    </MonthGrid>
  ),
};

export const MonthWeekTotalsAndHoliday: StoryObj<typeof MonthGrid> = {
  render: (args) => (
    <MonthGrid {...args} aria-label="October" weekTotals={['40:00', '32:00']}>
      {days.map((d) => (
        <MonthGridCell key={d} day={d} label={`October ${d}`} nonWorking={d % 7 === 6 || d % 7 === 0} holiday={d === 3} note={d === 3 ? 'Day of German Unity' : undefined} />
      ))}
    </MonthGrid>
  ),
};

export const WeekDayColumns: StoryObj<typeof WeekGrid> = {
  render: () => (
    <WeekGrid aria-label="Week 41" layout="day-columns" columns={[{ id: 'mon', label: 'Mon 6' }, { id: 'tue', label: 'Tue 7', today: true }, { id: 'wed', label: 'Wed 8' }]}>
      <WeekGridRow>
        <WeekGridCell>
          <WeekGridEntry project={1}>Website relaunch 4:00 h</WeekGridEntry>
          <WeekGridEntry project={2}>Support 2:00 h</WeekGridEntry>
        </WeekGridCell>
        <WeekGridCell>
          <WeekGridEntry project={1}>Website relaunch 8:00 h</WeekGridEntry>
        </WeekGridCell>
        <WeekGridCell onAdd={() => {}} addLabel="Log time, Wed 8" />
      </WeekGridRow>
      <WeekGridTotals values={['6:00', '8:00', '0:00']} />
    </WeekGrid>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
