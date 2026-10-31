// Guard for 0.28.1: every class of the gated AvatarUpload, Link and ButtonGroupItem must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Avatar, AvatarFallback, AvatarUpload } from '../components/ui/avatar';
import { ButtonGroup, ButtonGroupItem } from '../components/ui/button-group';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Link } from '../components/ui/link';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.28.1 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the gated controls in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Avatar size="profile">
            <AvatarFallback>AF</AvatarFallback>
            <AvatarUpload aria-disabled="true" />
          </Avatar>
          <Link href="/x" aria-disabled="true">
            Docs
          </Link>
          <Link href="/x" disabled>
            Docs
          </Link>
          <ButtonGroup aria-label="View">
            <ButtonGroupItem aria-disabled="true">Board</ButtonGroupItem>
          </ButtonGroup>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
