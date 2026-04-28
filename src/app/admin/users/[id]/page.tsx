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
} from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { UserDetailForm } from '@/components/admin/UserDetailForm';
import { formatDateTime } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin · User-Detail — passare',
  robots: { index: false, follow: false },
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
};

const roleVariant = (rolle: string | null): 'navy' | 'bronze' | 'neutral' => {
  if (rolle === 'admin') return 'navy';
  if (rolle === 'verkaeufer') return 'bronze';
  return 'neutral';
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  rolle: 'verkaeufer' | 'kaeufer' | 'admin' | null;
  phone: string | null;
  kanton: string | null;
  sprache: string | null;
  qualitaets_score: number | null;
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle<ProfileRow>();

  if (!profile) notFound();

  let email: string | null = null;
  let lastSignIn: string | null = null;
  let createdInAuth: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(id);
    type AuthUserShape = { email?: string | null; last_sign_in_at?: string | null; created_at?: string | null };
    const u = (data as { user?: AuthUserShape } | null)?.user;
    email = u?.email ?? null;
    lastSignIn = u?.last_sign_in_at ?? null;
    createdInAuth = u?.created_at ?? null;
  } catch {
    /* Service-Role-Key fehlt */
  }

  const initialTags: string[] = Array.isArray(profile.tags) ? (profile.tags as string[]) : [];

  const initials = (profile.full_name ?? email ?? 'U?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { data: activityData } = await supabase
    .from('audit_log')
    .select('id, type, beschreibung, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);
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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-base text-navy font-semibold leading-tight">
              {profile.full_name ?? 'Ohne Namen'}
            </h1>
            {profile.rolle ? (
              <Badge variant={roleVariant(profile.rolle)}>{ROLLE_LABEL[profile.rolle]}</Badge>
            ) : (
              <Badge variant="neutral">Rolle offen</Badge>
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
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          <span className="text-[11px] text-quiet uppercase tracking-wide font-medium">Konto-ID</span>
          <code className="font-mono text-[11px] text-ink break-all max-w-[200px]">{profile.id}</code>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div>
          <UserDetailForm
            userId={profile.id}
            initialScore={profile.qualitaets_score}
            initialNotes={profile.admin_notes}
            initialTags={initialTags}
          />
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
