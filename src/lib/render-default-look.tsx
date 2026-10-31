import * as React from 'react';
import { render as rtlRender, type RenderOptions, type RenderResult } from '@testing-library/react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';

// Since 0.5.0 the package default look is `zero`. Tests that pin the values of the `default` look import `render` from here: it renders under `<DesignSystemProvider preset="default">`. A test that wraps its own `preset="zero"` provider still wins, because the inner provider overrides.
const DefaultLook = ({ children }: { children?: React.ReactNode }) => <DesignSystemProvider preset="default">{children}</DesignSystemProvider>;

export const render = (ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>): RenderResult => {
  const Outer = options?.wrapper;
  const wrapper = Outer
    ? ({ children }: { children?: React.ReactNode }) => (
        <DefaultLook>
          <Outer>{children}</Outer>
        </DefaultLook>
      )
    : DefaultLook;
  return rtlRender(ui, { ...options, wrapper });
};
