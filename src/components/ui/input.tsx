import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-paper border border-stone rounded-soft',
        'px-4 py-3 text-body font-sans text-ink',
        'placeholder:text-quiet placeholder:font-light',
        'transition-colors duration-200 ease-out-expo',
        'focus:outline-none focus:border-bronze focus:shadow-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('overline block mb-2', className)} {...props} />;
}
