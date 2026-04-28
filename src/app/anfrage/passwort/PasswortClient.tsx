'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, KeyRound, Lock, Shield,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { OAuthButtons, AuthDivider } from '@/components/ui/oauth-buttons';

/**
 * Passwort-Setzen-Schritt nach E-Mail-Verifizierung.
 *
 * Empfängt vom Server-Wrapper page.tsx das bereits validierte Token-Payload
 * (name + email + listing). Bei Submit ruft die Komponente
 * /api/anfrage/aktivieren auf — dort wird das Token nochmals validiert,
 * der User in Supabase Auth angelegt UND die Browser-Session gesetzt
 * (Auto-Login), und die Anfrage versendet.
 *
 * Alternative: OAuth via Google/LinkedIn (statt Passwort).
 */

type Props = {
  token: string;
  payload: {
    name: string;
    email: string;
    listingId: string;
  };
};

export function PasswortClient({ token, payload }: Props) {
  const router = useRouter();
  const [passwort, setPasswort] = useState('');
  const [passwortRepeat, setPasswortRepeat] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    if (passwort.length < 8) {
      setFehler('Mindestens 8 Zeichen.');
      return;
    }
    if (passwort !== passwortRepeat) {
      setFehler('Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/anfrage/aktivieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, passwort }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Aktivierung fehlgeschlagen.');
      }
      // Hard-Redirect, damit der Header die neue Session-Cookie liest
      // und «Anmelden» durch das Käufer-Konto ersetzt.
      window.location.assign(`/inserat/${payload.listingId}?anfrage=ok`);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Aktivierung fehlgeschlagen.');
      setBusy(false);
    }
  }

  return (
    <Section>
      <Container>
        <div className="max-w-md mx-auto py-8">
          <Reveal>
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <p className="overline mb-2 text-bronze-ink">E-Mail bestätigt</p>
              <h1 className="font-serif-display text-[clamp(1.75rem,3vw,2.25rem)] text-navy font-light leading-tight tracking-[-0.02em] mb-3">
                Konto aktivieren<span className="text-bronze">.</span>
              </h1>
              <p className="text-body-sm text-muted leading-relaxed">
                Hallo <span className="text-navy">{payload.name}</span> — Sie sind nur
                noch einen Schritt entfernt. Ihre Anfrage geht raus, sobald Ihr
                kostenloses Käufer-Basic-Konto aktiv ist.
              </p>
              <p className="font-mono text-caption text-quiet mt-3 break-all">{payload.email}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-paper border border-stone rounded-card p-6 space-y-5">
              {/* OAuth (schneller Weg) */}
              <OAuthButtons mode="register" />
              <AuthDivider>oder Passwort vergeben</AuthDivider>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Passwort" required>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwort}
                    onChange={(e) => setPasswort(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
                  />
                </Field>

                <Field label="Passwort wiederholen" required>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwortRepeat}
                    onChange={(e) => setPasswortRepeat(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
                  />
                </Field>

                {fehler && (
                  <p className="text-caption text-bronze-ink bg-bronze/10 rounded-soft px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    {fehler}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift transition-all duration-300 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {busy
                    ? <>Aktiviere Konto …</>
                    : <><KeyRound className="w-4 h-4" strokeWidth={1.5} /> Konto aktivieren &amp; Anfrage senden</>
                  }
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-6 bg-bronze/5 border border-bronze/20 rounded-soft px-5 py-4 flex items-start gap-3">
              <Shield className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-1">
                  Käufer-Basic gratis
                </p>
                <p className="text-caption text-muted leading-relaxed">
                  Ihr Konto ist und bleibt kostenlos. Sie können jederzeit kündigen.
                  Mit der Aktivierung akzeptieren Sie unsere{' '}
                  <Link href="/agb" className="text-navy hover:text-bronze underline-offset-2 hover:underline">
                    AGB
                  </Link>
                  {' '}und{' '}
                  <Link href="/datenschutz" className="text-navy hover:text-bronze underline-offset-2 hover:underline">
                    Datenschutzerklärung
                  </Link>.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function InvalidTokenScreen() {
  return (
    <Section>
      <Container>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-14 h-14 mx-auto rounded-full bg-bronze/10 text-bronze-ink flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-head-lg text-navy font-normal mb-3">
            Verifizierungs-Link ungültig oder abgelaufen<span className="text-bronze">.</span>
          </h1>
          <p className="text-body-sm text-muted leading-relaxed mb-6">
            Der Link funktioniert nur 24 Stunden lang. Bitte starten Sie die Anfrage
            neu auf der gewünschten Inserat-Seite.
          </p>
          <Link
            href="/"
            className="inline-block bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors"
          >
            Zum Marktplatz
          </Link>
        </div>
      </Container>
    </Section>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-quiet block mb-1.5">
        {label}{required && <span className="text-bronze ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
