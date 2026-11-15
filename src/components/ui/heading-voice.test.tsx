// LIB-HEADING-ROLE-01 (kette-tokens 5.28.0, WOW-TITLES-01): headings that sit on a text role take the display voice of the theme, so wow draws them in Cinzel.
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { DesignSystemProvider } from './design-system-provider';
import { FacetFilter } from './facet-filter';
import { FormSection } from './form-section';
import { InlineCta } from './inline-cta';
import { PanelSectionHeader } from './section-header';

const display = 'font-family:var(--font-display),sans-serif';

describe('heading display voice', () => {
  it('SectionHeader, FormSection, InlineCta and FacetFilter titles read the display font', () => {
    render(
      <>
        <PanelSectionHeader title="Panel" size="md" />
        <FormSection title="Form" layout="one-column">
          <input aria-label="x" />
        </FormSection>
        <InlineCta title="Cta" />
        <FacetFilter title="Facets" />
      </>,
    );
    for (const name of ['Panel', 'Form', 'Cta', 'Facets']) {
      const heading = screen.getByRole('heading', { name });
      expect(heading.className, name).toContain(display);
      expect(heading.className, name).toContain('typography-');
    }
  });

  it('keeps the text roles and the sheet form title size', () => {
    render(
      <>
        <PanelSectionHeader title="Panel" size="md" />
        <FormSection title="Sheet form" layout="sheet">
          <input aria-label="y" />
        </FormSection>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Panel' })).toHaveClass('typography-ui-lg-semibold');
    expect(screen.getByRole('heading', { name: 'Sheet form' })).toHaveClass('typography-ui-medium');
    // The 13px titles keep the body font: the display voice only goes on titles of 15px and up.
    expect(screen.getByRole('heading', { name: 'Sheet form' }).className).not.toContain('--font-display');
  });

  it('the zero FacetFilter title is 13px and keeps the body font', () => {
    render(
      <DesignSystemProvider preset="zero">
        <FacetFilter title="Zero facets" />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Zero facets' }).className).not.toContain('--font-display');
  });
});
