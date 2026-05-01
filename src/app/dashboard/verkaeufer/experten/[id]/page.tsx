import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ExpertenBookingClient } from './BookingClient';

export const metadata = { title: 'Experte buchen — passare' };

type Props = { params: Promise<{ id: string }> };

export default async function ExperteDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: experte } = await supabase
    .from('experten')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (!experte) notFound();

  // Verkäufer-Profil laden für Auto-Fill der Buchungsfelder
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', userData.user.id)
    .maybeSingle();

  // Bereits gebuchte Slots der nächsten 60 Tage laden — über Service-Role
  // damit auch Slots anderer Verkäufer (anonymisiert) als blockiert gelten.
  const adminClient = createAdminClient();
  const startWindow = new Date();
  startWindow.setHours(0, 0, 0, 0);
  const endWindow = new Date();
  endWindow.setDate(endWindow.getDate() + 60);
  const { data: belegteSlots } = await adminClient
    .from('experten_termine')
    .select('start_at, dauer_min')
    .eq('experte_id', id)
    .in('status', ['pending', 'paid', 'confirmed'])
    .gte('start_at', startWindow.toISOString())
    .lte('start_at', endWindow.toISOString());

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <Link
          href="/dashboard/verkaeufer/experten"
          className="inline-flex items-center gap-1 text-caption text-bronze-ink hover:text-bronze mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück zur Experten-Liste
        </Link>

        <ExpertenBookingClient
          experte={{
            id: experte.id as string,
            name: experte.name as string,
            funktion: (experte.funktion as string | null) ?? null,
            foto_url: (experte.foto_url as string | null) ?? null,
            bio: (experte.bio as string | null) ?? null,
            expertise: (experte.expertise as string[] | null) ?? [],
            honorar: Number(experte.honorar_chf_pro_stunde),
            slot_dauer_min: Number(experte.slot_dauer_min),
            available_weekdays: (experte.available_weekdays as number[] | null) ?? [1, 2, 3, 4, 5],
            available_hours_start: (experte.available_hours_start as string) ?? '09:00',
            available_hours_end: (experte.available_hours_end as string) ?? '17:00',
            slot_intervall_min: Number(experte.slot_intervall_min),
            blocked_dates: Array.isArray(experte.blocked_dates) ? (experte.blocked_dates as string[]) : [],
          }}
          belegteSlots={(belegteSlots ?? []).map((s) => ({
            start_at: s.start_at as string,
            dauer_min: s.dauer_min as number,
          }))}
          initialName={(profile?.full_name as string | null) ?? userData.user.user_metadata?.full_name ?? ''}
          initialEmail={userData.user.email ?? ''}
          initialTelefon={(profile?.phone as string | null) ?? ''}
        />
      </div>
    </div>
  );
}
