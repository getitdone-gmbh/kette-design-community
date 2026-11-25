import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { Field } from './field';
import { Input } from './input';

// R-LIB-06 (ZERO-10, ZERO-56): a form field without react-hook-form.
describe('Field (R-LIB-06)', () => {
  it('labels the control and wires error and hint into aria-describedby', () => {
    render(
      <Field id="vat" label="VAT ID" hint="With country code" error="Enter a valid VAT ID">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('VAT ID');
    expect(input).toHaveAttribute('id', 'vat');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual(['vat-error', 'vat-hint']);
    expect(document.getElementById('vat-error')).toHaveTextContent('Enter a valid VAT ID');
    expect(document.getElementById('vat-hint')).toHaveTextContent('With country code');
  });

  it('puts the error above the hint', () => {
    render(
      <Field id="vat" label="VAT ID" hint="Hint" error="Error">
        <Input />
      </Field>,
    );
    const error = document.getElementById('vat-error') as HTMLElement;
    const hint = document.getElementById('vat-hint') as HTMLElement;
    expect(error.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('sets no aria-invalid and no error id without an error', () => {
    render(
      <Field id="name" label="Name" hint="As on the invoice">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('aria-describedby', 'name-hint');
    expect(document.getElementById('name-error')).toBeNull();
  });

  it('marks required fields with a hidden star and aria-required on the control', () => {
    render(
      <Field id="email" label="Email" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-required', 'true');
    const star = screen.getByText('*');
    expect(star).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a describedby of the control itself', () => {
    render(
      <Field id="iban" label="IBAN" hint="Hint">
        <Input aria-describedby="extra" />
      </Field>,
    );
    expect(screen.getByLabelText('IBAN').getAttribute('aria-describedby')?.split(' ')).toEqual(['iban-hint', 'extra']);
  });

  it('shows the error but leaves it out of describedby with describeError false', () => {
    render(
      <Field id="rate" label="Rate" error="Too high" describeError={false}>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Rate');
    expect(screen.getByText('Too high')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('hands the control props to a render function for controls behind a wrapper', () => {
    render(
      <Field id="secret" label="Secret" error="Required" hint="Hint" required>
        {(control, ids) => (
          <div data-testid="wrapper" data-label-id={ids.labelId}>
            <Input {...control} />
          </div>
        )}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Secret' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input.getAttribute('aria-describedby')).toBe('secret-error secret-hint');
    expect(screen.getByTestId('wrapper')).toHaveAttribute('data-label-id', 'secret-label');
    expect(document.getElementById('secret-label')).toHaveTextContent('Secret');
  });

  it('spans the whole form grid with wide', () => {
    const { container } = render(
      <Field id="notes" label="Notes" wide>
        <Input />
      </Field>,
    );
    expect(container.firstElementChild).toHaveClass('col-span-full');
  });

  it('uses the settings field spacing: label 8 above, error and hint 4 below', () => {
    const { container } = render(
      <Field id="notes" label="Notes" hint="Hint">
        <Input />
      </Field>,
    );
    expect(container.firstElementChild).toHaveClass('flex', 'flex-col', 'gap-2');
    expect(document.getElementById('notes-hint')?.parentElement).toHaveClass('flex', 'flex-col', 'gap-1');
  });
});
