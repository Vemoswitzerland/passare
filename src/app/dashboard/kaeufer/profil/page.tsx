import Link from 'next/link';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getBranchen } from '@/lib/branchen';
import { ProfilForm } from './ProfilForm';
import { ProfilPreview } from './ProfilPreview';
import { toggleProfilSichtbarkeitAction } from './actions';
import { cn } from '@/lib/utils';
import { LogoUpload } from '@/components/kaeufer/logo-upload';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';

export const metadata = { title: 'Käufer-Profil — passare', robots: { index: false, follow: false } };

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('full_name, kanton, sprache, verified_phone, verified_kyc, mfa_enrolled, subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();

  const isPlus = isPlusKaeufer(prof);

  let kaeuferProfil: {
    investor_typ: string | null;
    budget_min: number | null;
    budget_max: number | null;
    budget_undisclosed: boolean;
    regionen: string[];
    branche_praeferenzen: string[];
    timing: string | null;
    erfahrung: string | null;
    beschreibung: string | null;
    ist_oeffentlich: boolean;
    finanzierungsnachweis_verified: boolean;
    linkedin_url: string | null;
    logo_url: string | null;
  } | null = null;

  if (await hasTable('kaeufer_profil')) {
    const { data } = await supabase
      .from('kaeufer_profil')
      .select('*')
      .eq('user_id', u.user.id)
      .maybeSingle();
    kaeuferProfil = data;
  }

  const branchen = await getBranchen();
  const sichtbar = kaeuferProfil?.ist_oeffentlich !== false; // default visible

  return (
    <div className="space-y-8 max-w-content">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="overline text-bronze mb-2">Investor-Profil</p>
          <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
            Mein Käufer-Profil<span className="text-bronze">.</span>
          </h1>
          <p className="text-body-sm text-muted mt-2 max-w-2xl">
            Verkäufer sehen dieses Profil, wenn du eine Anfrage stellst. Je vollständiger es ist, desto schneller antwortet der Verkäufer.
          </p>
        </div>
        <Link
          href="/dashboard/kaeufer/einstellungen"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-soft text-caption font-mono uppercase tracking-widest text-quiet hover:text-navy hover:bg-stone/40 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
          Einstellungen
        </Link>
      </div>

      {/* ─── Sichtbarkeits-Toggle (klar als Switch erkennbar) ─── */}
      <section className="bg-paper border border-stone rounded-card p-5">
        <form action={toggleProfilSichtbarkeitAction} className="flex items-center gap-4">
          <input type="hidden" name="visible" value={sichtbar ? 'false' : 'true'} />
          <button
            type="submit"
            role="switch"
            aria-checked={sichtbar}
            aria-label="Profil-Sichtbarkeit umschalten"
            className={cn(
              'relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2',
              sichtbar ? 'bg-success' : 'bg-stone',
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-cream shadow-sm transition-transform',
                sichtbar ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-navy font-medium flex items-center gap-1.5">
              {sichtbar ? (
                <><Eye className="w-3.5 h-3.5 text-success" strokeWidth={1.5} /> Profil ist sichtbar</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} /> Profil ist verborgen (anonym)</>
              )}
            </p>
            <p className="text-caption text-quiet mt-0.5">
              {sichtbar
                ? 'Verkäufer sehen Name und Profil, wenn du eine Anfrage schickst.'
                : 'Anfragen kommen anonym beim Verkäufer an — er sieht nur deine Branchen und Region.'}
            </p>
          </div>
        </form>
      </section>

      {/* ─── Profilbild (für ALLE Käufer, nicht nur Plus) ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profilbild</h2>
        <LogoUpload currentUrl={kaeuferProfil?.logo_url ?? null} />
      </section>

      {/* ─── Live-Preview ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-1">
          Was Verkäufer sehen
        </h2>
        <p className="text-caption text-quiet mb-3">
          Live-Preview aus Verkäufer-Sicht
        </p>
        <ProfilPreview
          fullName={prof?.full_name ?? null}
          kanton={prof?.kanton ?? null}
          investorTyp={kaeuferProfil?.investor_typ ?? null}
          budget={
            kaeuferProfil?.budget_undisclosed
              ? null
              : kaeuferProfil?.budget_min || kaeuferProfil?.budget_max
              ? `CHF ${(kaeuferProfil.budget_min ?? 0) / 1_000_000} – ${(kaeuferProfil.budget_max ?? 0) / 1_000_000} Mio`
              : null
          }
          branchen={kaeuferProfil?.branche_praeferenzen ?? []}
          regionen={kaeuferProfil?.regionen ?? []}
          erfahrung={kaeuferProfil?.erfahrung ?? null}
          timing={kaeuferProfil?.timing ?? null}
          beschreibung={kaeuferProfil?.beschreibung ?? null}
          isPlus={isPlus}
          logoUrl={kaeuferProfil?.logo_url}
          verified={{
            phone: !!prof?.verified_phone,
            kyc: !!prof?.verified_kyc,
            finanzierung: !!kaeuferProfil?.finanzierungsnachweis_verified,
          }}
        />
      </section>

      {/* ─── Editierbares Profil ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profil bearbeiten</h2>
        <ProfilForm initial={kaeuferProfil} branchen={branchen} />
      </section>
    </div>
  );
}
