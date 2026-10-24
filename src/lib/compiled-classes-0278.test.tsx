// Guard for 0.27.8: every class of the new and changed parts must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { CookieConsent } from '../components/ui/cookie-consent';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Grid } from '../components/ui/grid/Grid';
import { PageHeader } from '../components/ui/page-header';
import { SecondaryNav, SecondaryNavLayout } from '../components/ui/secondary-nav';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

const noop = () => undefined;

describe('0.27.8 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the changed parts in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Grid />
          <p>
            Read the{' '}
            <Button variant="link" size="inline">
              docs
            </Button>
          </p>
          <Card>
            <CardHeader actions={<button type="button">Sync</button>}>
              <CardTitle>Title</CardTitle>
            </CardHeader>
          </Card>
          <SecondaryNavLayout nav={<SecondaryNav aria-label="s" orientation="responsive" sections={[{ id: 'a', items: [{ id: 'x', label: 'General' }] }]} />}>
            content
          </SecondaryNavLayout>
          <PageHeader title="Invoices" primaryAction={<button type="button">New</button>} actions={<button type="button">Export</button>} overflow={<div role="menuitem">Export</div>} />
          <CookieConsent title="Cookies" description="x" size="sm" positioning="static" categories={[{ id: 'a', title: 'A' }]} onAccept={noop} onDecline={noop} />
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
