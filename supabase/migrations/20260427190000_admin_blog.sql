-- ═══════════════════════════════════════════════════════════════
-- passare.ch — Etappe 82: Admin-Blog (Auto-Generator + Manueller Editor)
-- ───────────────────────────────────────────────────────────────
-- Tabelle für vom Admin verfasste oder KI-generierte Blog-Artikel.
-- Themen sind passare-spezifisch (Nachfolge, KMU-Verkauf, M&A, etc.).
-- Public liest nur veröffentlichte Posts via /ratgeber.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  titel       text not null,
  excerpt     text,                  -- Kurzbeschreibung / SEO-Description
  content     text not null,         -- Markdown
  kategorie   text not null default 'allgemein'
              check (kategorie in (
                'nachfolge', 'verkauf', 'kauf', 'bewertung', 'recht',
                'finanzierung', 'steuern', 'erfahrung', 'allgemein'
              )),
  autor       text not null default 'passare Redaktion',
  status      text not null default 'entwurf'
              check (status in ('entwurf', 'veroeffentlicht')),
  ai_generated boolean not null default false,
  ai_topic     text,                  -- Welches Thema wurde an KI gegeben
  featured_image_url text,
  reading_minutes integer,            -- geschätzte Lesedauer

  author_id   uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_kategorie_idx on public.blog_posts (kategorie);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);
create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

-- updated_at automatisch
drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row
  execute function public.set_updated_at();

-- Wenn status auf veroeffentlicht wechselt → published_at setzen
create or replace function public.blog_posts_set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'veroeffentlicht' and (old.status is distinct from 'veroeffentlicht') then
    new.published_at := now();
  end if;
  if new.status = 'entwurf' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists blog_posts_set_published_at on public.blog_posts;
create trigger blog_posts_set_published_at
  before insert or update on public.blog_posts
  for each row
  execute function public.blog_posts_set_published_at();

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.blog_posts enable row level security;

-- SELECT: anon/authenticated können nur veröffentlichte Posts sehen
drop policy if exists "blog_posts_public_select" on public.blog_posts;
create policy "blog_posts_public_select"
  on public.blog_posts
  for select
  to anon, authenticated
  using (status = 'veroeffentlicht');

-- SELECT: Admins sehen alles (auch Entwürfe)
drop policy if exists "blog_posts_admin_select" on public.blog_posts;
create policy "blog_posts_admin_select"
  on public.blog_posts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rolle = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE: nur Admins
drop policy if exists "blog_posts_admin_write" on public.blog_posts;
create policy "blog_posts_admin_write"
  on public.blog_posts
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rolle = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rolle = 'admin'
    )
  );

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
