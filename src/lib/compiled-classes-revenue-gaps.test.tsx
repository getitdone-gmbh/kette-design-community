// Guard for KETTE-61 and KETTE-63: every class of the new layouts and slots must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { CardDescription } from '../components/ui/card';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { KpiStrip, MetricItem } from '../components/ui/metric';
import { RadioCard, RadioCardGroup } from '../components/ui/radio-cards';
import { Sheet, SheetBody, SheetContent, SheetTitle } from '../components/ui/sheet';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('KETTE-61 and KETTE-63 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for KpiStrip columns, labelAddon, CardDescription, RadioCard and SheetBody in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <KpiStrip aria-label="Auto">
            <MetricItem label="Open" value="24" labelAddon={<span>?</span>} />
            <MetricItem label="Late" value="3" icon={<svg />} labelAddon={<span>?</span>} />
            <MetricItem label="Due" value="5" />
          </KpiStrip>
          <KpiStrip aria-label="Two" columns={2}>
            <MetricItem label="Open" value="24" />
            <MetricItem label="Late" value="3" />
            <MetricItem label="Due" value="5" />
          </KpiStrip>
          <CardDescription>Lead</CardDescription>
          <RadioCardGroup aria-label="Mode" defaultValue="a">
            <RadioCard value="a" title="A" description="Long text" />
          </RadioCardGroup>
          <Sheet open>
            <SheetContent focusOnOpen={false}>
              <SheetTitle>Read</SheetTitle>
              <SheetBody>Body</SheetBody>
            </SheetContent>
          </Sheet>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
