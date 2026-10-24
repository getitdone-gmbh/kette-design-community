// Guard for 0.27.9: every class of the linked KPI tiles must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { KpiStrip, MetricItem } from '../components/ui/metric';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.27.9 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for linked KPI tiles in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <KpiStrip aria-label="KPIs">
            <MetricItem label="Open" value="24" href="/open" selected />
            <MetricItem label="Late" value="3" asChild>
              {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- content is merged in by asChild */}
              <a href="/late" />
            </MetricItem>
          </KpiStrip>
          <MetricItem variant="card" label="Views" value="2,000" href="/views" />
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
