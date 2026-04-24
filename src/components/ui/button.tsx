import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'bronze';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-300 ease-out-expo disabled:opacity-50 disabled:pointer-events-none select-none tracking-[-0.005em]';

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-soft',
  md: 'px-6 py-3 text-[0.9375rem] rounded-soft',
  lg: 'px-8 py-4 text-base rounded-soft',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-navy text-cream hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift',
  secondary:
    'bg-transparent text-navy border border-navy/15 hover:border-navy hover:-translate-y-[1px]',
  ghost:
    'bg-transparent text-navy hover:bg-navy/5',
  bronze:
    'bg-bronze text-cream hover:bg-bronze-ink hover:-translate-y-[1px] hover:shadow-lift',
};

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children, ...rest } = props;
  const styles = cn(base, sizes[size], variants[variant], className);

  if ('href' in props && props.href) {
    const { href, ...linkRest } = rest as { href?: string } & Record<string, unknown>;
    return (
      <Link href={props.href} className={styles} {...(linkRest as Record<string, unknown>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
