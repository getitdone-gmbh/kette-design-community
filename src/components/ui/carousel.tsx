'use client';

import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { PaginationDotGroup, type PaginationDotGroupProps } from './pagination-dot-group';
import { useLabels } from './labels-context';
import type { LabelProp } from './labels';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = 'horizontal', opts, setApi, plugins, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'horizontal' ? 'x' : 'y',
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api?.off('reInit', onSelect);
        api?.off('select', onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn('relative w-full', className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            '[&_[data-id="carousel-item"]]:first:pl-0',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        data-id="carousel-item"
        className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-4' : 'pt-4', className)}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = 'CarouselItem';

// Figma Carousel image arrows: round buttons laid over the image. `md` is 40px with a 20px chevron at 16px from the edge,
// `lg` is 42px with a 24px chevron at 20px. Tone follows the Figma Theme: Primary, Dark or Light.
export type CarouselOverlayTone = 'primary' | 'dark' | 'light';
export interface CarouselOverlayProps {
  // Opt in to the round arrow laid over the slide image. Without it the arrow keeps its outline look outside the slides.
  overlayTone?: CarouselOverlayTone;
  overlaySize?: 'md' | 'lg';
}

const overlayToneClass: Record<CarouselOverlayTone, string> = {
  primary: 'border-transparent bg-primary-700 text-static-white hover:bg-primary-800',
  dark: 'border-transparent bg-static-black/90 text-static-white backdrop-blur-sm hover:bg-static-black',
  light: 'border-transparent bg-background text-icon-default backdrop-blur-sm hover:bg-muted',
};

const overlayArrowClass = (tone: CarouselOverlayTone, size: 'md' | 'lg', side: 'left' | 'right') =>
  cn(
    'absolute top-1/2 -translate-y-1/2 rounded-full p-0',
    size === 'lg' ? 'h-control-lg w-control-lg' : 'h-control-md w-control-md',
    side === 'left' ? (size === 'lg' ? 'left-5' : 'left-4') : size === 'lg' ? 'right-5' : 'right-4',
    overlayToneClass[tone],
  );

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button> & CarouselOverlayProps & { previousLabel?: string }>(
  ({ className, variant = 'outline', size = 'icon', overlayTone, overlaySize = 'md', previousLabel, ...props }, ref) => {
    const l = useLabels({ previousSlide: previousLabel });
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    if (overlayTone) {
      return (
        <Button
          type="button"
          ref={ref}
          variant="ghost"
          size="no-size"
          className={cn(overlayArrowClass(overlayTone, overlaySize, 'left'), className)}
          disabled={!canScrollPrev}
          onClick={scrollPrev}
          {...props}
        >
          <ChevronLeft aria-hidden="true" className={overlaySize === 'lg' ? 'h-icon-lg w-icon-lg' : 'h-icon-md w-icon-md'} />
          <span className="sr-only">{l.previousSlide}</span>
        </Button>
      );
    }

    return (
      <Button
        type="button"
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">{l.previousSlide}</span>
      </Button>
    );
  },
);
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button> & CarouselOverlayProps & { nextLabel?: string }>(
  ({ className, variant = 'outline', size = 'icon', overlayTone, overlaySize = 'md', nextLabel, ...props }, ref) => {
    const l = useLabels({ nextSlide: nextLabel });
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    if (overlayTone) {
      return (
        <Button
          type="button"
          ref={ref}
          variant="ghost"
          size="no-size"
          className={cn(overlayArrowClass(overlayTone, overlaySize, 'right'), className)}
          disabled={!canScrollNext}
          onClick={scrollNext}
          {...props}
        >
          <ChevronRight aria-hidden="true" className={overlaySize === 'lg' ? 'h-icon-lg w-icon-lg' : 'h-icon-md w-icon-md'} />
          <span className="sr-only">{l.nextSlide}</span>
        </Button>
      );
    }

    return (
      <Button
        type="button"
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">{l.nextSlide}</span>
      </Button>
    );
  },
);
CarouselNext.displayName = 'CarouselNext';

export type CarouselDotsProps = Omit<PaginationDotGroupProps, 'count' | 'current' | 'onSelect'> & {
  // Accessible name of each dot from the 1 based slide and the count. Wins over the provider text.
  slideLabel?: LabelProp<[number, number]>;
  // Lays the group over the slide image, centred 16px from the bottom (Figma Carousel image).
  overlay?: boolean;
};

// Dot or line indicators bound to the carousel (Figma Carousel image pagination). Each indicator scrolls to its slide.
const CarouselDots = React.forwardRef<HTMLDivElement, CarouselDotsProps>(({ getItemLabel, slideLabel, overlay = false, className, ...props }, ref) => {
  const l = useLabels({ goToSlide: slideLabel });
  const { api } = useCarousel();
  const [count, setCount] = React.useState(0);
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const update = () => {
      setCount(api.scrollSnapList().length);
      setSelected(api.selectedScrollSnap());
    };
    update();
    api.on('reInit', update);
    api.on('select', update);
    return () => {
      api.off('reInit', update);
      api.off('select', update);
    };
  }, [api]);

  if (count < 2) return null;
  return (
    <PaginationDotGroup
      ref={ref}
      count={count}
      current={selected}
      onSelect={(i) => api?.scrollTo(i)}
      getItemLabel={getItemLabel ?? ((i, n) => l.goToSlide(i + 1, n))}
      className={cn(overlay && 'absolute bottom-4 left-1/2 -translate-x-1/2', className)}
      {...props}
    />
  );
});
CarouselDots.displayName = 'CarouselDots';

export { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious, useCarousel, type CarouselApi };
