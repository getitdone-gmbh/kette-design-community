import { render, screen } from '@testing-library/react';
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
