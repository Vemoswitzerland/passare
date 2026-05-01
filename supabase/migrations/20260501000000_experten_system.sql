-- Experten-System: Calendly-ähnliche Buchung von Beratungs-Terminen
-- Inspiriert von app.vemo Booking-System.
-- Cyrill 01.05.2026: «Experten-Reiter im Verkäuferbereich. Admin pflegt
-- Profile + Honorar. Verkäufer bucht Termine direkt mit Slot-Auswahl,
-- geht zum Checkout, bekommt Termin bestätigt.»

create table if not exists public.experten (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  funktion text,
  foto_url text,
  bio text,
  expertise text[] not null default '{}',
  email text,
  honorar_chf_pro_stunde numeric(10, 2) not null default 200,
  slot_dauer_min int not null default 30,
  available_weekdays int[] not null default '{1,2,3,4,5}',
  available_hours_start text not null default '09:00',
  available_hours_end text not null default '17:00',
  blocked_dates jsonb not null default '[]'::jsonb,
  slot_intervall_min int not null default 30,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experten_active_idx on public.experten(is_active, sort_order);
create index if not exists experten_expertise_idx on public.experten using gin(expertise);

create table if not exists public.experten_termine (
  id uuid primary key default gen_random_uuid(),
  experte_id uuid not null references public.experten(id) on delete restrict,
  verkaeufer_id uuid not null references auth.users(id) on delete cascade,
  start_at timestamptz not null,
  dauer_min int not null default 30,
  name text,
  email text,
  telefon text,
  thema text,
  notizen text,
  honorar_chf numeric(10, 2),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'confirmed', 'cancelled', 'completed', 'no_show')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  meeting_url text,
  cancel_token uuid not null default gen_random_uuid(),
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experten_termine_experte_start_idx
  on public.experten_termine(experte_id, start_at);
create index if not exists experten_termine_verkaeufer_idx
  on public.experten_termine(verkaeufer_id, created_at desc);
create index if not exists experten_termine_status_idx
  on public.experten_termine(status);
create unique index if not exists experten_termine_cancel_token_idx
  on public.experten_termine(cancel_token);

create or replace function public.set_updated_at_simple()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists experten_updated on public.experten;
create trigger experten_updated
  before update on public.experten
  for each row execute function public.set_updated_at_simple();

drop trigger if exists experten_termine_updated on public.experten_termine;
create trigger experten_termine_updated
  before update on public.experten_termine
  for each row execute function public.set_updated_at_simple();

alter table public.experten enable row level security;
alter table public.experten_termine enable row level security;

drop policy if exists "experten_select_active" on public.experten;
create policy "experten_select_active"
  on public.experten for select
  using (
    is_active = true
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin')
  );

drop policy if exists "experten_admin_all" on public.experten;
create policy "experten_admin_all"
  on public.experten for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin'));

drop policy if exists "experten_termine_select" on public.experten_termine;
create policy "experten_termine_select"
  on public.experten_termine for select
  using (
    verkaeufer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin')
  );

drop policy if exists "experten_termine_insert" on public.experten_termine;
create policy "experten_termine_insert"
  on public.experten_termine for insert
  with check (verkaeufer_id = auth.uid());

drop policy if exists "experten_termine_update" on public.experten_termine;
create policy "experten_termine_update"
  on public.experten_termine for update
  using (
    verkaeufer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin')
  );

insert into public.experten (name, funktion, bio, expertise, honorar_chf_pro_stunde, slot_dauer_min, is_active, sort_order)
values
  ('Diego Berchtold', 'M&A-Berater', 'Über 15 Jahre Erfahrung in der KMU-Nachfolge, mit Schwerpunkt auf strukturierten Verkaufsprozessen.', array['M&A', 'Bewertung', 'Verhandlung'], 280, 60, true, 10),
  ('Cyrill Lüchinger', 'Strategie & Verkauf', 'Begleitet Verkäufer durch den ganzen Verkaufsprozess — von der Bewertung bis zum Closing.', array['Strategie', 'Marketing', 'Käufer-Pitch'], 240, 60, true, 20),
  ('Anastasia Müller', 'Steuern & Recht', 'Steuerberaterin mit Spezialisierung auf KMU-Verkauf, asset-share-Deals und Reorganisationen.', array['Steuern', 'Recht', 'Strukturierung'], 320, 60, true, 30)
on conflict do nothing;
