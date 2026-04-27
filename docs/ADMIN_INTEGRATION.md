# Admin-Bereich — Integration-Punkte

Dieses Dokument listet ALLE Verbindungs-Punkte zwischen dem Admin-Bereich
(`/admin/*`) und den Verkäufer-/Käufer-Bereichen, die noch verbunden werden
müssen, sobald alle drei Bereiche stehen. Jeder Punkt enthält:

- **Wo** im Admin der Hook aktuell als Mock/Stub steht
- **Was** angeschlossen werden muss
- **Erwartete DB-Tabelle / API** (existiert / fehlt)
- **Etappe**, in der das gemacht werden sollte

---

## 1. Inserate ↔ Verkäufer ↔ Public-Marktplatz

### 1.1 Demo → echte `inserate`-Tabelle

| Wo Admin | Mock-Quelle | Soll: |
|---|---|---|
| `/admin/inserate` (Tabelle + Karten) | `ADMIN_DEMO_LISTINGS` aus [src/data/admin-demo.ts](src/data/admin-demo.ts) | `supabase.from('inserate').select(...)` |
| `/admin/inserate/[id]` (Detail) | dito | analog |
| `/admin/page.tsx` (Stats: aktive Inserate) | `ADMIN_DEMO_STATS.aktive_inserate` | `count` aus `inserate` mit `status='live'` |
| `/admin/page.tsx` (QuickAction: Pending freigeben) | `ADMIN_DEMO_STATS.pending_inserate` | `count` mit `status='pending'` |

**Erwartete Spalten in `inserate`:**
```
id (uuid), public_id (text "dossier-xxx"),
verkaeufer_id (uuid → profiles.id), titel, branche, kanton,
gruendungsjahr, mitarbeitende, umsatz_chf, ebitda_pct, kaufpreis_range,
grund, paket ('light'|'pro'|'premium'), admin_status enum,
created_at, expires_at, paused_at, deleted_at
```

**Etappe:** ~47 (Verkäufer-Agent baut Tabelle + Insert-Flow).

### 1.2 Inserat-Aktionen (V1 disabled)

In [src/app/admin/inserate/[id]/page.tsx](src/app/admin/inserate/[id]/page.tsx) und der Tabelle sind diese Buttons als `disabled` mit Tooltip "kommt in Etappe 47":

| Button | Erwarteter Server-Action-Endpoint |
|---|---|
| **Bearbeiten** | `editInseratAction(id, patch)` — Admin überschreibt Verkäufer-Felder |
| **Pausieren** | `pauseInseratAction(id, reason)` — setzt `admin_status='pausiert'` + benachrichtigt Verkäufer |
| **Aktivieren** | `activateInseratAction(id)` — von `pending` → `live` (Freigabe) oder `pausiert` → `live` |
| **Löschen** | (UI noch nicht da, soll dazukommen) `softDeleteInseratAction(id, reason)` |

**Verbindung Public-View:** Detail-Seite hat einen Link `/?inserat={id}` (target=_blank) zu Public-Marktplatz — der Verkäufer/Käufer-Agent muss eine Route `/inserat/[id]` oder `/?inserat=...` Anchor bauen. Aktuell nur Mockup-Link.

### 1.3 Verkäufer-Verlinkung

In `/admin/inserate/[id]` zeigt die Verkäufer-Sidebar nur `verkaeufer_email` (Mock-String). Sobald `inserate.verkaeufer_id` existiert:

```tsx
<Link href={`/admin/users/${listing.verkaeufer_id}`}>
  {profile.full_name} ({email})
</Link>
```

Code-Stelle: [src/app/admin/inserate/[id]/page.tsx:151](src/app/admin/inserate/[id]/page.tsx:151) — Aside «Verkäufer».

### 1.4 Verkäufer-Dashboard ↔ Admin

Wenn der Verkäufer in `/dashboard/verkaeufer` ein neues Inserat einreicht:
- Admin sieht es sofort unter `/admin/inserate?status=pending`
- Stats-Karte „Pending" auf `/admin` zählt mit
- QuickAction „Inserat freigeben" auf Dashboard verlinkt direkt dorthin

**Pflicht-Realtime-Subscription** (optional Etappe 90):
```ts
supabase.channel('admin_inserate')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'inserate' }, refresh)
  .subscribe()
```

---

## 2. Anfragen ↔ Käufer ↔ Verkäufer

### 2.1 Demo → echte `anfragen`-Tabelle

| Wo Admin | Mock-Quelle | Soll: |
|---|---|---|
| `/admin/anfragen` | `ADMIN_DEMO_ANFRAGEN` | `supabase.from('anfragen').select(...)` |
| `/admin/anfragen/[id]` | dito | analog |
| `/admin/inserate/[id]` (verlinkte Anfragen) | `ADMIN_DEMO_ANFRAGEN.filter(inserat_id===id)` | join mit `anfragen` |
| `/admin/page.tsx` (Stats: offene Anfragen) | `ADMIN_DEMO_STATS.offene_anfragen` | count |

**Erwartete Spalten in `anfragen`:**
```
id (uuid), public_id (text "ANF-2026-xxx"),
inserat_id (uuid → inserate.id), kaeufer_id (uuid → profiles.id),
status enum ('offen'|'in_bearbeitung'|'akzeptiert'|'abgelehnt'),
nda_signed_at, erstnachricht (text), created_at, updated_at
```

**Erwartete Tabelle `anfrage_messages`** (für Konversation):
```
id, anfrage_id, sender_id, body, created_at, read_at
```

**Etappe:** ~50.

### 2.2 Anfrage-Detail-Aktionen

In [src/app/admin/anfragen/[id]/page.tsx](src/app/admin/anfragen/[id]/page.tsx) sind 4 Demo-Buttons:

| Button | Server-Action |
|---|---|
| **Genehmigen** | `approveAnfrageAction(id)` — `status='akzeptiert'`, schickt Mail an Käufer + Verkäufer |
| **Ablehnen** | `rejectAnfrageAction(id, reason)` — `status='abgelehnt'` |
| **NDA anfordern** | `requestNdaAction(anfrage_id)` — generiert NDA-Doc, schickt an Käufer |
| **Verkäufer pingen** | `notifySellerAction(anfrage_id)` — Reminder-Mail |

**Etappe:** ~51.

### 2.3 Käufer-Verlinkung

Aside «Käufer» zeigt nur Email/Name. Sobald `anfragen.kaeufer_id` existiert:

```tsx
<Link href={`/admin/users/${anfrage.kaeufer_id}`}>{kaeufer_name}</Link>
```

Code-Stelle: [src/app/admin/anfragen/[id]/page.tsx:178](src/app/admin/anfragen/[id]/page.tsx:178).

### 2.4 Käufer-Dashboard ↔ Admin

Wenn Käufer in `/dashboard/kaeufer/anfragen/neu` eine Anfrage stellt:
- Sofortige Aktualisierung der `/admin/anfragen` Liste
- Stats-Karte „Offene Anfragen" zählt mit
- Activity-Feed-Eintrag in `/admin/logs`

---

## 3. Users ↔ alle Bereiche

### 3.1 User-Detail bereits live

`/admin/users/[id]` ([src/app/admin/users/[id]/page.tsx](src/app/admin/users/[id]/page.tsx)) ist bereits **vollständig** an die echte `profiles`-Tabelle angeschlossen:
- `full_name`, `rolle`, `kanton`, `sprache`, `phone`
- `verified_phone`, `verified_kyc` ← Server Action `setVerificationAction`
- `qualitaets_score` ← Server Action `setQualitaetsScoreAction`
- `tags` ← Server Action `setTagsAction`
- `admin_notes` ← Server Action `setAdminNotesAction`
- `mfa_enrolled`, `is_broker`, `stripe_customer_id` (read-only)
- `auth.users.email`, `last_sign_in_at`, `created_at` via `createAdminClient()`

**Server Actions** in [src/app/admin/actions.ts](src/app/admin/actions.ts) — alle haben:
- `assertAdmin()` Guard
- Zod-Schema-Validierung
- `revalidatePath('/admin/users/...')` nach Erfolg

### 3.2 Fehlende User-Aktionen

Diese Aktionen fehlen noch (User kann das aber teilweise selbst — Admin braucht Override):

| Aktion | Aktueller Status | TODO |
|---|---|---|
| **Rolle ändern** | UI fehlt — Rolle ist `einmalig_setzbar` per RLS-Constraint | Override für Admin: `setRoleAdminAction(user_id, rolle)` mit Audit-Log |
| **User sperren / deaktivieren** | UI fehlt | `disableUserAction(user_id, reason)` — setzt Flag + revoked alle Sessions via `auth.admin.updateUserById()` |
| **Passwort-Reset auslösen** | UI fehlt | `triggerPasswordResetAction(email)` — admin-initiiertes Reset-Mail |
| **MFA zurücksetzen** | UI fehlt | `resetMfaAction(user_id)` — bei verlorenem 2FA |
| **Stripe-Verknüpfung** | nur read | `linkStripeCustomerAction(user_id, stripe_id)` |
| **E-Mail ändern** | nur read | `updateUserEmailAction(user_id, new_email)` via auth.admin |

**Etappe:** ~83 (Admin-Erweiterung Phase 2).

### 3.3 User-Profil aus Verkäufer/Käufer-Sicht

Wenn Verkäufer/Käufer-Bereich `profiles`-Felder ändern (z. B. Telefon, Kanton via Profil-Edit), muss Admin live davon profitieren:
- ✅ bereits gegeben — `/admin/users/[id]` liest direkt aus `profiles`
- ⚠️ Aber: ImpersonationBanner / ViewSwitcher müssen prüfen ob der eingeloggte User noch Admin ist (via Cookie `admin_impersonation`). Wenn das Cookie gesetzt ist, gibt es **noch keine Server-Side-Prüfung**, dass der User Admin ist. Käufer/Verkäufer-Agent muss in seiner Layout/Middleware:
  ```ts
  if (cookies.get('admin_impersonation')) {
    const { data: profile } = await supabase.from('profiles').select('rolle').eq('id', user.id).single();
    if (profile?.rolle !== 'admin') {
      // Cookie blockieren / löschen + zurück zu /dashboard
    }
  }
  ```

---

## 4. Activity-Feed (Logs)

### 4.1 Aktuelle Quellen

`/admin/logs` ([src/app/admin/logs/page.tsx](src/app/admin/logs/page.tsx)) kombiniert:
- ✅ **Live**: `terms_acceptances` aus DB
- ❌ **Mock**: Login-Events, Inserat-Edits, NDA-Sign, Anfrage-Events (`ADMIN_DEMO_LOGS`)

### 4.2 Soll: Audit-Log-Tabelle

Erwartete Tabelle `audit_log`:
```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,           -- 'login', 'inserat_edit', 'inserat_freigabe',
                                -- 'nda_signed', 'anfrage', 'register', 'profile_update'
  user_id uuid REFERENCES profiles(id),
  user_email text,              -- denormalisiert für Logs (User kann gelöscht werden)
  beschreibung text NOT NULL,
  metadata jsonb,               -- { inserat_id, anfrage_id, ip, user_agent, ... }
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_created_at_idx ON audit_log (created_at DESC);
CREATE INDEX audit_log_user_id_idx ON audit_log (user_id);
CREATE INDEX audit_log_type_idx ON audit_log (type);
```

### 4.3 Wo Events emittiert werden müssen

Jede dieser Stellen in Verkäufer-/Käufer-Bereich sollte einen `audit_log`-Eintrag schreiben (am besten via DB-Trigger oder Server-Action-Helper `logEvent(type, user_id, beschreibung, metadata)`):

| Event-Type | Auslöser (wer baut?) |
|---|---|
| `login` | Auth-Hook in `auth/actions.ts` (existiert) |
| `register` | dito |
| `inserat_edit` | Verkäufer-Agent: nach Update-Action |
| `inserat_freigabe` | Admin-Aktion (siehe 1.2) |
| `nda_signed` | Käufer-Agent: nach NDA-Submit |
| `anfrage` | Käufer-Agent: nach Anfrage-Submit |
| `profile_update` | Profil-Edit Server-Action (existiert teils) |
| `verification_change` | Admin-Aktion `setVerificationAction` (existiert — sollte auch loggen) |

**Etappe:** ~52 (Audit-Log-Tabelle).

### 4.4 User-Detail-Page Activity

In [src/app/admin/users/[id]/page.tsx](src/app/admin/users/[id]/page.tsx) (Aside «Letzte Aktivitäten») wird aktuell `ADMIN_DEMO_LOGS` geflter — soll später `audit_log.where(user_id=id).order(created_at DESC).limit(5)`.

---

## 5. ViewSwitcher / Impersonation-Pattern

### 5.1 Aktueller Stand

[src/components/admin/ViewSwitcher.tsx](src/components/admin/ViewSwitcher.tsx) — Dropdown im Header mit drei Optionen:
- Admin-Ansicht (default)
- Als Verkäufer ansehen (setzt Cookie `admin_impersonation=verkaeufer`, redirected zu `/dashboard`)
- Als Käufer ansehen (analog für `kaeufer`)

[src/components/admin/ImpersonationBanner.tsx](src/components/admin/ImpersonationBanner.tsx) — fixer Banner oben, sichtbar wenn Cookie gesetzt, mit «Zurück zur Admin-Ansicht»-Button.

### 5.2 Was Verkäufer-/Käufer-Agent tun muss

In den respektiven Layouts (`/dashboard/verkaeufer/layout.tsx`, `/dashboard/kaeufer/layout.tsx` oder zentral `/dashboard/layout.tsx`):

```tsx
import { cookies } from 'next/headers';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const impersonation = cookieStore.get('admin_impersonation')?.value;

  // ... existierende Auth-Logik
  // Admin-Check wenn Cookie gesetzt
  if (impersonation) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('rolle').eq('id', data.user.id).maybeSingle();
    if (profile?.rolle !== 'admin') {
      // Cookie löschen / weiter normal
    }
  }

  return (
    <>
      <ImpersonationBanner />  {/* zeigt sich automatisch wenn Cookie */}
      {children}
    </>
  );
}
```

### 5.3 Optional: Demo-Daten beim Impersonation-Mode

Wenn `admin_impersonation=verkaeufer`, könnte das Verkäufer-Dashboard Demo-Daten zeigen (1 Beispiel-Inserat in jedem Status etc.) statt der echten Daten des eingeloggten Admins. Das spart, einen Demo-Account zu pflegen. Aber: V1-Variante ist auch einfach „Admin sieht sein eigenes Profil im Verkäufer-Layout" — funktioniert wenn Admin eh keinen Verkäufer-Status hat (zeigt Empty-State).

---

## 6. Stripe / Abos

### 6.1 Aktueller Stand

`/admin/users/[id]` Sidebar zeigt `stripe_customer_id` falls gesetzt. Sonst „Kein Stripe-Kunde verknüpft".

`/admin/page.tsx` Stat-Karte „MAX-Abos" ist Mock (`ADMIN_DEMO_STATS.max_abos = 7`).

### 6.2 Soll

Erwartete Tabelle `subscriptions` (Käufer-MAX-Abo):
```
id, user_id, stripe_subscription_id, stripe_customer_id,
status ('active'|'cancelled'|'past_due'),
current_period_end, plan ('max_monthly'|'max_yearly'),
cancel_at_period_end (boolean), created_at
```

**Admin-Bereich Anschluss:**
- `/admin/page.tsx` Stat-Karte → `count(*) FROM subscriptions WHERE status='active'`
- Neue Sektion `/admin/abos` mit Liste (analog Anfragen) + Detail-View
- `/admin/users/[id]` Sidebar Aside zeigt aktuelle Subscription + History

**Etappe:** ~76 (Stripe-Integration).

---

## 7. Settings — Read-Only zu editierbar

[src/app/admin/settings/page.tsx](src/app/admin/settings/page.tsx) ist V1 statisch. Editierbare Settings sollten in eine `platform_settings` Single-Row-Tabelle:

```sql
CREATE TABLE platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Single-Row
  beta_enabled boolean DEFAULT true,
  beta_code text,
  current_agb_version text,
  current_datenschutz_version text,
  notification_email text,
  meta_pixel_id text,
  ...
);
```

**Etappe:** ~80.

---

## 8. globale Suche

[src/app/admin/search/page.tsx](src/app/admin/search/page.tsx) durchsucht aktuell:
- `profiles` (live)
- `ADMIN_DEMO_LISTINGS` (Mock)
- `ADMIN_DEMO_ANFRAGEN` (Mock)

Sobald die echten Tabellen existieren, müssen die Filter auf SQL-`ILIKE`-Queries umgestellt werden:
```ts
.from('inserate').select('*').or(`titel.ilike.%${query}%,branche.ilike.%${query}%`)
```

Optional Etappe 85: pgvector / pg_trgm für unscharfe Suche.

---

## 9. Realtime-Updates (optional Etappe 90+)

Sobald die DB-Tabellen stehen, kann Admin via Supabase Realtime auf Änderungen reagieren:

```ts
// /admin/page.tsx (Client Component für Stats)
useEffect(() => {
  const channel = supabase.channel('admin')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inserate' }, refreshStats)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'anfragen' }, refreshStats)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, refreshActivity)
    .subscribe();
  return () => { supabase.removeChannel(channel) };
}, []);
```

---

## 10. RLS-Policies — Admin-Override prüfen

Aktuell hat `profiles` nur Self-Select/Self-Update RLS. Damit der Admin-Bereich „normal" arbeiten kann (ohne immer `createAdminClient()` zu brauchen), sollten Admin-Bypass-Policies hinzukommen:

```sql
-- profiles: Admins sehen alle
CREATE POLICY "profiles_admin_all" ON profiles
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rolle = 'admin')
);

-- analog für inserate, anfragen, audit_log
```

Das gilt für **alle Tabellen** die Verkäufer/Käufer-Agent baut.

**Etappe:** Bei jeder neuen Tabelle direkt mit-implementieren (Migration enthält auch Admin-Policy).

---

## Übersicht: Was Verbindungs-Agent prüfen muss

Beim Zusammenführen der drei Bereiche bitte folgendes durchgehen:

1. ✅ Routen-Konflikte? Admin nutzt `/admin/*`, Verkäufer `/dashboard/verkaeufer/*`, Käufer `/dashboard/kaeufer/*`. Keine Überschneidung erwartet.
2. ✅ Layout-Konflikte? Admin hat eigenes `/admin/layout.tsx`. Käufer/Verkäufer könnten `/dashboard/layout.tsx` teilen.
3. ⚠️ **Cookie-`admin_impersonation`** muss in Käufer/Verkäufer-Layouts berücksichtigt werden (siehe 5.2).
4. ⚠️ Server Actions in `src/app/admin/actions.ts` — keine Konflikte mit `src/app/auth/actions.ts` oder neuen Verkäufer/Käufer-Actions.
5. ⚠️ `audit_log`-Schema einheitlich zwischen allen Stellen die Events schreiben (siehe 4.2).
6. ⚠️ `ImpersonationBanner` und `ViewSwitcher` aus `src/components/admin/*` werden auch in Verkäufer/Käufer-Layout verwendet — **Pfad bleibt** (kein Move), nur Import in den jeweiligen Layouts.
7. ⚠️ Pricing-Texte in `/admin/settings` müssen mit `/preise` und `/verkaufen` Texten konsistent bleiben.
8. ⚠️ ENV-Variablen-Liste in `/admin/settings` aktualisieren wenn neue dazukommen (z. B. Stripe-Keys).
9. ⚠️ Sobald `inserate`-Tabelle existiert: `ADMIN_DEMO_LISTINGS` durch echte Queries ersetzen — alle 4 Stellen suchen mit `git grep ADMIN_DEMO`.
10. ⚠️ Sobald `anfragen`-Tabelle existiert: analog `ADMIN_DEMO_ANFRAGEN` ersetzen.
11. ⚠️ Sobald `audit_log`-Tabelle existiert: `ADMIN_DEMO_LOGS` ersetzen + alle Verkäufer/Käufer-Server-Actions müssen `logEvent()` aufrufen.

---

## Files in dieser Etappe (Admin) — Status: live

| Datei | Status |
|---|---|
| [src/app/admin/layout.tsx](src/app/admin/layout.tsx) | ✓ live |
| [src/app/admin/page.tsx](src/app/admin/page.tsx) | ✓ live |
| [src/app/admin/inserate/page.tsx](src/app/admin/inserate/page.tsx) | ✓ live (Mock) |
| [src/app/admin/inserate/[id]/page.tsx](src/app/admin/inserate/[id]/page.tsx) | ✓ live (Mock) |
| [src/app/admin/users/page.tsx](src/app/admin/users/page.tsx) | ✓ live (Live-Daten) |
| [src/app/admin/users/[id]/page.tsx](src/app/admin/users/[id]/page.tsx) | ✓ live (Live-Daten + Aktionen) |
| [src/app/admin/anfragen/page.tsx](src/app/admin/anfragen/page.tsx) | ✓ live (Mock) |
| [src/app/admin/anfragen/[id]/page.tsx](src/app/admin/anfragen/[id]/page.tsx) | ✓ live (Mock) |
| [src/app/admin/logs/page.tsx](src/app/admin/logs/page.tsx) | ✓ live (Mix Live/Mock) |
| [src/app/admin/settings/page.tsx](src/app/admin/settings/page.tsx) | ✓ live (Read-Only) |
| [src/app/admin/search/page.tsx](src/app/admin/search/page.tsx) | ✓ live (Live-User + Mock) |
| [src/app/admin/actions.ts](src/app/admin/actions.ts) | ✓ live |
| [src/components/admin/AdminShell.tsx](src/components/admin/AdminShell.tsx) | ✓ |
| [src/components/admin/AdminHeader.tsx](src/components/admin/AdminHeader.tsx) | ✓ inkl. funktionale Suche |
| [src/components/admin/AdminSidebar.tsx](src/components/admin/AdminSidebar.tsx) | ✓ |
| [src/components/admin/ViewSwitcher.tsx](src/components/admin/ViewSwitcher.tsx) | ✓ |
| [src/components/admin/ImpersonationBanner.tsx](src/components/admin/ImpersonationBanner.tsx) | ✓ |
| [src/components/admin/UserDetailForm.tsx](src/components/admin/UserDetailForm.tsx) | ✓ |
| [src/components/admin/UsersFilterBar.tsx](src/components/admin/UsersFilterBar.tsx) | ✓ |
| [src/components/admin/LogsFilterClient.tsx](src/components/admin/LogsFilterClient.tsx) | ✓ |
| [src/components/admin/StatCard.tsx](src/components/admin/StatCard.tsx) | ✓ |
| [src/components/admin/StatusBadge.tsx](src/components/admin/StatusBadge.tsx) | ✓ |
| [src/components/admin/ViewToggle.tsx](src/components/admin/ViewToggle.tsx) | ✓ |
| [src/components/admin/DataTable.tsx](src/components/admin/DataTable.tsx) | ✓ |
| [src/data/admin-demo.ts](src/data/admin-demo.ts) | ✓ — wird sukzessive durch DB-Queries ersetzt |

**Live unter:** https://passare.ch/admin (geschützt — nur `profiles.rolle = 'admin'`).

---

_Erstellt: 2026-04-27 — beim Zusammenführen mit Verkäufer- und Käufer-Bereich diese Datei abarbeiten._
