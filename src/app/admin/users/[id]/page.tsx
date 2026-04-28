import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Languages,
  Calendar,
  Activity,
  Crown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { UserDetailForm } from '@/components/admin/UserDetailForm';
import { UserDeleteSection } from '@/components/admin/UserDeleteSection';
import { ProfileCompletenessRing } from '@/components/admin/ProfileCompletenessRing';
import { formatDateTime } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin · User-Detail — passare',
  robots: { index: false, follow: false },
};

/** Subtile Rolle-Anzeige (kleines Mono-Label statt Badge). */
const ROLLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: 'admin', color: 'text-navy' },
  verkaeufer: { label: 'verkäufer', color: 'text-bronze-ink' },
  kaeufer: { label: 'käufer', color: 'text-quiet' },
};

const ABO_DISPLAY: Record<string, { label: string; color: string }> = {
  basic: { label: 'Basic', color: 'text-quiet' },
  max: { label: 'MAX', color: 'text-bronze-ink font-medium' },
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  rolle: 'verkaeufer' | 'kaeufer' | 'admin' | null;
  phone: string | null;
  kanton: string | null;
  sprache: string | null;
  subscription_tier: 'basic' | 'max' | null;
  email: string | null;
  last_sign_in_at: string | null;
  auth_created_at: string | null;
  tags: unknown;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // PERF: alle 4 Queries parallel statt sequenziell. Email kommt aus
  // profiles.email (denormalisiert) — kein getUserById()-Call mehr.
  const [
    { data: profile },
    { data: completenessData },
    { data: meData },
    { data: activityData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle<ProfileRow>(),
    supabase.rpc('profile_completeness', { p_user_id: id }),
    supabase.auth.getUser(),
    supabase.from('audit_log').select('id, type, beschreibung, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
  ]);

  if (!profile) notFound();

  const completeness = typeof completenessData === 'number' ? completenessData : 0;
  const isSelf = meData.user?.id === id;
  const email = profile.email;
  const lastSignIn = profile.last_sign_in_at;
  const createdInAuth = profile.auth_created_at;

  const initialTags: string[] = Array.isArray(profile.tags) ? (profile.tags as string[]) : [];

  const initials = (profile.full_name ?? email ?? 'U?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const userActivity = (activityData ?? []) as Array<{ id: string; type: string; beschreibung: string; created_at: string }>;

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] text-quiet hover:text-navy transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur User-Liste
      </Link>

      <header className="bg-paper border border-stone rounded-soft p-4 mb-4 flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-12 h-12 rounded-full bg-navy text-cream flex items-center justify-center font-mono text-base font-medium flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
            <h1 className="text-base text-navy font-semibold leading-tight">
              {profile.full_name ?? 'Ohne Namen'}
            </h1>
            {profile.rolle ? (
              <span className={`font-mono text-[11px] tracking-wide ${ROLLE_DISPLAY[profile.rolle].color}`}>
                {ROLLE_DISPLAY[profile.rolle].label}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-quiet italic">rolle offen</span>
            )}
            {profile.rolle === 'kaeufer' && profile.subscription_tier && (
              <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${ABO_DISPLAY[profile.subscription_tier].color}`}>
                {profile.subscription_tier === 'max' && <Crown className="w-3 h-3" strokeWidth={1.5} />}
                {ABO_DISPLAY[profile.subscription_tier].label}
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] mt-2">
            <InfoRow icon={Mail} value={email ?? '—'} mono />
            <InfoRow icon={Phone} value={profile.phone ?? '—'} mono />
            <InfoRow icon={MapPin} value={profile.kanton ?? '—'} />
            <InfoRow icon={Languages} value={(profile.sprache ?? 'de').toUpperCase()} />
            <InfoRow
              icon={Calendar}
              value={`Registriert ${formatDateTime(createdInAuth ?? profile.created_at)}`}
            />
            <InfoRow icon={Activity} value={`Letzter Login: ${formatDateTime(lastSignIn)}`} />
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          <ProfileCompletenessRing value={completeness} />
          <code className="font-mono text-[10px] text-quiet break-all max-w-[200px]">
            ID: {profile.id.slice(0, 8)}…
          </code>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          <UserDetailForm
            userId={profile.id}
            initialNotes={profile.admin_notes}
            initialTags={initialTags}
          />
          {!isSelf && (
            <UserDeleteSection
              userId={profile.id}
              userName={profile.full_name ?? email ?? profile.id.slice(0, 8)}
            />
          )}
        </div>

        <aside>
          {userActivity.length > 0 ? (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Letzte Aktivitäten
              </h3>
              <ul className="space-y-2.5">
                {userActivity.map((log) => (
                  <li key={log.id} className="text-[12px]">
                    <p className="text-ink">{log.beschreibung}</p>
                    <p className="text-quiet font-mono mt-0.5 text-[11px]">
                      {log.type} · {formatDateTime(log.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-2">
                Letzte Aktivitäten
              </h3>
              <p className="text-[12px] text-quiet italic">Noch keine Aktivität.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string;
  mono?: boolean;
}) {
  return (
    <p className="flex items-center gap-1.5 text-quiet truncate">
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
      <span className={mono ? 'font-mono text-ink' : 'text-ink'}>{value}</span>
    </p>
  );
}
