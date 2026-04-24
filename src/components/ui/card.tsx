import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'paper' | 'quiet';
  interactive?: boolean;
};

export function Card({ className, variant = 'paper', interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card transition-all duration-300 ease-out-expo',
        variant === 'paper' && 'bg-paper shadow-card',
        variant === 'quiet' && 'bg-cream border border-stone',
        interactive && 'hover:-translate-y-1 hover:shadow-lift cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-8', className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-8 pt-8 pb-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-8 pb-8 pt-4', className)} {...props} />;
}
