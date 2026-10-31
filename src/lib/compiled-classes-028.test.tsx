// Guard for 0.28.0: every class of the segmented ToggleGroup widths and the Sheet close button must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Sheet, SheetContent, SheetDescription, SheetNavLink, SheetTitle } from '../components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.28.0 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the segmented widths and the sheet navigation in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <ToggleGroup type="single" variant="segmented" aria-label="Fit">
            <ToggleGroupItem value="a">A</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" variant="segmented" fullWidth aria-label="Full">
            <ToggleGroupItem value="a">A</ToggleGroupItem>
          </ToggleGroup>
          <Sheet open>
            <SheetContent>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Sections</SheetDescription>
              <SheetNavLink href="#one">One</SheetNavLink>
            </SheetContent>
          </Sheet>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
