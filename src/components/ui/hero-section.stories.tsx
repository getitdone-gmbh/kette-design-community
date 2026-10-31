import type { Meta, StoryObj } from '@storybook/react';
import { Play } from 'lucide-react';

import { Button } from './button';
import { HeroSection } from './hero-section';

const meta = {
  id: 'patterns-hero-section',
  title: 'Patterns · Interface/Hero section',
  component: HeroSection,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    eyebrow: 'backoffice · Part of the workload.zero suite',
    headline: 'Time, invoices and DATEV in one place.',
    supportingText: 'For freelancers and small companies: approved hours become the invoice, the invoice becomes the DATEV document.',
    primaryAction: <Button variant="primary">Start for free</Button>,
    secondaryAction: <Button variant="outline" icon={<Play />}>Watch demo</Button>,
    productShot: <div className="typography-ui flex h-80 items-center justify-center text-text-subtle-on-muted">Product screenshot (app frame)</div>,
  },
} satisfies Meta<typeof HeroSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Minimal: Story = { args: { eyebrow: undefined, secondaryAction: undefined, productShot: undefined } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const Inverse: Story = { args: { tone: 'inverse' } };
