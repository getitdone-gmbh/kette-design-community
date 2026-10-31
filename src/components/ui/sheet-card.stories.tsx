import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from './button';
import {
  Sheet,
  SheetBanner,
  SheetBody,
  SheetCodeBlock,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  type SheetBannerProps,
  type SheetMode,
} from './sheet';
import { Step, Stepper } from './stepper';

const meta = {
  id: 'primitives-sheet-card',
  title: 'Primitives · Overlays/Sheet card',
  component: SheetContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Slide out menu card modes: `card` floats a 520 wide rounded panel that hugs its content up to the sheet card max height, `centered` places the same card in the middle above the scrim. Includes the banner (colour, top or bottom), the code block and per-step stepper labels.',
      },
    },
  },
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [{ label: 'Connect' }, { label: 'Sign in' }, { label: 'Choose accounts' }];
const stepsNoLabels = [{}, {}, {}];

const Demo = ({
  mode = 'card',
  banner,
  bannerPosition = 'top',
  code = false,
  stepper,
}: {
  mode?: SheetMode;
  banner?: SheetBannerProps['tone'];
  bannerPosition?: 'top' | 'bottom';
  code?: boolean;
  stepper?: 'labels' | 'dots';
}) => {
  const [open, setOpen] = useState(true);
  const bannerNode = banner ? (
    <SheetBanner
      tone={banner}
      position={bannerPosition}
      icon={banner === 'error' || banner === 'warning' ? <AlertTriangle /> : <Info />}
    >
      This connection needs attention before you continue.
    </SheetBanner>
  ) : null;
  const list = stepper === 'dots' ? stepsNoLabels : steps;
  return (
    <div className="min-h-screen p-6">
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent mode={mode} padded={false}>
          <SheetHeader variant="zero">
            <SheetTitle variant="zero">Connect bank</SheetTitle>
            <SheetDescription>Link an account to import transactions.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            {bannerPosition === 'top' && bannerNode}
            {stepper && (
              <SheetSection>
                <Stepper initialStep={1} steps={list} responsive={false} size="sm">
                  {list.map((step, index) => (
                    <Step key={index} {...step} />
                  ))}
                </Stepper>
              </SheetSection>
            )}
            <SheetSection title="Account" description="Pick the account to connect." />
            {code && (
              <SheetCodeBlock
                label="Terminal"
                code={'npm install @getitdone-gmbh/kette-design-community\nnpm run build'}
                language="Shell"
              />
            )}
            {bannerPosition === 'bottom' && bannerNode}
          </SheetBody>
          <SheetFooter variant="zero">
            <Button variant="outline" size="control-md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="control-md">
              Continue
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const OverlayCard: Story = { render: () => <Demo mode="card" /> };
export const CenteredOverlay: Story = { render: () => <Demo mode="centered" /> };
export const BannerErrorTop: Story = { render: () => <Demo mode="card" banner="error" /> };
export const BannerWarningBottom: Story = {
  render: () => <Demo mode="card" banner="warning" bannerPosition="bottom" />,
};
export const BannerPrimary: Story = { render: () => <Demo mode="centered" banner="primary" /> };
export const CodeBlock: Story = { render: () => <Demo mode="centered" code /> };
export const StepperLabels: Story = { render: () => <Demo mode="centered" stepper="labels" /> };
export const StepperWithoutLabels: Story = { render: () => <Demo mode="centered" stepper="dots" /> };
