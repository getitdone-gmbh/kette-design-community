import { cn } from '@/lib/utils';
import { SectionProps } from './section.interface';

export const Section: React.FC<SectionProps> = ({
  Comp = 'section',
  maxWidth,
  contentClassName,
  className,
  fullWidth = false,
  children,
  variant = 'accent',
  bgImgPath,
  ...props
}) => {
  return (
    <Comp
      className={cn(
        'relative',
        { 'lg:p-20': !fullWidth },
        { 'md:p-15': !fullWidth },
        { 'sm:px-6': !fullWidth },
        { 'sm:py-10': !fullWidth },
        { 'max-sm:p-6': !fullWidth },
        { 'bg-background': variant === 'white' },
        { 'bg-background-accent': variant === 'accent' },
        { 'bg-background-light': variant === 'light' },
        { 'bg-primary': variant === 'primary' },
        { 'text-primary-foreground': variant === 'primary' },
        { 'bg-transparent': bgImgPath },
        { '[&_*]:relative': bgImgPath && fullWidth },
        { '[&_*]:z-10': bgImgPath && fullWidth },
        className,
      )}
      {...props}
    >
      {fullWidth ? (
        children
      ) : (
        <div
          className={cn('relative', 'z-10', { 'max-w-[1170px]': !maxWidth }, 'w-full', 'md:m-auto', contentClassName)}
          style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
        >
          {children}
        </div>
      )}
      {bgImgPath && <img src={bgImgPath} alt="background" className="absolute inset-0 w-full h-full object-cover" />}
    </Comp>
  );
};
