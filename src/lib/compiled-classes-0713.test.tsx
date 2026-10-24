// Guard for 0.27.13: every class of the changed parts must generate CSS, in the default and the zero preset.
import { render } from '@testing-library/react';

import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { Grid } from '../components/ui/grid';
import { PageHeader } from '../components/ui/page-header';
import { SecondaryNav, SecondaryNavLayout } from '../components/ui/secondary-nav';
import { Section } from '../components/ui/section/section';
import { collectRenderedClasses, missingCompiledClasses } from './assert-compiled';

describe('0.27.13 classes compile', () => {
  for (const preset of ['default', 'zero'] as const) {
    it(`generates CSS for the changed parts in the ${preset} preset`, async () => {
      const { baseElement } = render(
        <DesignSystemProvider preset={preset}>
          <Grid className="gap-6" />
          <Section contentClassName="max-w-content mx-auto">
            <p>x</p>
          </Section>
          <SecondaryNavLayout fill contentClassName="overflow-y-auto" nav={<SecondaryNav aria-label="s" orientation="responsive" sections={[{ id: 'a', items: [{ id: 'x', label: 'General' }] }]} />}>
            content
          </SecondaryNavLayout>
          <PageHeader
            title="Invoices"
            tabs={<div role="tablist" aria-label="Scope" />}
            primaryAction={<button type="button">New</button>}
            actions={<button type="button">Export</button>}
            overflow={<div role="menuitem">Export</div>}
          />
          <PageHeader variant="banner" title="Ada" primaryAction={<button type="button">Follow</button>} />
          {(['info', 'success', 'warning', 'destructive'] as const).map((variant) => (
            <Alert key={variant} variant={variant}>
              <AlertDescription>
                Read the{' '}
                <Button variant="link" size="inline">
                  terms
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </DesignSystemProvider>,
      );
      expect(await missingCompiledClasses(collectRenderedClasses(baseElement))).toEqual([]);
    });
  }
});
