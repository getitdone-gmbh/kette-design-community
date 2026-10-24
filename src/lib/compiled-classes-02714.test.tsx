// Guard for 0.27.14: every class of the changed parts must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Card as CardComposable } from '../components/ui/card/Card';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Label } from '../components/ui/label';
import { Toast, ToastClose, ToastProvider, ToastViewport } from '../components/ui/toast';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.27.14 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the changed parts in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <ToastProvider>
            {(['default', 'destructive', 'inverse'] as const).map((variant) => (
              <Toast key={variant} variant={variant} open>
                <ToastClose />
              </Toast>
            ))}
            <ToastViewport />
          </ToastProvider>
          <Avatar onClick={() => {}} aria-label="Profile">
            <AvatarFallback>AF</AvatarFallback>
          </Avatar>
          <Card disabled />
          <CardComposable disabled />
          <Label>Name</Label>
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
