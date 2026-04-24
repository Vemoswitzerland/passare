import { BetaForm } from './BetaForm';

export const metadata = {
  title: 'Beta-Zugang — passare.ch',
  robots: { index: false, follow: false },
};

export default function BetaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl text-deep font-light mb-3">
            passare<span className="text-terra">.</span>
          </h1>
          <p className="text-sm tracking-wider uppercase text-deep/60">
            Geschlossener Beta-Zugang
          </p>
        </div>

        <div className="bg-paper border border-deep/10 rounded-2xl p-8 shadow-sm">
          <p className="text-deep/80 mb-6 text-center leading-relaxed">
            Bitte gib deinen Beta-Zugangscode ein.
            <br />
            <span className="text-sm text-deep/60">
              Noch keinen Code? Schreib uns an{' '}
              <a href="mailto:beta@passare.ch" className="text-terra underline">
                beta@passare.ch
              </a>
            </span>
          </p>

          <BetaForm />
        </div>

        <p className="text-center text-xs text-deep/40 mt-8">
          passare.ch &middot; Der vertrauensvolle Übergang
        </p>
      </div>
    </main>
  );
}
