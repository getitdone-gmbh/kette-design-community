// Guard for 0.27.3: every class of the inline link size must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Button } from '../components/ui/button';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.27.3 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the inline link size in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <p>
            Read the{' '}
            <Button variant="link" size="inline">
              docs
            </Button>
          </p>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
