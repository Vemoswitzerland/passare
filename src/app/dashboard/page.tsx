import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Divider } from '@/components/ui/divider';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '../auth/actions';

export const metadata = {
  title: 'Dashboard — passare',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ reset?: string; welcome?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sprache, rolle, kanton, onboarding_completed_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect('/onboarding');

  const { reset, welcome } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-stone">
        <Container>
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-caption text-quiet hover:text-navy transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Abmelden
              </button>
            </form>
          </div>
        </Container>
      </header>

      <section className="flex-1 px-6 py-16">
        <Container className="max-w-2xl">
          <p className="overline text-bronze mb-4">Konto eingerichtet</p>
          <h1 className="font-serif text-display-sm text-navy font-light mb-6">
            Willkommen{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.
          </h1>

          {reset === 'ok' && (
            <div className="mb-8 inline-flex items-center gap-2 text-success bg-success/10 border border-success/20 rounded-soft px-4 py-2 text-body-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              Passwort wurde aktualisiert.
            </div>
          )}

          {welcome === '1' && (
            <div className="mb-8 inline-flex items-center gap-2 text-success bg-success/10 border border-success/20 rounded-soft px-4 py-2 text-body-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              Konto eingerichtet — schön, dass du da bist!
            </div>
          )}

          <p className="text-body text-muted leading-relaxed mb-10">
            Dein Konto ist erstellt. In den nächsten Schritten richten wir
            gemeinsam dein Profil ein und du wählst, ob du ein Unternehmen
            verkaufen oder kaufen möchtest. Diese Einrichtungs-Strecke
            schalten wir in einer der nächsten Etappen frei.
          </p>

          <Divider className="my-10" />

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-body-sm">
            <div>
              <dt className="overline mb-2">E-Mail</dt>
              <dd className="text-ink font-mono">{data.user.email}</dd>
            </div>
            <div>
              <dt className="overline mb-2">Konto-ID</dt>
              <dd className="text-ink font-mono text-caption break-all">{data.user.id}</dd>
            </div>
            <div>
              <dt className="overline mb-2">Sprache</dt>
              <dd className="text-ink">{(profile?.sprache ?? 'de').toUpperCase()}</dd>
            </div>
            <div>
              <dt className="overline mb-2">Rolle</dt>
              <dd className="text-ink">
                {profile?.rolle ? profile.rolle : 'Noch nicht gewählt'}
              </dd>
            </div>
          </dl>
        </Container>
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
