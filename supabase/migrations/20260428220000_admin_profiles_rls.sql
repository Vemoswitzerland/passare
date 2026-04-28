-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Admin-RLS für profiles + helper-Funktion is_admin()
-- ════════════════════════════════════════════════════════════════════
-- Bisheriges Problem: profiles_self_select erlaubte nur
-- `auth.uid() = id` → Admin sah nur sich selbst auf /admin/users.
--
-- Lösung: SECURITY DEFINER helper `is_admin()` (vermeidet RLS-Loop
-- weil die Function bypassed RLS) + zwei zusätzliche Policies für
-- Admin-Read und Admin-Update auf profiles.

-- ─── 1. Helper-Function: is_admin() ──────────────────────────────────
-- Wird von vielen Tabellen benutzt — zentralisiert die "ist eingeloggter
-- User Admin?"-Abfrage. SECURITY DEFINER damit es nicht selber RLS-checkt.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rolle = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'Returns true if the currently authenticated user has rolle=admin. Use in RLS policies.';

-- ─── 2. Admin-Read-Policy auf profiles ──────────────────────────────
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- ─── 3. Admin-Update-Policy auf profiles ────────────────────────────
-- Admin kann Rolle ändern, Tags setzen, qualitaets_score, admin_notes, etc.
-- Achtung: Spalten-Privilege auf subscription_tier/stripe_subscription_id
-- bleibt revoked (Migration 20260427182000_kaeufer.sql) — Admin kann diese
-- Spalten weiterhin nicht via authenticated-Role direkt setzen (richtig so:
-- nur Stripe-Webhook via service_role).
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 4. Admin-Read-Policy auf auth.users (über RPC) ──────────────────
-- Admin braucht für /admin/users die Email-Adressen.
-- Direkter Zugriff auf auth.users ist authenticated nicht erlaubt.
-- Lösung: Service-Role-Client im Backend (siehe /admin/users/page.tsx
-- nutzt schon `createAdminClient().auth.admin.listUsers()`).
-- Das funktioniert sobald SUPABASE_SERVICE_ROLE_KEY in der Environment
-- gesetzt ist. Hier nur Doku-Kommentar.

comment on policy "profiles_admin_select" on public.profiles is
  'Admins (rolle=admin) sehen alle Profile. Standard-User sehen nur ihr eigenes (via profiles_self_select).';
