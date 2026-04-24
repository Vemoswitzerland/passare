import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-deep/5 border border-deep/10 rounded-full">
            <span className="w-2 h-2 bg-terra rounded-full animate-pulse" />
            <span className="text-xs tracking-wider uppercase text-deep/70 font-medium">
              Beta &middot; Launch Herbst 2026
            </span>
          </div>

          <h1 className="font-serif text-6xl md:text-8xl text-deep font-light mb-6 leading-[1.05]">
            passare<span className="text-terra">.</span>
          </h1>

          <p className="font-serif text-2xl md:text-3xl text-deep/80 italic mb-8 leading-snug">
            Der vertrauensvolle Übergang.
          </p>

          <p className="text-lg text-deep/70 mb-12 max-w-xl mx-auto leading-relaxed">
            Die Schweizer Plattform für den Kauf und Verkauf von KMU.
            Diskret. Professionell. Vierprachig. — Aktuell im geschlossenen Beta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/beta"
              className="px-8 py-4 bg-deep text-cream rounded-full font-medium tracking-wide hover:bg-terra transition-colors duration-300"
            >
              Beta-Zugang
            </Link>
            <a
              href="mailto:info@passare.ch"
              className="px-8 py-4 border border-deep/20 text-deep rounded-full font-medium tracking-wide hover:border-terra hover:text-terra transition-colors duration-300"
            >
              Kontakt
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-deep/10 py-8 px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-deep/60">
          <p>&copy; {new Date().getFullYear()} passare.ch — Alle Rechte vorbehalten</p>
          <div className="flex gap-6">
            <Link href="/impressum" className="hover:text-terra">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-terra">Datenschutz</Link>
            <Link href="/agb" className="hover:text-terra">AGB</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
