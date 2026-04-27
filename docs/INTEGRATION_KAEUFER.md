# INTEGRATION KÄUFER-BEREICH ↔ VERKÄUFER + ADMIN

> Dieses Dokument ist für den **Connect-Agent**, der nach Fertigstellung aller drei Bereiche (Käufer, Verkäufer, Admin) die Integration vornimmt.
>
> Stand: 2026-04-27 · Käufer-Bereich live deployed · Verkäufer + Admin werden parallel von anderen Agents gebaut.

---

## 🧭 Was im Käufer-Bereich existiert

### Tabellen (Käufer ownt diese — Migration `20260427182000_kaeufer.sql`)

| Tabelle | Zweck | Wer schreibt | Wer liest |
|---|---|---|---|
| `kaeufer_profil` | Reverse-Listing + Investor-Profil | Käufer (eigenes), Stripe-Webhook (verified-Flag) | Verkäufer (wenn `ist_oeffentlich`), Admin |
| `suchprofile` | Bis 3 Suchkriterien-Sets pro Käufer | Käufer | Käufer + Admin · Daily-Digest-Job |
| `alerts_sent` | Audit-Trail Email/WhatsApp/Push | Daily-Digest-Job (kommt in eigener Etappe) | Käufer (eigene), Admin |
| `favoriten` | Watchlist + Pipeline-Stage | Käufer | Käufer + Admin |
| `nda_berater_shares` | Zeitlich begrenzter Datenraum-Zugang für Steuerberater/Anwalt | Käufer | Käufer + Admin · Datenraum-Auth-Layer |

### Profiles-Erweiterungen

```sql
profiles.subscription_tier        -- enum 'basic'|'max', default 'basic', vom User NICHT editierbar
profiles.subscription_renewed_at  -- timestamp letzte Stripe-Renewal
profiles.subscription_cancel_at   -- timestamp wenn cancel_at_period_end gesetzt
profiles.stripe_subscription_id   -- Stripe-Sub-ID
```

`stripe_customer_id` existiert schon vorher — wird vom Käufer-Checkout-Flow gefüllt.

### Routen die der Käufer-Bereich besitzt

```
/onboarding/kaeufer/tunnel       → 5-Fragen-Konversations-Tunnel
/onboarding/kaeufer/paket        → Pricing Basic vs MAX

/dashboard/kaeufer               → Übersicht + Daily Digest
/dashboard/kaeufer/anfragen      → Inbox (zeigt Daten aus `anfragen`-Tabelle = Verkäufer)
/dashboard/kaeufer/anfragen/[id] → Thread (zeigt `nachrichten` = Verkäufer)
/dashboard/kaeufer/favoriten     → List/Kanban/Vergleich
/dashboard/kaeufer/ndas          → NDAs (zeigt `nda_signaturen` = Verkäufer) + Berater-Shares
/dashboard/kaeufer/suchprofile        → Liste + Pause-Toggle
/dashboard/kaeufer/suchprofile/neu    → Neues Suchprofil
/dashboard/kaeufer/abo           → MAX-Status + Stripe Customer Portal
/dashboard/kaeufer/profil        → Käufer-Profil + Verifizierung

/api/stripe/create-checkout-session  POST → MAX-Abo Checkout
/api/stripe/customer-portal          POST → Stripe Billing Portal
/api/stripe/webhook                  POST → Subscription-Events
```

---

## 🔗 OFFENE INTEGRATIONS-PUNKTE — bitte verbinden

### 1. Marketplace-Card → Anfrage-Erstellung

**Aktuell** (in `src/app/page.tsx` ListingCard, Zeile ~437):
```tsx
<Button href={`/auth/register?role=kaeufer&next=${encodeURIComponent(`/onboarding/kaeufer/tunnel?listing=${listing.id}`)}`}>
  Dossier anfragen
</Button>
```

**Soll**: Wenn User EINGELOGGT + role=kaeufer + onboarding fertig:
- Button → POST `/api/anfragen/create` mit `{ inserat_id, message_template }` (siehe Punkt 2)
- Inline-Modal mit 3 Templates (siehe `docs/PERSONA_WALKTHROUGH.md` Marco Item 7)
- Wenn schon gestellt → «Anfrage gestellt — Status: pending» Disabled-State

**Connect-Agent muss**:
1. Server Component-Wrapper bauen, der `auth.getUser()` macht und je nach State 3 Varianten rendert (logged out / logged in als kaeufer / logged in als verkaeufer→Tooltip)
2. Helper `getAnfrageStatus(user_id, inserat_id)` → liest aus `anfragen`-Tabelle
3. Inline-Anfrage-Modal-Component bauen

### 2. Anfragen-Tabelle (Verkäufer ownt)

Käufer-Bereich erwartet diese Spalten in `public.anfragen`:

```sql
id              uuid PK
inserat_id      text or uuid  -- FK auf inserate
kaeufer_id      uuid FK auf profiles
verkaeufer_id   uuid FK auf profiles  -- für Notifications
status          enum ('offen','in_bearbeitung','akzeptiert','abgelehnt','archiviert')
nachricht       text                  -- Käufer-Vorstellungstext
created_at      timestamptz
updated_at      timestamptz
-- für Käufer-UI gerne zusätzlich:
inserat_titel   text  (denormalized für Inbox-Liste, ODER View mit Join)
inserat_branche text
inserat_kanton  text
letzte_antwort  text  (Last-Verkäufer-Message-Snippet)
unread          boolean
```

**RLS-Policies** die Verkäufer-Bereich setzen MUSS, damit Käufer-Bereich funktioniert:
- `SELECT` für `kaeufer_id = auth.uid()` (Käufer sieht eigene)
- `SELECT` für `verkaeufer_id = auth.uid()` (Verkäufer sieht eigene)
- `INSERT` für authenticated mit `kaeufer_id = auth.uid()` (für `/api/anfragen/create`)
- `UPDATE` (nur status/nachricht) für `verkaeufer_id = auth.uid()`

**Connect-Agent muss**:
- Falls Verkäufer-Bereich diese Felder anders benannt hat: View `v_kaeufer_anfragen` als Adapter erstellen.
- `/api/anfragen/create`-Route bauen (Käufer-Bereich hat sie noch NICHT, weil Tabelle fehlt) — POST `{inserat_id, nachricht}` → INSERT mit `verkaeufer_id` aus `inserate.owner_id`.

### 3. Inserate-Tabelle (Verkäufer ownt)

Käufer-Dashboard arbeitet aktuell mit Mock-Daten aus `src/lib/listings-mock.ts`. Sobald `inserate`-Tabelle existiert, muss Folgendes umgestellt werden:

**Dateien mit Mock-Listings:**
- `src/app/dashboard/kaeufer/page.tsx` — Daily Digest + Empfehlungen
- `src/app/dashboard/kaeufer/favoriten/page.tsx` — Joins Mock-Listings mit favoriten

**Soll-Verhalten**:
- Wenn `inserate`-Tabelle existiert (`hasTable('inserate')`): Live-Daten laden mit Branche+Kanton+Umsatz+EBITDA+Kaufpreis+Status.
- Wenn Käufer nicht-MAX: nur `published_at < now() - interval '7 days'` (Frühzugang-Sperre)
- Wenn Käufer MAX: alle published.

**Connect-Agent muss**:
1. `src/lib/listings.ts` neu erstellen mit `getListings(filter)` und `getListingById(id)` — defensive switch zwischen DB und Mock.
2. Mapping von `inserate`-Feldern zu `MockListing`-Shape (`umsatz: 'CHF 8.4M'` als String) — entweder DB liefert formatierte Strings oder Helper.

### 4. NDA-Signaturen (Verkäufer ownt)

Käufer-Bereich erwartet `public.nda_signaturen` mit:
```sql
id, inserat_id, kaeufer_id, verkaeufer_id,
signed_at, expires_at, document_url, ip, user_agent,
revoked_at  -- für Panic-Button später
```

**Käufer-Bereich liest** (in `/dashboard/kaeufer/ndas/page.tsx`):
- Nur eigene Signaturen (`kaeufer_id = auth.uid()`)
- Datenraum-Status (`expires_at > now() AND revoked_at IS NULL`)
- Audit-Trail: «Du hast Bilanz_2024.pdf 3× geöffnet» — kommt aus `datenraum_zugriffe`-Tabelle (eigene oder gemeinsame).

**Connect-Agent muss**:
- View `v_kaeufer_ndas` mit JOIN auf `inserate` (für `inserat_titel`, `branche`, `kanton`).
- RLS für `kaeufer_id = auth.uid()` SELECT.

### 5. Berater-Datenraum-Share Magic-Link

Käufer-Bereich erstellt Einträge in `nda_berater_shares` (gehört IHM), aber:
- **Magic-Link-Auth** muss vom Verkäufer-Bereich oder einer geteilten Datenraum-Component validiert werden.
- Berater geht auf `/datenraum/[id]?token=XYZ` → Edge-Function prüft `nda_berater_shares.magic_token`, `expires_at`, `revoked_at` → gibt Read-Only-Zugang.

**Connect-Agent muss**:
- `/datenraum/[id]/route.ts` (oder Page) bauen mit Magic-Token-Validation.
- Bei valid: views_count +1 in `nda_berater_shares`.
- UI-Pattern: Read-Only-Banner «Berater-Zugang läuft ab am DD.MM.YYYY · X von 14 Tagen».

### 6. Daily-Digest-Job (CRON / Edge-Function)

Käufer-Bereich erwartet einen Background-Job der:
1. Jeden Tag um 7:00 Schweizer Zeit läuft.
2. Pro `suchprofile WHERE ist_pausiert = false`:
   - Match-Score gegen alle `inserate WHERE published_at > NOW() - INTERVAL '24 hours'`.
   - Top 3 mit Score >= 60 finden.
   - Für jeden: ROW in `alerts_sent` schreiben.
   - Email an `kaeufer.email` schicken (Resend) wenn `email_alert=true`.
   - WhatsApp wenn `whatsapp_alert=true && subscription_tier='max'`.
3. Match-Score-Funktion: `src/lib/match-score.ts` — kann vom Worker importiert werden.

**Connect-Agent muss**:
- `supabase/functions/kaeufer-daily-digest/index.ts` (Deno Edge) oder `app/api/cron/kaeufer-digest/route.ts` (Vercel Cron) bauen.
- Vercel `vercel.json` → cron: `0 5 * * *` (UTC = 7:00 CH-Sommerzeit, ggf. anpassen).

### 7. Admin-Bereich Integration

Der Admin-Bereich existiert bereits in `src/app/admin/` und hat einen `ViewSwitcher` der das Cookie `admin_impersonation` setzt. Käufer-Bereich liest dieses Cookie NICHT direkt — der ViewSwitcher leitet einfach zu `/dashboard/kaeufer` und der `admin_impersonation`-Cookie sagt: «du bist Admin, aber siehst gerade die Käufer-Sicht».

**Käufer-Bereich-Topbar** (`src/components/kaeufer/topbar.tsx`) hat den ViewSwitcher dupliziert — er erscheint NUR wenn `profile.rolle === 'admin'`.

**Connect-Agent muss**:
- Admin-Pages bauen, die Käufer-Daten anzeigen können:
  - `/admin/kaeufer/[id]` → Detail-View eines Käufer-Profils
  - `/admin/kaeufer` → Liste aller Käufer (mit Filtern: tier, status, ist_oeffentlich)
  - `/admin/suchprofile` → Read-only Liste für Moderation
- Admin-RLS: Service-Role oder eigene Policy `admin_full_access` auf `kaeufer_profil`, `suchprofile`, `favoriten`, `alerts_sent`.
- Im Admin-Sidebar (`src/components/admin/AdminSidebar.tsx`) Eintrag «Käufer» hinzufügen.

### 8. Notifications

Käufer-Bereich erwartet eine `notifications`-Tabelle (Etappe 15.1) für:
- «Verkäufer hat dein NDA freigegeben»
- «Verkäufer hat auf deine Anfrage geantwortet»
- «Neuer Treffer in deinem Suchprofil»

**Käufer-Bereich-Topbar** hat einen Bell-Icon-Stub. Sobald `notifications` existiert:
- Bell zeigt Count mit `WHERE user_id = auth.uid() AND read_at IS NULL`
- Klick öffnet Dropdown mit den letzten 10
- Mark-as-read on click

**Connect-Agent muss**:
- `notifications`-Tabelle bauen (gehört zu Verkäufer- oder Admin-Bereich, nicht Käufer).
- Trigger auf `anfragen` (status='akzeptiert' → notification an `kaeufer_id`) und auf `nda_signaturen` (signed → notification an `kaeufer_id`).

### 9. Header / Marketplace-Card-Variants

Wenn ein eingeloggter **Verkäufer** auf `/` oder `/kaufen` ist und auf «Dossier anfragen» klickt: aktuell wird er zu `/auth/register?role=kaeufer` geleitet. Das ist falsch.

**Connect-Agent muss**:
- ListingCard zu Server Component wandeln (oder Client-Component mit `useUser`-Hook), die je nach Auth-State unterschiedliche CTAs rendert:
  - **Logged out**: «Käufer werden + Dossier anfragen» → `/auth/register?role=kaeufer&next=…`
  - **Logged in als kaeufer**: «Dossier anfragen» → POST zu Anfrage-Create
  - **Logged in als verkaeufer**: Tooltip «Du bist als Verkäufer registriert. Erstelle einen separaten Käufer-Account um anzufragen.»
  - **Logged in als admin**: «Dossier anfragen» → ViewSwitcher-Tooltip «Wechsle in Käufer-Ansicht»

### 10. Käufer-Profil als Reverse-Listing für Verkäufer

Im Verkäufer-Bereich, wenn der Verkäufer eine eingehende Anfrage öffnet, soll er das **Käufer-Profil** sehen können (`kaeufer_profil` mit `ist_oeffentlich=true`).

**Käufer-Bereich liefert bereits**:
- Component `<ProfilPreview>` aus `src/app/dashboard/kaeufer/profil/ProfilPreview.tsx` — wiederverwendbar (props sind alle stringly).
- RLS-Policy `kaeufer_profil_public_read` erlaubt SELECT für authenticated users wenn `ist_oeffentlich=true`.

**Connect-Agent muss**:
- `<ProfilPreview>` aus Käufer in `src/components/shared/kaeufer-profil-preview.tsx` verschieben (gemeinsam nutzbar) ODER Verkäufer-Bereich importiert direkt aus `@/app/dashboard/kaeufer/profil/ProfilPreview`.
- Im Verkäufer-Anfrage-Detail: «Über den Käufer» Sektion mit `<ProfilPreview>`.

---

## 📋 Konkrete TODO-Liste für Connect-Agent

Reihenfolge: einer nach dem anderen, jeweils nach Verifikation deployen.

1. **DB-Sync prüfen**: Alle drei Migrations applied? `select * from pg_tables where schemaname='public'` → erwartet:
   `profiles`, `terms_acceptances`, `inserate`, `inserate_media`, `anfragen`, `nachrichten`, `nda_signaturen`, `kaeufer_profil`, `suchprofile`, `favoriten`, `alerts_sent`, `nda_berater_shares`.

2. **Marketplace-CTAs auth-aware machen**: ListingCard-Logik wie in Punkt 9 oben.

3. **`/api/anfragen/create` POST-Route bauen**: validiert auth, INSERT in `anfragen`, sendet Email an Verkäufer (Resend).

4. **Anfragen-Inbox echte Daten**: `/dashboard/kaeufer/anfragen/page.tsx` aktuell läuft defensive (zeigt Empty-State wenn Tabelle fehlt). Sobald `anfragen` existiert: Daten flowen automatisch durch — testen.

5. **NDAs echte Daten**: same für `/dashboard/kaeufer/ndas/page.tsx`.

6. **Inserate-Helper**: `src/lib/listings.ts` mit defensiver hasTable-Logik. Mock-Listings nur als Fallback.

7. **Frühzugang-Logic**: in Listings-Filter `WHERE published_at <= now() - interval '7 days' OR caller-is-MAX`.

8. **Daily-Digest-Cron**: Edge-Function oder Vercel Cron Job, läuft 5:00 UTC.

9. **Notifications-System**: Tabelle + Trigger + Bell-Icon im Topbar funktional.

10. **Admin-Pages für Käufer**: Liste + Detail + Suchprofil-Moderation.

11. **`<ProfilPreview>` als Shared-Component**: Im Verkäufer-Anfrage-Detail einbinden.

12. **Berater-Datenraum-Share Magic-Link**: `/datenraum/[id]/route.ts` mit Token-Validation.

13. **Verkäufer-Bereich-Tabellen RLS prüfen**: Käufer hat SELECT auf eigene Anfragen + NDAs (Punkt 2 + 4 oben).

14. **Stripe-ENV-Vars in Vercel setzen**:
    - `STRIPE_PRICE_MAX_MONTHLY`, `STRIPE_PRICE_MAX_YEARLY`, `STRIPE_WEBHOOK_SECRET`
    - Webhook-URL in Stripe-Dashboard hinzufügen: `https://passare.ch/api/stripe/webhook`
    - Subscription-Events abonnieren: `customer.subscription.*`, `invoice.payment_succeeded`

15. **End-to-End-Test des Sales-Funnels**:
    - Marketplace → Card-Klick → Register → Email-Bestätigung → Tunnel → Paket-Wahl → Dashboard
    - Mit Stripe-Test-Karte 4242 4242 4242 4242 MAX-Upgrade testen
    - Webhook simulieren via Stripe CLI: `stripe trigger customer.subscription.created`

16. **Smoke-Test View-Switcher** (Admin): Login als admin@vemo.ch → Topbar → wechseln zu «Käufer-Ansicht» → `/dashboard/kaeufer` rendert auch ohne `kaeufer`-Rolle.

---

## 🔑 Wichtige Conventions / Naming-Regeln (CLAUDE.md)

- IMMER `verkaeufer` + `kaeufer` (NIEMALS `seller`/`buyer`)
- Käufer-Tiers: NUR `basic` und `max` (NICHT `pro` als Käufer-Mittelstufe!)
- 0% Erfolgsprovision → keine Texte die das verwässern
- `rounded-soft` (6px), nicht `rounded-pill` für Buttons
- `cream` Hintergrund, kein reines Weiß
- Hairlines (`border-stone`), keine Material-Shadows

---

## 📞 Bei Unklarheiten

- `docs/MASTER_PLAN.md` — vollständige Etappen-Roadmap (Etappe 56+ = Käufer)
- `docs/PERSONA_WALKTHROUGH.md` — Marco-Persona mit allen Käufer-UX-Details
- `CLAUDE.md` — Design-Regeln + Geschäftsmodell

**Bei jeder Anpassung an den geteilten Tabellen** (`inserate`, `anfragen`, `nda_signaturen`, `notifications`): Migration-File mit Timestamp `> 20260427182000` erstellen.

---

*Erstellt: 2026-04-27 · Käufer-Bereich-Agent · Bereit für Connect-Phase nach Fertigstellung Verkäufer + Admin*
