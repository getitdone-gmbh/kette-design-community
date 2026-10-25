import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { contrast, loadThemes } from '../../lib/token-contrast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';

const Field = () => {
  const form = useForm({ defaultValues: { email: '' } });
  useEffect(() => form.setError('email', { type: 'manual', message: 'Enter a valid email address.' }), [form]);
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
};

describe('Form error text', () => {
  it('colours the label and the message with the destructive text role, not the raw error swatch', async () => {
    render(<Field />);
    for (const el of [screen.getByText('Email'), await screen.findByText('Enter a valid email address.')]) {
      expect(el).toHaveClass('text-text-destructive');
      expect(el.className).not.toMatch(/(^|\s)text-error(\s|$)/);
    }
  });

  it('the destructive text token passes 4.5:1 on the background in every theme, light and dark', () => {
    const failing: string[] = [];
    for (const theme of loadThemes()) {
      for (const mode of ['light', 'dark'] as const) {
        const t = theme[mode];
        if (!t['text-destructive'] || !t.background) continue;
        failing.push(...(contrast(t['text-destructive'], t.background) >= 4.5 ? [] : [`${theme.name} ${mode}`]));
      }
    }
    expect(failing).toEqual([]);
  });
});

describe('FormMessage live region', () => {
  it('announces a validation error as an alert and wires the field to it', async () => {
    render(<Field />);
    const message = await screen.findByText('Enter a valid email address.');
    expect(message).toHaveAttribute('role', 'alert');
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(message.id);
  });

  it('has no alert and no message element while the field is valid', () => {
    const Valid = () => {
      const form = useForm({ defaultValues: { email: '' } });
      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      );
    };
    render(<Valid />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('keeps plain helper children free of a live role', () => {
    const Helper = () => {
      const form = useForm({ defaultValues: { email: '' } });
      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={() => (
              <FormItem>
                <FormMessage>Optional</FormMessage>
              </FormItem>
            )}
          />
        </Form>
      );
    };
    render(<Helper />);
    expect(screen.getByText('Optional')).not.toHaveAttribute('role');
  });

  it('does not insert a second alert when the form re-renders with the same error', async () => {
    const { rerender } = render(<Field />);
    await screen.findByRole('alert');
    rerender(<Field />);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('announces again with the new text when the message changes, and removes the alert once the error clears', async () => {
    const Changing = () => {
      const form = useForm({ defaultValues: { email: '' } });
      return (
        <Form {...form}>
          <button type="button" onClick={() => form.setError('email', { type: 'manual', message: 'Too short.' })}>first</button>
          <button type="button" onClick={() => form.setError('email', { type: 'manual', message: 'Not an email.' })}>second</button>
          <button type="button" onClick={() => form.clearErrors('email')}>clear</button>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input aria-label="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      );
    };
    render(<Changing />);
    fireEvent.click(screen.getByText('first'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too short.');
    fireEvent.click(screen.getByText('second'));
    expect(await screen.findByText('Not an email.')).toHaveAttribute('role', 'alert');
    fireEvent.click(screen.getByText('clear'));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
