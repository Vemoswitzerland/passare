import Link from 'next/link';
import {
  Phone, IdCard, FileLock2, Linkedin, Check, Lock, ShieldCheck, Info, ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getBranchen } from '@/lib/branchen';
import { ProfilForm } from '../../kaeufer/profil/ProfilForm';
import { ProfilPreview } from '../../kaeufer/profil/ProfilPreview';
import { LogoUpload } from '@/components/kaeufer/logo-upload';
import { ProfilVorschauButton } from '@/components/kaeufer/profil-vorschau-button';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Mein Profil — passare Broker', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function BrokerProfilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('full_name, kanton, sprache, verified_phone, verified_kyc, mfa_enrolled')
    .eq('id', u.user.id)
    .maybeSingle();

  // Broker bekommen ALLE Käufer+-Verifizierungen automatisch (Pro-Abo deckt alles).
  const isPlus = true;

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
  const brancheLabels = (kaeuferProfil?.branche_praeferenzen ?? [])
    .map((id) => branchen.find((b) => b.id === id)?.label_de ?? id);

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
    { key: 'telefon', icon: Phone, label: 'Telefon-Verifikation', verified: !!prof?.verified_phone },
    { key: 'kyc', icon: IdCard, label: 'Identifikation (KYC)', verified: !!prof?.verified_kyc },
    { key: 'finanzierung', icon: FileLock2, label: 'Finanzierungsnachweis', verified: !!kaeuferProfil?.finanzierungsnachweis_verified },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn-Profil', verified: !!kaeuferProfil?.linkedin_url },
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
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="overline text-bronze-ink mb-2">Suchen · Mein Profil</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Käufer-Profil
            </h1>
            <p className="text-body-sm text-muted mt-2 max-w-2xl">
              Wenn du im Marktplatz auf ein Inserat anfragst, sehen Verkäufer dieses Profil.
              Je vollständiger, desto schneller und positiver die Antwort.
            </p>
          </div>
          <ProfilVorschauButton>{previewElement}</ProfilVorschauButton>
        </div>

        {/* Hinweis: dieser Bereich ist nur für die Käufer-Sicht des Brokers.
            Das Logo, das hier hochgeladen wird, landet im Käufer-Profil-Bucket
            und erscheint NICHT auf dem öffentlichen Broker-Verzeichnis. Für
            das Verzeichnis-Logo bitte in /einstellungen. */}
        <div className="rounded-card bg-bronze/5 border border-bronze/30 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-navy font-medium">
              Hinweis: Logo hier zählt nur fürs Käufer-Profil
            </p>
            <p className="text-caption text-muted mt-1 leading-relaxed">
              Das Logo, das du auf dieser Seite hochlädst, erscheint, wenn du selbst auf
              Inserate anfragst. Für dein Logo im öffentlichen Broker-Verzeichnis bitte
              unter Einstellungen anpassen.
            </p>
            <Link
              href="/dashboard/broker/einstellungen"
              className="inline-flex items-center gap-1 mt-2 text-caption text-bronze-ink hover:text-navy font-medium"
            >
              Zu den Broker-Einstellungen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <section>
          <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profilbild</h2>
          <LogoUpload currentUrl={kaeuferProfil?.logo_url ?? null} />
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
            <h2 className="font-serif text-head-sm text-navy font-normal">
              Verifizierungen <span className="font-mono text-caption text-quiet">{verifiedCount}/4</span>
            </h2>
          </div>
          <p className="text-body-sm text-muted mb-4 max-w-xl">
            Verifizierte Profile bekommen 2× schneller Antworten von Verkäufern. Als Broker hast du alle vier Wege im Abo inklusive.
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

        <section>
          <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profil bearbeiten</h2>
          <ProfilForm initial={kaeuferProfil} branchen={branchen} />
        </section>
      </div>
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
    <div
      className={cn(
        'bg-paper border rounded-card p-4 flex items-start gap-3',
        verified ? 'border-success/30' : 'border-stone',
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-soft flex items-center justify-center flex-shrink-0',
          verified ? 'bg-success/10' : 'bg-stone/50',
        )}
      >
        {verified ? (
          <ShieldCheck className="w-5 h-5 text-success" strokeWidth={1.5} />
        ) : (
          <Icon className="w-5 h-5 text-navy" strokeWidth={1.5} />
        )}
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
        {!verified && isPlus && (
          <div className="mt-2">
            <span className="text-caption text-quiet font-mono inline-flex items-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={1.5} /> Setup kommt bald
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

