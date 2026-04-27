import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/container';
import { Divider } from '@/components/ui/divider';

type Props = {
  overline: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Wiederverwendbare Hülle für /auth/* — gleiches Layout wie /beta.
 */
export function AuthShell({ overline, title, intro, children, footer }: Props) {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-stone">
        <Container>
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <span className="overline text-quiet">Konto</span>
          </div>
        </Container>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-10">
            <p className="overline text-bronze mb-4">{overline}</p>
            <h1 className="font-serif text-display-sm text-navy font-light mb-4">
              {title}
            </h1>
            {intro && (
              <p className="text-body text-muted leading-relaxed max-w-sm mx-auto">
                {intro}
              </p>
            )}
          </div>

          <div className="bg-paper border border-stone rounded-card p-8 md:p-10">
            {children}
          </div>

          {footer && (
            <>
              <Divider className="my-8" />
              <div className="text-center text-caption text-quiet leading-relaxed">
                {footer}
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-stone py-6">
        <Container>
          <p className="text-center text-caption text-quiet">
            passare &mdash; «Made in Switzerland»
          </p>
        </Container>
      </footer>
    </main>
  );
}
