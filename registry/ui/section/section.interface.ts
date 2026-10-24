export interface SectionProps {
  variant?: 'white' | 'light' | 'accent' | 'primary';
  bgImgPath?: string;
  children?: JSX.Element;
  fullWidth?: boolean;
  maxWidth?: number;
  // Classes of the inner content frame (cap, centering). Merged with tailwind-merge, so `max-w-content` replaces the default 1170px cap.
  contentClassName?: string;
  className?: string;
  Comp?: keyof JSX.IntrinsicElements;
}
