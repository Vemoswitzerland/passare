import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Zap } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { getBranchen } from '@/lib/branchen';
import { TunnelForm } from './TunnelForm';

export const metadata = {
  title: 'Käufer-Profil einrichten — passare',
  robots: { index: false, follow: false },
};

export default async function KaeuferTunnelPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/onboarding/kaeufer/tunnel');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, rolle, onboarding_completed_at')
    .eq('id', u.user.id)
    .maybeSingle();

  // Wenn schon Verkäufer → falsche Stelle
  if (profile?.rolle === 'verkaeufer') redirect('/dashboard/verkaeufer');
  // KEIN automatischer Redirect zum Dashboard wenn schon onboarded —
  // sonst Loop wenn das Layout zurückleitet.

  const branchen = await getBranchen();

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-stone bg-cream/85 backdrop-blur-md sticky top-0 z-30">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <span className="font-mono text-caption text-quiet uppercase tracking-widest hidden sm:inline">
              Käufer-Profil
            </span>
          </div>
        </Container>
      </header>

      <section className="py-10 md:py-14">
        <Container size="narrow">
          <div className="text-center mb-8 md:mb-10">
            <p className="overline text-bronze mb-3">In 60 Sekunden</p>
            <h1 className="font-serif-display text-display-sm md:text-display-md text-navy font-light leading-tight">
              Was suchst du<span className="text-bronze">?</span>
            </h1>
            <p className="text-body text-muted mt-4 max-w-md mx-auto leading-relaxed">
              3 kurze Fragen — danach siehst du Inserate, die wirklich zu dir passen. Du kannst auch <em>überspringen</em>.
            </p>
          </div>

          {/* Trust-Badges */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <TrustBadge icon={ShieldCheck} label="Direkt zum Verkäufer" />
            <TrustBadge icon={Lock} label="Anonyme Teaser" />
            <TrustBadge icon={Zap} label="7 Tage Frühzugang (MAX)" />
          </div>

          <TunnelForm branchen={branchen} />

          <p className="text-center text-caption text-quiet mt-8">
            Schon eingerichtet?{' '}
            <Link href="/dashboard/kaeufer" className="editorial text-navy">Direkt zum Dashboard</Link>
          </p>
        </Container>
      </section>
    </main>
  );
}

function TrustBadge({
  icon: Icon, label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-2 py-3 bg-paper border border-stone rounded-soft text-center">
      <Icon className="w-4 h-4 text-bronze" strokeWidth={1.5} />
      <span className="text-caption text-muted leading-tight">{label}</span>
    </div>
  );
}
