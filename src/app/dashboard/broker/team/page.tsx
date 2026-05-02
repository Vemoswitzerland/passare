import { Users, Plus, Mail, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Team — passare Broker' };

export default async function BrokerTeamPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  let teamMembers: any[] = [];
  let brokerProfile: any = null;

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('tier, team_seats_limit')
      .eq('id', userData.user.id)
      .maybeSingle();
    brokerProfile = bp;
  }

  if (await hasTable('broker_team_members')) {
    const { data } = await supabase
      .from('broker_team_members')
      .select('*')
      .eq('broker_id', userData.user.id)
      .order('invited_at', { ascending: false });
    teamMembers = data ?? [];
  }

  const isPro = brokerProfile?.tier === 'pro';
  const seatsLimit = brokerProfile?.team_seats_limit ?? 0;

  if (!isPro) {
    return (
      <div className="px-6 md:px-10 py-8 md:py-12">
        <div className="max-w-content mx-auto">
          <div className="rounded-card bg-paper border border-stone p-10 text-center">
            <Shield className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-head-md text-navy mb-2">Team ist Pro-Feature</h2>
            <p className="text-body-sm text-muted max-w-sm mx-auto mb-6">
              Mit dem Broker Pro-Paket kannst du bis zu 5 Mitarbeiter onboarden
              und Mandate gemeinsam bearbeiten.
            </p>
            <a
              href="/dashboard/broker/paket"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Auf Pro upgraden
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="overline text-bronze-ink mb-2">Team</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Mitarbeiter
            </h1>
            <p className="text-body text-muted mt-2">
              {teamMembers.length} / {seatsLimit} Plätze belegt
            </p>
          </div>
          {teamMembers.length < seatsLimit && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Einladen
            </button>
          )}
        </div>

        {teamMembers.length === 0 ? (
          <div className="rounded-card bg-paper border border-stone p-10 text-center">
            <Users className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-head-md text-navy mb-2">Noch keine Mitarbeiter</h2>
            <p className="text-body-sm text-muted max-w-sm mx-auto">
              Lade Mitarbeiter ein, damit sie Mandate bearbeiten und Anfragen beantworten können.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-card bg-paper border border-stone p-4"
              >
                <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-navy" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-navy font-medium">{member.user_id}</p>
                  <p className="text-caption text-muted mt-0.5">
                    {member.joined_at ? 'Beigetreten' : 'Einladung ausstehend'}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-medium uppercase bg-stone text-quiet">
                  {member.rolle}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
