import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DesignSystemProvider } from './design-system-provider';
import { FormErrorSummary } from './form-error-summary';

const errors = [
  { fieldId: 'name', message: 'Enter a name' },
  { fieldId: 'email', message: 'Enter a valid email' },
];

const Fields = () => (
  <>
    <input id="name" aria-label="Name" />
    <input id="email" aria-label="Email" />
  </>
);

// R-LIB-07 (ZERO-10, ZERO-56): "Fix N fields to continue." with links to the faulty fields.
describe('FormErrorSummary (R-LIB-07)', () => {
  it('names the count, lists every error and is an alert', () => {
    render(<FormErrorSummary errors={errors} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Fix 2 fields to continue.');
    expect(screen.getByRole('link', { name: 'Enter a name' })).toHaveAttribute('href', '#name');
    expect(screen.getByRole('link', { name: 'Enter a valid email' })).toBeInTheDocument();
  });

  it('focuses the field of an entry when it is activated', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Fields />
        <FormErrorSummary errors={errors} />
      </>,
    );
    await user.click(screen.getByRole('link', { name: 'Enter a valid email' }));
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  // DR-PKG5-02: the title is not smaller than its entries (same link-sm role, semibold). CR-LIB-02: 8px between entries for WCAG 2.5.8 without a consumer override.
  it('sets the title in the type role of the entries and keeps 8px between the entries', () => {
    render(<FormErrorSummary errors={errors} />);
    const title = screen.getByText('Fix 2 fields to continue.');
    expect(title).toHaveClass('typography-link-sm', 'font-semibold', 'text-text-destructive');
    expect(title.className).not.toMatch(/typography-ui-sm|text-xs/);
    expect(screen.getByRole('list')).toHaveClass('gap-2');
    expect(screen.getByRole('list')).not.toHaveClass('gap-1');
  });

  it('calls onFocusField instead when given', async () => {
    const user = userEvent.setup();
    const onFocusField = vi.fn();
    render(<FormErrorSummary errors={errors} onFocusField={onFocusField} />);
    await user.click(screen.getByRole('link', { name: 'Enter a name' }));
    expect(onFocusField).toHaveBeenCalledWith('name');
  });

  it('renders nothing with no error or one error (that one stays at its field)', () => {
    const { container, rerender } = render(<FormErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FormErrorSummary errors={[errors[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('speaks German with the German locale and takes a title override with {n}', () => {
    const { rerender } = render(
      <DesignSystemProvider locale="de">
        <FormErrorSummary errors={errors} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte 2 Felder korrigieren, um fortzufahren.');
    rerender(<FormErrorSummary errors={errors} labels={{ title: '{n} problems' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('2 problems');
  });
});
