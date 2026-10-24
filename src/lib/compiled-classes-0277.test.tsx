// Guard for 0.27.7: every class of the compact Card, the header action grid and the responsive ListItem must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { ListItem } from '../components/ui/list-item';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.27.7 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the compact Card and the responsive ListItem in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Card container density="compact">
            <CardHeader divider accent actions={<button type="button">Act</button>}>
              <CardTitle>Title</CardTitle>
            </CardHeader>
            <CardContent>
              <ListItem responsive title="Row" subtitle="Sub" lead={<svg />} trailing={<button type="button">Go</button>} />
            </CardContent>
            <CardFooter divider>Footer</CardFooter>
          </Card>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
