import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';

import { Card, CardContent } from './card';
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';

const meta = {
  id: 'primitives-carousel',
  title: 'Primitives · Layout/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args) => (
  <div className="preview flex min-h-[350px] w-full justify-center p-10 items-center">
    <Carousel
      opts={{
        align: 'start',
      }}
      className="w-full max-w-sm"
    >
      <CarouselPrevious />
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNext />
    </Carousel>
  </div>
);

const defaultArgs = {};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args) => Component(args),
};

// Slides with dot or line pagination below (Figma Carousel image pagination).
export const WithDots: Story = {
  render: () => (
    <div className="flex min-h-[350px] w-full justify-center p-10">
      <Carousel className="w-full max-w-sm" aria-label="Photos">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="flex aspect-video items-center justify-center p-6">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-3 flex justify-center">
          <CarouselDots indicator="line" framed />
        </div>
      </Carousel>
    </div>
  ),
};

// Figma Carousel image: arrows and the dot group laid over the slide image (Theme Primary | Dark | Light, Size md | lg).
export const ImageOverlay: Story = {
  render: () => (
    <div className="flex w-full justify-center p-10">
      <Carousel className="w-[640px]" aria-label="Photos">
        <CarouselContent>
          {Array.from({ length: 4 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="flex h-[400px] items-center justify-center rounded-control bg-muted text-3xl font-semibold">{index + 1}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious overlayTone="dark" overlaySize="lg" />
        <CarouselNext overlayTone="dark" overlaySize="lg" />
        <CarouselDots overlay tone="gray-dark-bg" size="lg" framed />
      </Carousel>
    </div>
  ),
};

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de` translates the arrow and dot names. `CarouselPrevious` takes `previousLabel`, `CarouselNext` takes `nextLabel` and `CarouselDots` takes `slideLabel` (string or function of slide and count). Props win over the provider.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <div className="flex min-h-[200px] w-full items-center justify-center p-10">
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {[1, 2, 3].map((n) => (
              <CarouselItem key={n}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">{n}</CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious previousLabel="Eins zurück" />
          <CarouselNext />
          <CarouselDots />
        </Carousel>
      </div>
    </DesignSystemProvider>
  ),
};
