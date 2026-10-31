import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from './button';
import { DocumentSurface } from './document-surface';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';

const meta = {
  id: 'primitives-form',
  title: 'Primitives · Inputs/Form',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const EmailField = () => {
  const form = useForm({ defaultValues: { email: 'not-an-email' } });
  // Error shown from the first render, like a server-side validation result.
  useEffect(() => form.setError('email', { type: 'manual', message: 'Enter a valid email address.' }), [form]);
  return (
    <Form {...form}>
      <form className="flex w-full max-w-sm flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>We only use it to send the invoice.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

// Parses an rgb()/color() computed value into 0 to 255 channels.
const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const lum = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// First opaque background up the tree.
const surfaceOf = (el: HTMLElement) => {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!/rgba\(.*,\s*0\)$|transparent/.test(bg)) return channels(bg);
  }
  return [255, 255, 255];
};

const playError: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const message = await canvas.findByText('Enter a valid email address.');
  const label = canvas.getByText('Email');
  // The message and the label both turn into error text that stays at 4.5:1 or better on their surface (WCAG 1.4.3). The raw error swatch (3.76:1 on white) is not allowed for text.
  await waitFor(() => {
    for (const el of [message, label]) {
      expect(ratio(channels(getComputedStyle(el).color), surfaceOf(el))).toBeGreaterThanOrEqual(4.5);
    }
  });
};

// Error state of FormLabel and FormMessage on the app surface (switch the toolbar between light and dark).
export const Error: Story = { render: () => <EmailField />, play: playError };

// The same on the document paper, which stays white in dark mode.
export const ErrorOnPaper: Story = {
  render: () => (
    <DocumentSurface>
      <EmailField />
    </DocumentSurface>
  ),
  play: playError,
};

// Validation timing like react-hook-form on submit: the field is valid first, then the error appears. The message is inserted as an alert, so a screen reader announces it once (WCAG 4.1.3), and the input points to it through aria-describedby with aria-invalid.
const SubmitField = () => {
  const form = useForm({ defaultValues: { email: '' } });
  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        noValidate
        onSubmit={form.handleSubmit(() => undefined)}
      >
        <FormField
          control={form.control}
          name="email"
          rules={{ required: 'Enter your email address.' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>We only use it to send the invoice.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Send</Button>
      </form>
    </Form>
  );
};

export const ErrorAnnounced: Story = {
  render: () => <SubmitField />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');
    expect(canvas.queryByRole('alert')).toBeNull();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    const alert = await canvas.findByRole('alert');
    expect(alert).toHaveTextContent('Enter your email address.');
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
    expect(canvas.getAllByRole('alert')).toHaveLength(1);
  },
};
