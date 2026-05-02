import Link from 'next/link';
import {
  Phone, IdCard, FileLock2, Linkedin, Crown, Check, Lock, ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getBranchen } from '@/lib/branchen';
import { ProfilForm } from './ProfilForm';
import { ProfilPreview } from './ProfilPreview';
import { cn } from '@/lib/utils';
import { LogoUpload } from '@/components/kaeufer/logo-upload';
import { ProfilVorschauButton } from '@/components/kaeufer/profil-vorschau-button';
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
    finanzierungsnachweis_verified: boolean;
    linkedin_url: string | null;
    logo_url: string | null;
  } | null = null;

  if (await hasTable('kaeufer_profil')) {
    const { data } = await supabase
      .from('kaeufer_profil')
      .select('investor_typ, budget_min, budget_max, budget_undisclosed, regionen, branche_praeferenzen, timing, erfahrung, beschreibung, finanzierungsnachweis_verified, linkedin_url, logo_url')
      .eq('user_id', u.user.id)
      .maybeSingle();
    kaeuferProfil = data;
  }

  const branchen = await getBranchen();

  // Branchen-IDs zu lesbaren Labels mappen für die Preview (statt rohe IDs anzeigen)
  const brancheLabels = (kaeuferProfil?.branche_praeferenzen ?? [])
    .map((id) => branchen.find((b) => b.id === id)?.label_de ?? id);

  // Budget formatiert (CHF mit Apostroph, nur volle Mio)
  const budgetText = (() => {
    if (kaeuferProfil?.budget_undisclosed) return null;
    const min = kaeuferProfil?.budget_min;
    const max = kaeuferProfil?.budget_max;
    if (!min && !max) return null;
    const fmt = (v: number) => `CHF ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)} Mio`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (max) return `bis ${fmt(max)}`;
    if (min) return `ab ${fmt(min)}`;
    return null;
  })();

  const verifications = [
    {
      key: 'telefon',
      icon: Phone,
      label: 'Telefon-Verifikation',
      verified: !!prof?.verified_phone,
    },
    {
      key: 'kyc',
      icon: IdCard,
      label: 'Identifikation (KYC)',
      verified: !!prof?.verified_kyc,
    },
    {
      key: 'finanzierung',
      icon: FileLock2,
      label: 'Finanzierungsnachweis',
      verified: !!kaeuferProfil?.finanzierungsnachweis_verified,
    },
    {
      key: 'linkedin',
      icon: Linkedin,
      label: 'LinkedIn-Profil',
      verified: !!kaeuferProfil?.linkedin_url,
    },
  ];

  const verifiedCount = verifications.filter((v) => v.verified).length;

  const previewElement = (
    <ProfilPreview
      fullName={prof?.full_name ?? null}
      kanton={prof?.kanton ?? null}
      investorTyp={kaeuferProfil?.investor_typ ?? null}
      budget={budgetText}
      branchen={brancheLabels}
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
        linkedin: !!kaeuferProfil?.linkedin_url,
      }}
    />
  );

  return (
    <div className="space-y-8 max-w-content">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="overline text-bronze mb-2">Investor-Profil</p>
          <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
            Mein Käufer-Profil<span className="text-bronze">.</span>
          </h1>
          <p className="text-body-sm text-muted mt-2 max-w-2xl">
            Verkäufer sehen dein Profil bei jeder Anfrage. Je vollständiger und je mehr Verifizierungen, desto schneller und positiver die Antwort.
          </p>
        </div>
        <ProfilVorschauButton>{previewElement}</ProfilVorschauButton>
      </div>

      {/* ─── Profilbild (für ALLE Käufer) ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profilbild</h2>
        <LogoUpload currentUrl={kaeuferProfil?.logo_url ?? null} />
      </section>

      {/* ─── Verifizierungen — Käufer+ Marketing-Sektion ─── */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-serif text-head-sm text-navy font-normal">
            Verifizierungen <span className="font-mono text-caption text-quiet">{verifiedCount}/4</span>
          </h2>
          {!isPlus && (
            <Link
              href="/dashboard/kaeufer/abo"
              className="inline-flex items-center gap-1.5 text-caption text-bronze-ink hover:text-bronze font-medium"
            >
              <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
              Mit Käufer+ verifizieren
            </Link>
          )}
        </div>
        <p className="text-body-sm text-muted mb-4 max-w-xl">
          {isPlus
            ? 'Verifizierte Profile bekommen 2× schneller Antworten von Verkäufern.'
            : 'Verifizierungen sind ein Käufer+-Feature. Verifizierte Profile bekommen 2× schneller Antworten — Käufer+ schaltet alle vier Verifizierungs-Wege frei.'}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {verifications.map((v) => (
            <VerifyItem
              key={v.key}
              icon={v.icon}
              label={v.label}
              verified={v.verified}
              isPlus={isPlus}
            />
          ))}
        </div>
      </section>

      {/* ─── Editierbares Profil ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profil bearbeiten</h2>
        <ProfilForm initial={kaeuferProfil} branchen={branchen} />
      </section>
    </div>
  );
}

function VerifyItem({
  icon: Icon,
  label,
  verified,
  isPlus,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  verified: boolean;
  isPlus: boolean;
}) {
  return (
    <div className={cn(
      'bg-paper border rounded-card p-4 flex items-start gap-3',
      verified ? 'border-success/30' : 'border-stone',
    )}>
      <div className={cn(
        'w-10 h-10 rounded-soft flex items-center justify-center flex-shrink-0',
        verified ? 'bg-success/10' : 'bg-stone/50',
      )}>
        {verified
          ? <ShieldCheck className="w-5 h-5 text-success" strokeWidth={1.5} />
          : <Icon className="w-5 h-5 text-navy" strokeWidth={1.5} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-navy font-medium">{label}</p>
        <p className={cn('text-caption mt-0.5', verified ? 'text-success' : 'text-quiet')}>
          {verified ? (
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={2} /> Verifiziert
            </span>
          ) : (
            'Nicht verifiziert'
          )}
        </p>
        {!verified && (
          <div className="mt-2">
            {isPlus ? (
              <span className="text-caption text-quiet font-mono inline-flex items-center gap-1">
                <Lock className="w-3 h-3" strokeWidth={1.5} /> Setup kommt bald
              </span>
            ) : (
              <Link
                href="/dashboard/kaeufer/abo"
                className="text-caption text-bronze-ink hover:text-bronze font-medium inline-flex items-center gap-1"
              >
                <Crown className="w-3 h-3" strokeWidth={1.5} />
                Mit Käufer+ freischalten →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
