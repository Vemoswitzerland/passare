import { createClient } from '@/lib/supabase/server';
import { getNotificationPrefs } from '@/app/dashboard/settings-actions';
import { NotificationCenter } from '@/components/settings/NotificationCenter';

export const metadata = { title: 'Einstellungen — passare Verkäufer' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const [{ data: profile }, notifPrefs] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, kanton, sprache, phone, verified_phone, verified_kyc')
      .eq('id', userData.user.id)
      .maybeSingle(),
    getNotificationPrefs(),
  ]);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <p className="overline text-bronze-ink mb-2">Einstellungen</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Mein Profil
          </h1>
        </div>

        <div className="rounded-card bg-paper border border-stone p-6 md:p-8 space-y-6">
          <Field label="Name" value={profile?.full_name ?? '—'} />
          <Field label="E-Mail" value={userData.user.email ?? '—'} mono />
          <Field label="Kanton" value={profile?.kanton ?? '—'} />
          <Field label="Sprache" value={(profile?.sprache ?? 'de').toUpperCase()} />
          <Field
            label="Telefon"
            value={profile?.phone ?? '—'}
            badge={profile?.verified_phone ? { text: 'Verifiziert', cls: 'success' } : undefined}
          />
          <Field
            label="KYC-Status"
            value={profile?.verified_kyc ? 'Verifiziert' : 'Nicht verifiziert'}
            badge={profile?.verified_kyc ? { text: 'OK', cls: 'success' } : undefined}
          />

          <div className="pt-6 border-t border-stone">
            <p className="text-caption text-quiet">
              Profilbearbeitung wird in einer der nächsten Etappen freigeschaltet (Telefon-Verifikation, KYC-Upload, Sprach-Wechsel).
            </p>
          </div>
        </div>

        {/* ── Benachrichtigungs-Zentrum ─────────────────────── */}
        <NotificationCenter
          initialPrefs={notifPrefs}
          showGroups={['verkaeufer', 'plattform']}
        />
      </div>
    </div>
  );
}

function Field({
  label, value, mono, badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: { text: string; cls: 'success' | 'warn' };
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
      <p className="overline text-quiet text-caption">{label}</p>
      <div className="flex items-center gap-2">
        <p className={mono ? 'text-body text-navy font-mono' : 'text-body text-navy'}>{value}</p>
        {badge && (
          <span className={
            badge.cls === 'success'
              ? 'inline-flex items-center px-2 py-0.5 rounded-pill bg-success/15 text-success text-caption font-medium'
              : 'inline-flex items-center px-2 py-0.5 rounded-pill bg-warn/15 text-warn text-caption font-medium'
          }>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
