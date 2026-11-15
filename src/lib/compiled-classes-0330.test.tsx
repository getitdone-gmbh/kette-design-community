// Guard for library 0.33.0: the planning chart roles of kette-tokens 5.28.0 and the changed component classes must generate CSS through the token preset (SortableList is not in this package).
import { render } from '@testing-library/react';

import { LineBarChart } from '../components/ui/chart';
import { RadioCard, RadioCardGroup } from '../components/ui/radio-cards';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.33.0 classes compile', () => {
  it('generates the utilities of every planning chart role', async () => {
    const roles = ['guideline', 'projection', 'absence', 'non-working'];
    const classes = roles.flatMap((role) => [`stroke-chart-${role}`, `fill-chart-${role}`, `bg-chart-${role}`, `text-chart-${role}`, `border-chart-${role}`]);
    classes.push('bg-chart-subtle-non-working', 'fill-chart-subtle-non-working', 'stroke-chart-subtle-non-working');
    expect(await missingCompiledClasses(classes)).toEqual([]);
  });

  it('generates the classes of the keyboard chart and the radio cards', async () => {
    const { baseElement } = render(
      <>
        <LineBarChart title="t" tooltip categories={['a', 'b']} series={[{ id: 's', label: 'S', values: [1, 2], tone: 'projection' }]} />
        <RadioCardGroup aria-label="Type" defaultValue="a">
          <RadioCard value="a" title="A" description="a" />
        </RadioCardGroup>
      </>,
    );
    expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
  });
});
