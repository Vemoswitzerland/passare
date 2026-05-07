-- ════════════════════════════════════════════════════════════════════
-- Admin-Invitations — Cyrill 05.05.2026
-- ────────────────────────────────────────────────────────────────────
-- Admin kann via /admin/users Invitation an E-Mail+Rolle schicken.
-- Empfänger klickt Link in der E-Mail → /auth/invite/[token] → Account
-- erstellen ODER wenn schon eingeloggt: Rolle wird gesetzt.
--
-- Cyrill 07.05.2026: Enum-Wert `admin_invite` für public.email_template
-- musste nachgezogen werden — der erste Versand schlug silent fehl,
-- weil die Edge-Function den email_log-Insert nicht durchbekam.
-- ════════════════════════════════════════════════════════════════════

-- 1. email_template-Enum erweitern (silent-failed Fix)
ALTER TYPE public.email_template ADD VALUE IF NOT EXISTS 'admin_invite';

-- 2. Tabelle
create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  email text not null,
  rolle text not null check (rolle in ('admin','verkaeufer','kaeufer','broker')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_by_name text,
  invited_by_email text,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_invitations_token on public.admin_invitations(token);
create index if not exists idx_admin_invitations_email on public.admin_invitations(lower(email));
create index if not exists idx_admin_invitations_status on public.admin_invitations(accepted_at, revoked_at, expires_at);

alter table public.admin_invitations enable row level security;

drop policy if exists "admin_inv_admin_full" on public.admin_invitations;
create policy "admin_inv_admin_full" on public.admin_invitations
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rolle = 'admin'));

-- 3. RPC: token-basierter Lookup für die Accept-Page
create or replace function public.get_invitation_by_token(p_token text)
returns table (
  email text,
  rolle text,
  invited_by_name text,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select email, rolle, invited_by_name, expires_at, accepted_at, revoked_at
  from public.admin_invitations
  where token = p_token
  limit 1;
$$;

grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

-- 4. RPC: Akzeptieren — atomar User-Profile-Rolle setzen
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.admin_invitations%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'nicht_eingeloggt');
  end if;

  select * into v_invitation
  from public.admin_invitations
  where token = p_token
  for update
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'token_unbekannt');
  end if;
  if v_invitation.accepted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'bereits_eingeloest');
  end if;
  if v_invitation.revoked_at is not null then
    return jsonb_build_object('ok', false, 'error', 'widerrufen');
  end if;
  if v_invitation.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'abgelaufen');
  end if;

  update public.profiles
  set rolle = v_invitation.rolle,
      updated_at = now()
  where id = v_user_id;

  update public.admin_invitations
  set accepted_at = now(),
      accepted_user_id = v_user_id
  where id = v_invitation.id;

  return jsonb_build_object('ok', true, 'rolle', v_invitation.rolle);
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
