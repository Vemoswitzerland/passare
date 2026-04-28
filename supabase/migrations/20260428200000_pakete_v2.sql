-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Pakete v2 + Powerups + Inserat-Erweiterungen
-- ────────────────────────────────────────────────────────────────────
-- Strategische Änderungen:
--   1. Neue Paket-Tiers (mini/standard/premium/enterprise) statt
--      light/pro/premium — abgestimmt auf Verkaufswert-basierte Auto-
--      Empfehlung aus dem Pre-Reg-Funnel.
--   2. Powerups: einzeln zubuchbare Add-Ons (Boost, Banner, KI-Tools,
--      Service-Sessions). Mengen-basiert wie Companymarket-Checkout.
--   3. Inserat-Felder erweitern: Kategorie (M&A/Kapital/Franchise),
--      Art (Angebot/Gesuch), Immobilien-Status, Finanzierung,
--      WIR-Anteil, Eigenkapital, Preis-Range, Mehrsprachigkeit.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Paket-ENUM erweitern (additive, alte Werte bleiben) ──────────
alter type public.inserat_paket add value if not exists 'mini';
alter type public.inserat_paket add value if not exists 'standard';
alter type public.inserat_paket add value if not exists 'enterprise';
-- 'pro' und 'premium' bleiben für Rückwärtskompatibilität;
-- neue Inserate nutzen mini/standard/premium/enterprise.

-- ── 2. Inserat-Erweiterungen ────────────────────────────────────────
do $$ begin
  create type public.inserat_kategorie as enum (
    'm_a',           -- Unternehmen (M&A) — Default
    'kapital',       -- Kapitalbeteiligung / Investition
    'teilnahme',     -- Stille Teilnahme
    'franchise',     -- Franchise
    'handelsvertretung', -- Handelsvertretung
    'shareit'        -- Cap-Table-Share
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inserat_art as enum ('angebot', 'gesuch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inserat_immobilien as enum (
    'keine',         -- Keine Immobilien
    'eigentum',      -- Beinhaltet Eigentum
    'miete',         -- Beinhaltet Miete
    'auf_anfrage'    -- Auf Anfrage
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inserat_finanzierung as enum (
    'selbst',           -- Selbstfinanzierung
    'abzahlung',        -- Abzahlung möglich (Verkäufer-Darlehen)
    'verhandlungsfaehig'-- Verhandlungsfähig
  );
exception when duplicate_object then null; end $$;

alter table public.inserate
  add column if not exists art public.inserat_art not null default 'angebot',
  add column if not exists kategorie public.inserat_kategorie not null default 'm_a',
  add column if not exists immobilien public.inserat_immobilien,
  add column if not exists finanzierung public.inserat_finanzierung,
  add column if not exists wir_anteil_moeglich boolean not null default false,
  add column if not exists eigenkapital_chf numeric(14,2),
  add column if not exists kaufpreis_min_chf numeric(14,2),
  add column if not exists kaufpreis_max_chf numeric(14,2),
  add column if not exists umsatz_min_chf numeric(14,2),
  add column if not exists umsatz_max_chf numeric(14,2),
  add column if not exists rechtsform_typ text,    -- 'AG'/'GmbH'/'Einzelunternehmen'/...
  -- Mehrsprachigkeit: jsonb-Map { de: {titel, beschreibung, teaser}, en: {...}, ... }
  add column if not exists i18n jsonb not null default '{}'::jsonb,
  -- Soziale Links
  add column if not exists website_url text,
  add column if not exists linkedin_url text,
  add column if not exists twitter_url text,
  add column if not exists facebook_url text;

-- ── 3. Mehrere Kontaktpersonen pro Inserat ──────────────────────────
create table if not exists public.inserat_kontakte (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  rolle text,                          -- 'Inhaber:in' / 'Berater:in' / 'CFO' etc.
  name text,
  email text,
  telefon text,
  anonym boolean not null default true,
  nimmt_chat_teil boolean not null default false,
  sortierung int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists inserat_kontakte_idx on public.inserat_kontakte(inserat_id);

alter table public.inserat_kontakte enable row level security;

create policy "kontakte_owner_all" on public.inserat_kontakte
  for all using (
    auth.uid() in (select owner_id from public.inserate where id = inserat_id)
  );

create policy "kontakte_public_read" on public.inserat_kontakte
  for select using (
    inserat_id in (select id from public.inserate where status = 'live')
  );

-- ── 4. Mehrere Bilder/Videos/Dokumente pro Inserat ──────────────────
create table if not exists public.inserat_medien (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  typ text not null check (typ in ('bild', 'video', 'dokument')),
  url text not null,                   -- Storage-URL oder externe URL
  titel text,
  alt_text text,
  ist_cover boolean not null default false,
  sortierung int not null default 0,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists inserat_medien_idx on public.inserat_medien(inserat_id, sortierung);

alter table public.inserat_medien enable row level security;

create policy "medien_owner_all" on public.inserat_medien
  for all using (
    auth.uid() in (select owner_id from public.inserate where id = inserat_id)
  );

create policy "medien_public_read" on public.inserat_medien
  for select using (
    inserat_id in (select id from public.inserate where status = 'live')
  );

-- ── 5. Powerups-Katalog (Read-only Reference) ───────────────────────
create table if not exists public.powerups (
  id text primary key,                 -- 'top3_boost' / 'leaderboard' / ...
  label_de text not null,
  kategorie text not null,             -- 'sichtbarkeit'/'reichweite'/'tools'/'service'
  preis_chf numeric(8,2) not null,
  einheit_label text,                  -- '7 Tage' / 'einmalig' / ...
  laufzeit_tage int,                   -- für zeitlich begrenzte Powerups
  beschreibung text,
  active boolean not null default true,
  sort_order int not null default 0
);

alter table public.powerups enable row level security;

create policy "powerups_public_read" on public.powerups for select using (true);

-- Seed-Daten (synchron mit src/data/pakete.ts)
insert into public.powerups (id, label_de, kategorie, preis_chf, einheit_label, laufzeit_tage, beschreibung, sort_order)
values
  ('top3_boost',       'Top-3-Boost',                'sichtbarkeit', 79,  '7 Tage',     7,    'Inserat erscheint 7 Tage in den Top-3 der Marktplatz-Liste.', 10),
  ('featured_goldrand','Featured-Listing',           'sichtbarkeit', 179, '30 Tage',    30,   'Goldrand-Hervorhebung im Marktplatz, 5× mehr Klicks.',         20),
  ('leaderboard',      'Leaderboard-Banner',         'reichweite',   449, '1 Woche',    7,    'Volle Bildschirmbreite oben auf der Marktplatz-Hauptseite.',   30),
  ('rechteckbanner',   'Rechteck-Banner',            'reichweite',   249, '30 Tage',    30,   'Rechteck-Banner in der Marktplatz-Sidebar.',                   40),
  ('skyscraper',       'Skyscraper-Banner',          'reichweite',   39,  '7 Tage',     7,    'Schmaler Banner seitlich — günstige Dauer-Sichtbarkeit.',     50),
  ('newsletter_max',   'MAX-Käufer Newsletter',      'reichweite',   129, '1 Versand',  null, 'Eintrag im Newsletter an alle MAX-Käufer.',                    60),
  ('pdf_expose',       'PDF-Exposé-Generator',       'tools',        49,  'einmalig',   null, 'Auf Knopfdruck KI-generiertes 1-Pager-Exposé für Käufer-Versand.', 70),
  ('nda_generator',    'NDA-Generator',              'tools',        49,  'einmalig',   null, 'KI-personalisierter NDA nach Schweizer Recht.',                80),
  ('loi_generator',    'Letter-of-Interest-Generator','tools',       49,  'einmalig',   null, 'KI-LoI für ernsthafte Käufer vor NDA-Phase.',                  90),
  ('video_tour',       '1-Min Video-Tour',           'service',      179, 'einmalig',   null, 'Wir produzieren 1-Min-Video deiner Firma (KI + B-Roll).',     100),
  ('concierge_session','Konzierge-Beratung',         'service',      249, '1 Session',  null, '60-Min 1:1-Call mit M&A-Experten zur Inserat-Optimierung.',  110)
on conflict (id) do update set
  label_de = excluded.label_de,
  preis_chf = excluded.preis_chf,
  beschreibung = excluded.beschreibung;

-- ── 6. Powerup-Bestellungen (gekauft/aktiv pro Inserat) ─────────────
create table if not exists public.inserat_powerups (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  powerup_id text not null references public.powerups(id),
  menge int not null default 1 check (menge > 0),
  preis_chf numeric(8,2) not null,     -- Snapshot zum Kaufzeitpunkt
  bezahlt_at timestamptz,
  aktiviert_at timestamptz,
  laeuft_bis timestamptz,
  stripe_session_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'active', 'expired', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists inserat_powerups_inserat_idx on public.inserat_powerups(inserat_id);
create index if not exists inserat_powerups_aktiv_idx on public.inserat_powerups(inserat_id, status, laeuft_bis)
  where status = 'active';

alter table public.inserat_powerups enable row level security;

create policy "powerups_owner_select" on public.inserat_powerups
  for select using (
    auth.uid() in (select owner_id from public.inserate where id = inserat_id)
  );

create policy "powerups_owner_insert" on public.inserat_powerups
  for insert with check (
    auth.uid() in (select owner_id from public.inserate where id = inserat_id)
  );

-- ── 7. View: aktive Powerups (für Marktplatz-Sortierung) ────────────
create or replace view public.v_inserat_active_powerups as
select
  i.id as inserat_id,
  i.status,
  exists(
    select 1 from public.inserat_powerups p
    where p.inserat_id = i.id and p.powerup_id = 'top3_boost'
      and p.status = 'active' and (p.laeuft_bis is null or p.laeuft_bis > now())
  ) as has_top3_boost,
  exists(
    select 1 from public.inserat_powerups p
    where p.inserat_id = i.id and p.powerup_id = 'featured_goldrand'
      and p.status = 'active' and (p.laeuft_bis is null or p.laeuft_bis > now())
  ) as has_featured,
  exists(
    select 1 from public.inserat_powerups p
    where p.inserat_id = i.id and p.powerup_id = 'leaderboard'
      and p.status = 'active' and (p.laeuft_bis is null or p.laeuft_bis > now())
  ) as has_leaderboard
from public.inserate i;

grant select on public.v_inserat_active_powerups to anon, authenticated;

-- ── 8. RPC: Auto-Empfehlung Paket basierend auf Verkaufspreis ───────
create or replace function public.recommend_paket(p_value numeric)
returns text language sql immutable as $$
  select case
    when p_value is null or p_value <= 0 then 'standard'
    when p_value < 250000 then 'mini'
    when p_value < 2000000 then 'standard'
    when p_value < 10000000 then 'premium'
    else 'enterprise'
  end;
$$;

grant execute on function public.recommend_paket(numeric) to anon, authenticated;

-- ── 9. Kommentare ───────────────────────────────────────────────────
comment on column public.inserate.kaufpreis_min_chf is 'Optional Range-Untergrenze. Falls null: einzelner Wert in kaufpreis_chf.';
comment on column public.inserate.kaufpreis_max_chf is 'Optional Range-Obergrenze.';
comment on column public.inserate.i18n is 'Format: { "de": {"titel":"…", "teaser":"…", "beschreibung":"…"}, "en": {...} }';
comment on column public.inserate.eigenkapital_chf is 'Erforderliches Eigenkapital für Käufer (informativ).';
comment on table public.powerups is 'Read-only Katalog der Add-Ons.';
comment on table public.inserat_powerups is 'Gekaufte Powerups pro Inserat.';
