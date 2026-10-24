// Guard for 0.27.5: every class of the horizontal and responsive SecondaryNav must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { SecondaryNav } from '../components/ui/secondary-nav';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

const sections = [
  { id: 'a', label: 'Finance', items: [{ id: 'one', label: 'Cockpit', icon: <svg />, count: 3 }, { id: 'two', label: 'Accounts' }] },
  { id: 'b', items: [{ id: 'three', label: 'Settings' }] },
];

describe('0.27.5 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    for (const orientation of ['horizontal', 'responsive'] as const) {
      it(`generates CSS for the ${orientation} SecondaryNav in the ${preset} preset`, async () => {
        const { baseElement } = render(
          <DesignSystemProvider preset={preset}>
            <SecondaryNav aria-label="Finance" orientation={orientation} defaultValue="one" sections={sections} footer={<span>Footer</span>} />
          </DesignSystemProvider>,
        );
        expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
      });
    }
  }
});
