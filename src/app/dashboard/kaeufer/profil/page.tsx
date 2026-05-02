import Link from 'next/link';
import {
  ShieldCheck, Phone, IdCard, FileLock2, Eye, EyeOff,
  Linkedin, AlertCircle, Trash2, Lock, Crown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getBranchen } from '@/lib/branchen';
import { ProfilForm } from './ProfilForm';
import { ProfilPreview } from './ProfilPreview';
import { toggleProfilSichtbarkeitAction } from './actions';
import { getNotificationPrefs } from '@/app/dashboard/settings-actions';
import { NotificationCenter } from '@/components/settings/NotificationCenter';
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

  const [branchen, notifPrefs] = await Promise.all([getBranchen(), getNotificationPrefs()]);

  return (
    <div className="space-y-8 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Investor-Profil · Trust-Signale</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Mein Käufer-Profil<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Verkäufer sehen dieses Profil, wenn du eine Anfrage stellst. Je vollständiger es ist, desto eher bekommst du das NDA freigegeben.
        </p>
      </div>

      {/* ─── Sektion 1: Live-Preview ─── */}
      <section>
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h2 className="font-serif text-head-sm text-navy font-normal">
              Was Verkäufer sehen
            </h2>
            <p className="text-caption text-quiet mt-1">
              Live-Preview aus Verkäufer-Sicht
            </p>
          </div>
          <form action={toggleProfilSichtbarkeitAction}>
            <input type="hidden" name="visible" value={kaeuferProfil?.ist_oeffentlich ? 'false' : 'true'} />
            <button
              type="submit"
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-pill text-caption font-medium transition-colors border',
                kaeuferProfil?.ist_oeffentlich
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-stone/60 text-muted border-stone',
              )}
            >
              {kaeuferProfil?.ist_oeffentlich ? (
                <><Eye className="w-3.5 h-3.5" strokeWidth={1.5} /> Sichtbar</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> Verborgen (Anonym)</>
              )}
            </button>
          </form>
        </div>

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

      {/* ─── Sektion 2: Trust-Signale ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">
          Verifizierung & Trust-Signale
        </h2>
        <p className="text-body-sm text-muted mb-4 max-w-xl">
          Verifizierte Käufer-Profile bekommen das NDA <strong className="text-navy">2× schneller</strong> freigegeben (Erfahrungswerte aus 6 Monaten Beta).
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <TrustItem
            icon={Phone}
            label="Telefon-Verifikation"
            verified={!!prof?.verified_phone}
            cta={prof?.verified_phone ? 'Aktualisieren' : 'Jetzt verifizieren'}
            href="/dashboard/kaeufer/profil#telefon"
            disabled
          />
          <TrustItem
            icon={IdCard}
            label="KYC (Identifikation)"
            verified={!!prof?.verified_kyc}
            cta={prof?.verified_kyc ? 'Verifiziert' : 'Personalausweis hochladen'}
            href="/dashboard/kaeufer/profil#kyc"
            disabled
          />
          <TrustItem
            icon={FileLock2}
            label="Finanzierungsnachweis"
            verified={!!kaeuferProfil?.finanzierungsnachweis_verified}
            cta={kaeuferProfil?.finanzierungsnachweis_verified ? 'Verifiziert' : 'PDF hochladen'}
            href="/dashboard/kaeufer/profil#finanzierung"
            disabled
          />
          <TrustItem
            icon={Linkedin}
            label="LinkedIn verbinden"
            verified={!!kaeuferProfil?.linkedin_url}
            cta={kaeuferProfil?.linkedin_url ? 'Aktualisieren' : 'Verbinden (kommt bald)'}
            href="#"
            disabled
          />
        </div>
        <div className="mt-4 inline-flex items-start gap-2 text-caption text-muted bg-stone/40 border border-stone rounded-soft px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-quiet flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          KYC, Finanzierungsnachweis-Upload und LinkedIn-OAuth sind in den nächsten Etappen geplant.
        </div>
      </section>

      {/* ─── Sektion 3: Logo-Upload (Käufer+ exklusiv) ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">
          Käufer-Logo
        </h2>
        {isPlus ? (
          <LogoUpload currentUrl={kaeuferProfil?.logo_url ?? null} />
        ) : (
          <div className="bg-bronze/5 border border-bronze/20 rounded-card p-5 flex items-start gap-3">
            <Crown className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-body-sm text-navy font-medium mb-1">
                Logo-Upload ist ein Käufer+-Feature
              </p>
              <p className="text-caption text-muted leading-relaxed">
                Mit Käufer+ kannst du dein Logo hochladen — dein Käuferprofil wirkt sofort professioneller und Verkäufer erkennen seriöse Käufer schneller.
              </p>
            </div>
            <Link
              href="/dashboard/kaeufer/abo"
              className="font-mono text-caption uppercase tracking-widest text-bronze-ink hover:text-bronze whitespace-nowrap"
            >
              Käufer+ ansehen →
            </Link>
          </div>
        )}
      </section>

      {/* ─── Sektion 4: Editierbares Profil ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Profil bearbeiten</h2>
        <ProfilForm initial={kaeuferProfil} branchen={branchen} />
      </section>

      {/* ─── Sektion 4: Account ─── */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Account</h2>
        <div className="bg-paper border border-stone rounded-card divide-y divide-stone">
          <AccountRow
            label="E-Mail"
            value={u.user.email ?? ''}
            cta="Ändern"
            disabled
          />
          <AccountRow
            label="Sprache"
            value={(prof?.sprache ?? 'de').toUpperCase()}
            cta="Wechseln"
            disabled
          />
          <AccountRow
            label="Passwort"
            value="••••••••"
            cta="Zurücksetzen"
            href="/auth/reset"
          />
          <AccountRow
            label="Zwei-Faktor-Authentifizierung"
            value={prof?.mfa_enrolled ? 'Aktiv' : 'Nicht aktiv'}
            cta="Konfigurieren"
            disabled
          />
        </div>

        <div className="mt-6 bg-danger/5 border border-danger/20 rounded-card p-5">
          <h3 className="font-serif text-head-sm text-danger font-normal mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            Danger Zone
          </h3>
          <p className="text-body-sm text-muted mb-3">
            Konto löschen — alle Käufer-Daten werden gemäss DSGVO/FADP nach 30 Tagen unwiderruflich entfernt.
          </p>
          <button
            type="button"
            disabled
            className="text-caption font-medium text-danger px-4 py-2 border border-danger/30 rounded-soft hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Konto löschen
          </button>
        </div>
      </section>

      {/* ─── Benachrichtigungs-Zentrum ─── */}
      <section>
        <NotificationCenter
          initialPrefs={notifPrefs}
          showGroups={['kaeufer', 'plattform']}
        />
      </section>
    </div>
  );
}

function TrustItem({
  icon: Icon, label, verified, cta, href, disabled,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  verified: boolean;
  cta: string;
  href: string;
  disabled?: boolean;
}) {
  return (
    <div className="bg-paper border border-stone rounded-card p-4 flex items-start gap-3">
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
          {verified ? 'Verifiziert' : 'Nicht verifiziert'}
        </p>
        {disabled ? (
          <span className="text-caption text-quiet font-mono inline-flex items-center gap-1 mt-1">
            <Lock className="w-3 h-3" strokeWidth={1.5} /> Kommt bald
          </span>
        ) : (
          <Link
            href={href}
            className="text-caption font-medium text-bronze-ink hover:text-bronze inline-block mt-1"
          >
            {cta} →
          </Link>
        )}
      </div>
    </div>
  );
}

function AccountRow({
  label, value, cta, href, disabled,
}: {
  label: string;
  value: string;
  cta: string;
  href?: string;
  disabled?: boolean;
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="overline text-quiet text-[10px]">{label}</p>
        <p className="text-body-sm text-navy font-mono">{value}</p>
      </div>
      {disabled || !href ? (
        <span className="text-caption text-quiet font-mono inline-flex items-center gap-1">
          <Lock className="w-3 h-3" strokeWidth={1.5} /> {cta}
        </span>
      ) : (
        <Link href={href} className="text-caption font-medium text-bronze-ink hover:text-bronze">
          {cta}
        </Link>
      )}
    </div>
  );
}
