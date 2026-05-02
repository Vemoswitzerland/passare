import { Trash2, Lock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getNotificationPrefs } from '@/app/dashboard/settings-actions';
import { NotificationCenter } from '@/components/settings/NotificationCenter';

export const metadata = {
  title: 'Einstellungen — Käufer · passare',
  robots: { index: false, follow: false },
};

export default async function KaeuferEinstellungenPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('sprache, mfa_enrolled')
    .eq('id', u.user.id)
    .maybeSingle();

  const notifPrefs = await getNotificationPrefs();

  return (
    <div className="space-y-8 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Account · Benachrichtigungen</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Einstellungen<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Account-Daten, Passwort und welche Benachrichtigungen wir dir schicken.
        </p>
      </div>

      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Account</h2>
        <div className="bg-paper border border-stone rounded-card divide-y divide-stone">
          <AccountRow label="E-Mail" value={u.user.email ?? ''} cta="Ändern" disabled />
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
      </section>

      <section>
        <NotificationCenter
          initialPrefs={notifPrefs}
          showGroups={['kaeufer', 'plattform']}
        />
      </section>

      <section>
        <h2 className="font-serif text-head-sm text-danger font-normal mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          Konto löschen
        </h2>
        <div className="bg-danger/5 border border-danger/20 rounded-card p-5">
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
