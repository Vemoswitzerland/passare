# 🔗 CONNECT-AGENT — passare.ch Final Wiring & Cleanup

> **Mission:** Die 3 Bereiche (Käufer, Verkäufer, Admin) sind getrennt gebaut. Jetzt wird **alles verbunden**, **echt gemacht**, **alle Dummy-Daten entfernt**, **Supabase + Stripe + Resend live geschaltet** und **End-to-End-Tests** gefahren bis jeder Klick echt funktioniert.

---

## 1 · Setup

```bash
cd /Users/cyrill/Desktop/passare-new
git config user.email "info@vemo.ch"
git config user.name  "Vemoswitzerland"
git pull origin main
```

**Vor jeder Änderung:** `git pull` — die 3 Build-Agents haben parallel commited. Wenn merge-conflict: löse immer zugunsten des aktuelleren Codes (Käufer-Bereich-Stand vom 2026-04-28 ist Pflicht-Basis).

---

## 2 · Supabase: Migrations applieren (PFLICHT zuerst!)

Solange diese nicht laufen, sind alle 3 Bereiche tote UI-Hülsen.

```sql
-- Im Supabase-Dashboard → SQL Editor → File-Inhalt 1:1 reinkopieren + RUN
-- Reihenfolge zwingend!
```

| # | File | Zweck |
|---|---|---|
| 1 | `supabase/migrations/20260427120000_profiles_and_auth.sql` | profiles + RLS + Trigger handle_new_user |
| 2 | `supabase/migrations/20260427150000_onboarding.sql` | terms_acceptances + onboarding_completed_at |
| 3 | `supabase/migrations/20260427160000_complete_onboarding_rpc.sql` | RPC complete_onboarding |
| 4 | `supabase/migrations/20260427180000_*` | (falls vorhanden — Block fundament) |
| 5 | `supabase/migrations/20260427181000_verkaeufer.sql` | inserate, anfragen, nachrichten, nda_signaturen, datenraum_files, zahlungen |
| 6 | `supabase/migrations/20260427182000_kaeufer.sql` | kaeufer_profil, suchprofile, favoriten, alerts_sent, nda_berater_shares + subscription_tier |
| 7 | `supabase/migrations/20260427183000_lead_magnete.sql` | bewertung_drafts, pre_reg_drafts |
| 8 | `supabase/migrations/<email-tabelle>` | email_log (siehe `supabase/functions/_shared/render.ts`) |

**Verify nach Apply:**
```sql
select table_name from information_schema.tables 
where table_schema = 'public' 
order by table_name;
-- Erwartet ~15+ Tabellen, mind: profiles, terms_acceptances, inserate, inserate_media,
-- anfragen, nachrichten, nda_signaturen, datenraum_files, zahlungen,
-- kaeufer_profil, suchprofile, favoriten, alerts_sent, nda_berater_shares,
-- email_log, pre_reg_drafts, bewertung_drafts
```

Wenn eine Migration kollidiert (Tabelle existiert schon mit anderem Schema): **Du entscheidest** welche die richtige ist (Käufer-Migration ist canonical für `kaeufer_profil` etc., Verkäufer-Migration für `inserate` etc.). Schreibe dann eine NEUE Migration `20260428HHMMSS_fix_*.sql` die das angleicht — **niemals bestehende Migrationen editieren**.

---

## 3 · ENV-Variables in Vercel setzen

`https://vercel.com/vemoswitzerlands-projects/passare/settings/environment-variables` — alle für **Production**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service-role>

STRIPE_SECRET_KEY=sk_live_…   (oder sk_test_… für Beta)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_LIGHT=price_…    (Verkäufer 290)
STRIPE_PRICE_PRO=price_…      (Verkäufer 890)
STRIPE_PRICE_PREMIUM=price_…  (Verkäufer 1890)
STRIPE_PRICE_MAX_MONTHLY=price_…  (Käufer 199/M)
STRIPE_PRICE_MAX_YEARLY=price_…   (Käufer 1990/J)

RESEND_API_KEY=re_…
EMAIL_FROM=passare <noreply@passare.ch>
EMAIL_REPLY_TO=info@passare.ch

ANTHROPIC_API_KEY=sk-ant-…
ZEFIX_API_BASE=https://www.zefix.ch/ZefixREST/api/v1

BETA_ACCESS_CODE=passare2026
BETA_GATE_ENABLED=true
NEXT_PUBLIC_APP_URL=https://passare.ch
```

**Supabase Edge Function Secrets** (`supabase secrets set`):
```
RESEND_API_KEY=re_…
EMAIL_FROM=passare <noreply@passare.ch>
EMAIL_REPLY_TO=info@passare.ch
SUPABASE_SERVICE_ROLE_KEY=<service-role>
```

**Stripe Webhook in Stripe-Dashboard registrieren:**
- Endpoint: `https://passare.ch/api/stripe/webhook`
- Events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `checkout.session.completed`

---

## 4 · ALLE Dummy-Daten entfernen (PFLICHT)

Cyrills Anweisung: «keine fake Inserate alles muss funktionieren und echt sein».

### 4.1 — Files die KOMPLETT GELÖSCHT werden

```
src/lib/listings-mock.ts                  ← Mock-Inserate
src/data/admin-demo.ts                    ← Admin-Demo-Daten

emails/EmailWelcome 2.tsx                 ← Duplikate (mit " 2"-Suffix)
emails/EmailVerifizierung 2.tsx
emails/EmailPasswortReset 2.tsx
emails/EmailAlertNeuesInserat 2.tsx
emails/EmailAnfrageEingegangen 2.tsx
emails/EmailAnfrageBeantwortet 2.tsx
emails/EmailNDASigniert 2.tsx
emails/EmailZahlungBestaetigung 2.tsx
emails/EmailInseratBaldAbgelaufen 2.tsx
emails/_layout 2.tsx
```

```bash
git rm "emails/Email* 2.tsx" "emails/_layout 2.tsx" \
       src/lib/listings-mock.ts src/data/admin-demo.ts
```

### 4.2 — Hardcoded Mock-Listings raus

**`src/app/page.tsx`** Zeilen 30–39: `const LISTINGS = [...]` → ersetzen durch DB-Query in einem Server Component, der `inserate` mit `status='published'` holt.

**`src/app/dashboard/kaeufer/page.tsx`**: import `MOCK_LISTINGS` → ersetzen durch echten Daily-Digest aus `inserate` + `suchprofile`.

**`src/app/dashboard/kaeufer/favoriten/page.tsx`**: import `MOCK_LISTINGS` → JOIN `favoriten` mit `inserate`.

**`src/app/atlas/page.tsx`** & `atlas-data.ts`: alle Mock-Marker → aus `inserate` mit Geo-Coordinates.

**`src/app/admin/*`** alle Pages die `ADMIN_DEMO_*` benutzen → durch echte Tabellen-Queries ersetzen.

### 4.3 — Helper bauen

Erstelle **`src/lib/listings.ts`** mit:

```typescript
export async function getListings(filter?: {
  branchen?: string[];
  kantone?: string[];
  umsatz_min?: number;
  umsatz_max?: number;
  ebitda_min?: number;
  // MAX-Frühzugang: published_at < NOW() - 7 days OR caller-is-MAX
  early_access?: boolean;
}): Promise<Listing[]>;

export async function getListingById(id: string): Promise<Listing | null>;
export async function getDailyDigest(kaeufer_id: string): Promise<Listing[]>;  // Top 3 Matches
export async function getFavoriten(kaeufer_id: string): Promise<FavoritWithListing[]>;
```

Type `Listing` exakt wie in `inserate`-Tabelle, plus computed: `umsatz_display: string` (formatted CHF), `ebitda_display: string`, `kaufpreis_display: string`.

**Frühzugang-Logic** (Käufer-Persona Marco): wenn caller `subscription_tier='basic'` → nur `published_at < NOW() - INTERVAL '7 days'`. Wenn MAX → alle `published_at IS NOT NULL`.

---

## 5 · Verbindungen zwischen den 3 Bereichen

### 5.1 — Marketplace-Card (`/`, `/kaufen`)

Aktuell: `<CardActions>` von `src/components/marketplace/CardActions.tsx` — der parallele Verkäufer-Agent hat das gebaut.

**Pflicht-Verbindung Käufer → Verkäufer:**
- Klick auf «Dossier anfragen» / «Details»
  - Logged-out → `/auth/register?role=kaeufer&next=/kaufen/${id}`
  - Logged-in als kaeufer → öffnet Anfrage-Modal → `POST /api/anfragen/create` mit `{inserat_id, nachricht_template}`
  - Logged-in als verkaeufer → Tooltip «Du bist als Verkäufer registriert»
  - Logged-in als admin → ViewSwitcher-Hinweis

### 5.2 — Anfrage-Flow (existiert teilweise)

**Käufer-Bereich** (`/dashboard/kaeufer/anfragen`) liest aus `anfragen`. Verkäufer-Bereich (`/dashboard/verkaeufer/anfragen`) schreibt antworten in `nachrichten`.

**Pflicht-Trigger** in `/api/anfragen/create`:
1. INSERT in `anfragen` (status='neu')
2. INSERT in `nachrichten` (käufer-message)
3. `sendEmail({template:'anfrage_eingegangen', to: verkaeufer.email, vars:{...}})`
4. INSERT in `notifications` für verkaeufer
5. revalidatePath beider Inboxes

**Pflicht-Trigger** in Verkäufer-Antwort:
1. INSERT in `nachrichten`
2. UPDATE `anfragen.status = 'in_bearbeitung'`
3. `sendEmail({template:'anfrage_beantwortet', to: kaeufer.email, ...})`
4. notification an käufer

### 5.3 — NDA-Flow

Käufer signiert auf Inserat-Detail-Seite → `nda_signaturen` row. Verkäufer-Dashboard zeigt unter NDA-Pipeline. Käufer-Dashboard zeigt unter `/dashboard/kaeufer/ndas`.

**Pflicht-Trigger** beim Sign:
1. INSERT in `nda_signaturen` mit ip + ua + timestamp
2. UPDATE `anfragen.status = 'nda_signed'`
3. `sendEmail('nda_signiert')` an Verkäufer + Käufer
4. Datenraum-Zugang freischalten (Helper `grantDatenraumAccess(nda_id)`)

### 5.4 — Berater-Datenraum-Share

Käufer erstellt Magic-Link in `/dashboard/kaeufer/ndas` → `nda_berater_shares` row mit `magic_token`, `expires_at`.

**Pflicht: neue Route `/datenraum/[id]/route.ts`** validiert:
- `?token=XYZ` matcht aktiver `nda_berater_shares.magic_token`
- `expires_at > NOW()` und `revoked_at IS NULL`
- bei valid: `views_count++`, render Read-Only-Datenraum
- bei invalid: 401 + Retry-Mail-Vorschlag

### 5.5 — Käufer-Profil als Reverse-Listing

Verkäufer-Anfrage-Detail (`/dashboard/verkaeufer/anfragen/[id]`) zeigt **Käufer-Profil** wenn `kaeufer_profil.ist_oeffentlich = true`.

Komponente bereits vorhanden: `src/app/dashboard/kaeufer/profil/ProfilPreview.tsx` — verschieben nach `src/components/shared/kaeufer-profil-preview.tsx` und in Verkäufer-Anfrage-Detail importieren.

### 5.6 — Daily-Digest-Cron

Pflicht: **`supabase/functions/kaeufer-daily-digest/index.ts`** — läuft jeden Tag 5:00 UTC (= 7:00 CH-Sommerzeit).

Logik:
1. Alle `suchprofile WHERE ist_pausiert = false`
2. Pro Profil: matchScore (Helper aus `src/lib/match-score.ts` — Code in Edge-Function duplizieren in `_shared/match.ts`)
3. Top 3 Inserate mit Score >= 60, die seit 24h published wurden
4. Pro Match: INSERT in `alerts_sent` + `sendEmail('alert_neues_inserat')` (nur wenn `email_alert=true`)
5. Wenn `whatsapp_alert=true` UND user.subscription_tier='max': WhatsApp-Versand (Twilio oder Stub)

Vercel-Cron (`vercel.json`):
```json
{
  "crons": [{"path": "/api/cron/daily-digest", "schedule": "0 5 * * *"}]
}
```

### 5.7 — Admin ↔ alles

**Admin-Pages für Käufer-Verwaltung** bauen:
- `/admin/kaeufer` — Liste aller Käufer mit Filter (tier, ist_oeffentlich, finanzierungsnachweis_verified)
- `/admin/kaeufer/[id]` — Detail mit Editier-Möglichkeit (KYC verify, Finanzierung verify, Ban)
- `/admin/suchprofile` — Read-only Liste, Moderation

**RLS für Admin**: Service-Role oder Policy `admin_full_access`:
```sql
create policy admin_kaeufer_all on public.kaeufer_profil
  for all using ((select rolle from profiles where id = auth.uid()) = 'admin');
-- Repeat für alle Käufer-Tabellen
```

**Admin-Sidebar erweitern** (`src/components/admin/AdminSidebar.tsx`):
```ts
{ label: 'Käufer', href: '/admin/kaeufer', icon: Users }
{ label: 'Suchprofile', href: '/admin/suchprofile', icon: Bell }
```

**ViewSwitcher** existiert in 3 Versionen (admin, kaeufer-shell, verkaeufer-shell) — alle synchron halten via `admin_impersonation`-Cookie.

---

## 6 · Email-Trigger an ALLEN Stellen

Helper: `src/lib/email.ts` (existiert).

| Event | Where | Template | Empfänger |
|---|---|---|---|
| Registrierung | `auth/actions.ts` `registerAction` (Supabase macht's automatisch) | Verifizierung-Mail | User |
| Verifizierungs-Klick | `auth/callback/route.ts` | – | – |
| Onboarding fertig | `onboarding/kaeufer/tunnel/actions.ts` (existiert) | `welcome` | User |
| Onboarding skipped | dito | `welcome` | User |
| Basic-Paket gewählt | `paket/actions.ts` (existiert) | `welcome` | User |
| MAX-Subscription created | `api/stripe/webhook/route.ts` (existiert) | `welcome` | User |
| Verkäufer-Inserat published | Verkäufer-Action | (custom: `inserat_live`) | Verkäufer |
| Verkäufer-Paket gekauft | Stripe-Webhook | `zahlung_bestaetigung` | Verkäufer |
| Anfrage gestellt | `/api/anfragen/create` | `anfrage_eingegangen` | Verkäufer |
| Anfrage beantwortet | Verkäufer-Antwort-Action | `anfrage_beantwortet` | Käufer |
| NDA signiert | NDA-Sign-Action | `nda_signiert` | Beide |
| Daily-Digest | Cron | `alert_neues_inserat` | Käufer |
| Inserat läuft ab | Cron 14d vor expires_at | `inserat_bald_abgelaufen` | Verkäufer |
| Passwort-Reset | `auth/actions.ts` `requestResetAction` | `passwort_reset` | User |

**Test:** Im Stripe-Test-Mode `stripe trigger customer.subscription.created` → email_log-Tabelle muss neue Row haben.

---

## 7 · End-to-End-Tests (PFLICHT vor Done)

Manuell via Chrome-Extension (`navigate`, `find`, `screenshot` — KEIN preview_start!):

### Test 1 — Käufer-Vollflow
1. Beta-Gate: `passare2026`
2. `/auth/register?role=kaeufer` → Mail eingeben (Mailinator: `kaeufer-test-{ts}@mailinator.com`)
3. Mailinator öffnen → Bestätigungs-Mail klicken
4. Tunnel: 3 Schritte durchklicken
5. Paket-Page: «Gratis weitermachen» → Welcome-Mail in Mailinator prüfen
6. `/dashboard/kaeufer` rendert mit echten Daten (NICHT Mock!)
7. Suchprofil erstellen → 4. wirft Error «Max 3»
8. Favoriten-Stage ändern → DB-Row updated
9. Logout

### Test 2 — Verkäufer-Vollflow
1. `/verkaufen` → Pre-Reg-Funnel mit echter UID (z.B. CHE-100.000.000)
2. Konto erstellen → Mail bestätigen
3. Inserat-Wizard 5 Schritte durchklicken
4. Paket Light kaufen mit Stripe-Test-Card 4242 4242 4242 4242
5. Inserat published → erscheint im Marketplace `/`
6. Logout

### Test 3 — Käufer-Verkäufer-Verbindung
1. Mit Käufer-Account auf Marketplace → Inserat aus Test 2 anklicken
2. «Dossier anfragen» → Anfrage-Modal → senden
3. Logout, Login als Verkäufer
4. `/dashboard/verkaeufer/anfragen` → neue Anfrage da
5. NDA bereitstellen → Käufer bekommt Mail
6. Käufer signiert NDA → beide bekommen Mail, Datenraum offen

### Test 4 — Admin
1. Login als `admin@vemo.ch`
2. ViewSwitcher → «Als Käufer ansehen» → /dashboard/kaeufer
3. ViewSwitcher → «Admin-Panel» → /admin
4. `/admin/kaeufer` → Test-Käufer aus Test 1 sichtbar
5. KYC verify → User bekommt Verified-Badge
6. Logout

### Test 5 — Stripe MAX-Upgrade
1. Käufer aus Test 1 → `/dashboard/kaeufer/abo` → MAX upgraden
2. Stripe-Test-Checkout durchklicken
3. Webhook empfängt `customer.subscription.created`
4. `profiles.subscription_tier = 'max'` in DB
5. Topbar zeigt «Käufer MAX»-Badge
6. WhatsApp-Alert-Toggle in Suchprofil ist enabled

**Wenn ein Test scheitert:** logs lesen (`vercel logs`), Bug fixen, neu deployen, erneut testen.

---

## 8 · Cleanup-Checkliste

- [ ] Alle `MOCK_*` / `DEMO_*` Imports entfernt
- [ ] Alle `" 2.tsx"`-Duplikate gelöscht
- [ ] Alle Mock-Listings durch echte DB-Queries ersetzt
- [ ] `package-lock.json`-Konflikte aufgelöst
- [ ] `tsconfig.json` einheitlich (parallel-Edits gemerged)
- [ ] Defensive `hasTable`-Checks in den Käufer-Pages **entfernt** (Tabellen sind jetzt da)
- [ ] `npm run typecheck` grün
- [ ] `npm run build` grün
- [ ] `vercel --prod --yes` deployed `Ready`
- [ ] Vercel-Alias `passare-ch.vercel.app` zeigt auf neuen Deploy
- [ ] `/status` aktualisiert mit «Bereiche verbunden + echte Daten»

---

## 9 · Status-Page updaten

`src/data/updates.ts` — Eintrag oben:

```ts
{
  date: '2026-04-28',
  type: 'milestone',
  titel: 'Plattform vollumfänglich verbunden — alle Dummy-Daten raus',
  beschreibung:
    'Alle drei Bereiche (Käufer, Verkäufer, Admin) sind jetzt durchgängig miteinander verbunden und arbeiten mit echten Daten aus der Datenbank — keine Demo-Inserate mehr. Eine Anfrage vom Käufer landet direkt beim Verkäufer in der Inbox, Geheimhaltungsverträge schalten den Datenraum frei, Zahlungen aktivieren Pakete und Abos automatisch, und alle Beteiligten bekommen die passenden E-Mails. Der Admin sieht alles und kann jederzeit in die Sicht des Käufers oder Verkäufers wechseln.',
}
```

`CURRENT_STEP` auf nächste Etappe setzen (Etappe 80+: Beta-Test mit echten Usern).

---

## 10 · Deploy-Pflicht (CLAUDE.md)

```bash
git add -A
git commit -m "feat(connect): 3 Bereiche verbunden + echte Daten + alle Dummy raus"
git push origin main
vercel --prod --yes
vercel alias set <neue-deploy-url> passare-ch.vercel.app
```

Nach Deploy: **Chrome-Extension** öffnet `https://passare.ch` + Beta-Code `passare2026` + Test 1–5 nochmal durchklicken auf Live-URL. Screenshot pro Test als Beweis.

**Niemals** als done melden ohne diesen Live-Test.

---

## ⚠️ Niemals tun

- ❌ Migrations editieren (immer neue erstellen)
- ❌ Preview-Tools verwenden (`preview_start` etc.)
- ❌ Vemo-Repo / Vemo-Supabase anfassen
- ❌ Mock-Daten zurück hinzufügen
- ❌ `npm run typecheck` skippen
- ❌ Deploy ohne Live-Verify melden

---

*Brief erstellt 2026-04-28 nach Build der 3 separaten Bereiche · Stand: Käufer + Verkäufer + Admin live deployed mit defensiven Mocks · Connect-Phase startet jetzt.*
