import * as React from 'react';
import { cn } from '@/lib/utils';

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'default' | 'narrow' | 'wide';
};

const sizes = {
  default: 'max-w-content',
  narrow: 'max-w-prose',
  wide: 'max-w-container',
};

/** Swiss-Style horizontal Frame */
export function Container({ className, size = 'default', ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-6 md:px-10', sizes[size], className)} {...props} />
  );
}

/** Vertikaler Section-Padding (128px desktop / 64px mobile) */
export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-section-y-sm md:py-section-y', className)} {...props} />;
}
