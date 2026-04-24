# passare.ch — Infrastruktur-Architektur

> **Technische Referenz.** Wie ist passare.ch aufgebaut, warum so, und welche Services sprechen miteinander.

---

## 🎯 Geschäftsmodell als Infrastruktur-Treiber

passare ist eine **Self-Service-Plattform** mit zwei bezahlten Benutzergruppen:

| Gruppe | Modell | Stripe |
|---|---|---|
| Verkäufer | Einmalige Paketgebühr (Light 290 / Pro 890 / Premium 1'890) | **Payment Intent** (Checkout Session) |
| Käufer | MAX-Abo (CHF 199/M oder CHF 1'990/Jahr) | **Subscription** (monatlich/jährlich) |

**0% Erfolgsprovision.** Broker-Angebot erst Phase 2.

---

## 🏛️ Architektur-Überblick

```
                    ┌─────────────────────────────────────┐
                    │         PASSARE.CH                  │
                    │      (Vercel · Edge + Node)         │
                    └────────────┬────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼──────┐        ┌──────▼──────┐        ┌─────▼──────┐
    │   CLIENT   │        │   SERVER    │        │    EDGE    │
    │ (React 19) │        │  (Node.js)  │        │  (Runtime) │
    │            │        │             │        │            │
    │  Dashboard │        │ API Routes  │        │ Middleware │
    │  Public    │        │ Server Act. │        │ Beta-Gate  │
    │  Admin     │        │ Webhooks    │        │ i18n-RR    │
    └─────┬──────┘        └──────┬──────┘        └─────┬──────┘
          │                      │                      │
          └──────────┬───────────┘                      │
                     │                                  │
          ┌──────────▼──────────────────────────────────▼──────┐
          │              SUPABASE (EU-FRA)                     │
          │  Auth · Postgres · Storage · Realtime · Edge-Funct │
          └────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┬──────────┬──────────┬─────────┐
          │                     │          │          │         │
    ┌─────▼─────┐   ┌──────────▼───┐  ┌──▼──────┐ ┌─▼────┐ ┌──▼─────┐
    │  STRIPE   │   │    RESEND    │  │ CLAUDE  │ │ZEFIX │ │ TWILIO │
    │(Payments) │   │   (E-Mail)   │  │  (AI)   │ │ (HR) │ │ (SMS)  │
    └───────────┘   └──────────────┘  └─────────┘ └──────┘ └────────┘
```

---

## 🗄️ Datenbank-Architektur (v1 — Self-Service-Modell)

### Schemas
- `public` — App-Daten
- `auth` — Supabase Auth (managed)
- `storage` — Supabase Storage Metadaten
- `analytics` (geplant) — Event-Tracking

### Kern-Tabellen

```sql
-- ─── USER & ROLES ──────────────────────────────────
profiles (1:1 auth.users)
  ├─ id (= auth.users.id)
  ├─ rolle (enum: verkaufer | kaeufer | admin)
  ├─ full_name, phone, kanton, sprache (de/fr/it/en)
  ├─ verified_phone bool, verified_kyc bool
  ├─ stripe_customer_id (für Zahlungen + Abos)
  └─ created_at

-- ─── VERKÄUFER-SEITE ───────────────────────────────
inserate
  ├─ id (uuid), slug (unique), owner_id (→ profiles)
  ├─ status (draft | in_review | published | paused | sold | expired)
  ├─ titel, teaser, beschreibung
  ├─ branche_id (→ branchen), kanton_code (→ kantone), region_code (→ regionen)
  ├─ rechtsform (AG | GmbH | EG | KG | Genossenschaft | ...)
  ├─ gruendungsjahr, mitarbeitende_exakt, mitarbeitende_bucket
  ├─ umsatz_bucket, ebitda_marge numeric, ebitda_bucket
  ├─ kaufpreis_exakt, kaufpreis_bucket, kaufpreis_vhb bool
  ├─ uebergabe_zeitpunkt (sofort | 3m | 6m | 12m_plus)
  ├─ uebergabe_grund (→ uebergabe_gruende)
  ├─ plan (light | pro | premium)
  ├─ views int, featured_until timestamp
  ├─ published_at, expires_at, sold_at
  └─ created_at, updated_at

inserate_media
  ├─ id, inserat_id (→ inserate)
  ├─ storage_path, type (image | document | video)
  ├─ order int, visibility (public | nda_required)
  └─ created_at

-- ─── KÄUFER-SEITE ──────────────────────────────────
anfragen
  ├─ id, inserat_id, kaeufer_id (→ profiles)
  ├─ status (neu | antwort | nda_angefragt | nda_unterzeichnet | closed)
  └─ created_at
  -- UNIQUE (inserat_id, kaeufer_id)

nachrichten
  ├─ id, anfrage_id (→ anfragen), sender_id (→ profiles)
  ├─ body text, attachments jsonb, read_at
  └─ created_at

favoriten
  ├─ user_id, inserat_id, notiz
  └─ created_at
  -- UNIQUE (user_id, inserat_id)

gespeicherte_suchen
  ├─ user_id, name, kriterien jsonb, alert_frequency (never | weekly | daily | realtime)
  └─ last_notified_at

kaeufer_profile (Reverse-Listings, öffentlich optional)
  ├─ user_id (→ profiles)
  ├─ aktiv bool, public bool, featured bool (MAX-only)
  ├─ kriterien jsonb (branchen, kantone, preis_range, ebitda_min, etc.)
  └─ last_activity_at

-- ─── NDA & DATENRAUM ───────────────────────────────
nda_requests
  ├─ id, inserat_id (→ inserate), kaeufer_id (→ profiles)
  ├─ template_version, status (pending | accepted | signed | rejected | expired)
  ├─ signed_at, ip, user_agent, pdf_storage_path
  └─ created_at

datenraum_files
  ├─ id, inserat_id (→ inserate), kategorie
  ├─ storage_path, watermark_on bool
  ├─ access_list jsonb (user-ids mit Zugriff)
  └─ created_at

datenraum_access_log
  ├─ id, file_id (→ datenraum_files), user_id (→ profiles)
  ├─ action (view | download)
  └─ created_at, ip

-- ─── ZAHLUNGEN ─────────────────────────────────────
zahlungen
  ├─ id, user_id (→ profiles)
  ├─ typ (inserat_paket | max_abo | verlaengerung)
  ├─ stripe_payment_intent, stripe_checkout_session_id
  ├─ amount numeric, currency (CHF), status (pending | paid | refunded)
  ├─ plan_code (light | pro | premium | max_monthly | max_yearly)
  ├─ inserat_id (→ inserate, optional)
  └─ created_at

subscriptions (nur für Käufer MAX!)
  ├─ id, user_id (→ profiles)
  ├─ stripe_subscription_id
  ├─ plan (max_monthly | max_yearly)
  ├─ status (active | past_due | canceled | incomplete)
  ├─ current_period_start, current_period_end
  └─ cancelled_at

-- ─── REFERENCE TABLES ──────────────────────────────
branchen (18 Standard-CH — siehe COMPETITOR_RESEARCH.md)
  ├─ id, slug, icon_name
  ├─ label_de, label_fr, label_it, label_en
  └─ sort int

kantone (26 CH)
  ├─ code (ZH, BE, ...), region_code (→ regionen)
  ├─ name_de, name_fr, name_it, name_en
  └─ population int

regionen (5 CH-Grossregionen)
  ├─ code (genfersee | mittelland | nordwest | ost | zentral)
  ├─ name_de, name_fr, name_it, name_en
  └─ kantone jsonb (array)

rechtsformen (12)
  ├─ code (AG | GmbH | EG | KG | Genossenschaft | ...)
  ├─ label_de, label_fr, label_it, label_en
  └─ min_kapital

uebergabe_gruende
  ├─ code, label_de, label_fr, label_it, label_en

kategorien (4 Top-Level + Subs, hierarchisch)
  ├─ id, parent_id, slug, order
  └─ label_de, label_fr, label_it, label_en

-- ─── CONTENT & NEWSLETTER ──────────────────────────
blog_posts
  ├─ id, slug, published, published_at, lesezeit
  ├─ kategorie, tags jsonb, featured_image
  ├─ titel_de/fr/it/en, excerpt_de/fr/it/en, body_de/fr/it/en
  └─ author_id (→ profiles)

newsletter_abonnenten
  ├─ email, rolle_interesse (verkaufer | kaeufer | beide)
  ├─ branche_interesse jsonb, kanton_interesse jsonb
  ├─ confirmed_at, unsubscribed_at
  └─ source

-- ─── SYSTEM ────────────────────────────────────────
events_log (Audit-Trail, DSGVO)
  ├─ id, user_id (→ profiles)
  ├─ event_type, metadata jsonb
  ├─ ip, user_agent
  └─ created_at

feature_flags
  ├─ key, enabled bool
  ├─ rollout_pct int (0–100)
  ├─ target_users jsonb (user-ids für explicit targeting)
  └─ updated_at

atlas_firmen (Cache für Zefix-Daten)
  ├─ uid (unique), name, rechtsform, kanton, gemeinde
  ├─ fiktiver_wert, wert_datum, status
  └─ inserat_id (optional, FK → inserate)

support_tickets
  ├─ id, user_id (optional, → profiles), email
  ├─ subject, body, status
  ├─ assigned_to (→ profiles mit rolle=admin)
  ├─ priority (low | normal | high | urgent)
  └─ created_at
```

### RLS-Strategie
- **owner-only:** `favoriten`, `gespeicherte_suchen`, `datenraum_access_log`, `zahlungen`, `subscriptions`
- **dual-access:** `nachrichten`, `anfragen` (sender + receiver)
- **public-read limited:** `inserate` (nur `status=published`), `blog_posts` (nur `published=true`), `kaeufer_profile` (nur `public=true`)
- **admin-only writes:** `feature_flags`, `branchen`, `kantone`, `regionen`, `rechtsformen`, `uebergabe_gruende`, `kategorien`
- **verkaufer-only:** eigene `inserate`, `inserate_media`, `datenraum_files`, Anfragen-Inbox zu eigenen Inseraten

### Kritische Indizes
- `inserate(status, published_at)` — Marktplatz-Query
- `inserate(branche_id, kanton_code)` — Filter
- `inserate(kaufpreis_bucket, umsatz_bucket)` — Filter
- `inserate(slug)` unique
- `anfragen(inserat_id, kaeufer_id)` unique
- `nachrichten(anfrage_id, created_at)`
- `favoriten(user_id)`, `favoriten(inserat_id, user_id)` unique
- `zahlungen(stripe_payment_intent)` unique
- `subscriptions(stripe_subscription_id)` unique
- `atlas_firmen(uid)` unique, `atlas_firmen(kanton, status)`

---

## 🔐 Auth-Flow

```
Registrierung:
1. User klickt "Registrieren" auf / oder /kaufen
2. Supabase signUp (email + password) → Resend-Verifikations-E-Mail
3. User klickt Confirm-Link → /auth/callback → Session-Cookie gesetzt
4. /onboarding/rolle wählen (verkaufer oder kaeufer)
5. /onboarding/profil (Name, Kanton, Telefon optional)
6. Redirect nach /dashboard/{rolle}

Login:
1. /auth/login mit Magic-Link ODER Password
2. Supabase signIn → Session-Cookie
3. Redirect nach /dashboard/{rolle} je nach profile.rolle
```

**MFA:** TOTP optional (Etappe später).
**Password-Reset:** Standard Supabase-Flow via E-Mail-Link.

---

## 💳 Payment-Flows

### Verkäufer-Paket (einmalig)
```
1. Verkäufer wählt Paket im Inserat-Wizard Step 4
2. Server-Action erstellt Stripe Checkout Session (mode='payment')
3. Redirect zu Stripe
4. Webhook: checkout.session.completed → zahlungen.status='paid'
5. inserate.status='in_review' (Admin-Moderation) oder direkt 'published'
6. Resend: Bestätigung + Rechnung-PDF
```

### Käufer-MAX (Abo)
```
1. Käufer klickt "MAX buchen" auf /preise oder /kaufen
2. Server-Action erstellt Stripe Checkout Session (mode='subscription')
3. Redirect zu Stripe
4. Webhook: customer.subscription.created → subscriptions.status='active'
5. profile.max_active=true (für Feature-Gates)
6. Resend: Willkommens-Mail + Rechnung
```

### Verlängerungen (Verkäufer-Pakete)
```
Kein Auto-Renewal!
Verkäufer bekommt 7/3/1 Tag vor expires_at Erinnerungs-E-Mail.
Manuelle Verlängerung: neue Checkout-Session (+CHF 190 / 490 / 990).
```

---

## 📧 E-Mail-System (Resend)

**Sender:** `noreply@passare.ch` (SPF + DKIM + DMARC)
**Templates (React Email):**
- Welcome nach Registrierung
- E-Mail-Verifikation
- Password-Reset
- Inserat-Published (Verkäufer)
- Neue Anfrage (Verkäufer informiert)
- NDA-angefragt (Verkäufer)
- NDA-unterzeichnet (Verkäufer)
- Neue Nachricht im Thread
- Zahlung erfolgreich
- Rechnung (mit PDF-Attachment)
- Inserat läuft ab (Verkäufer)
- MAX-Abo-Renewal (Käufer)
- MAX-Abo-Canceled (Käufer)
- Newsletter-Kampagnen

---

## 🌍 i18n-Setup

- `next-intl` mit `[locale]`-Routing
- Default: `de` (kein Prefix auf `/`)
- Andere: `/fr/*`, `/it/*`, `/en/*`
- Middleware erkennt `Accept-Language` beim Erstbesuch
- Cookie `NEXT_LOCALE` persistiert Wahl
- hreflang-Tags im `<head>`

---

## 🤖 AI-Integration (Claude)

- `@anthropic-ai/sdk` → `claude-sonnet-4-*`
- Use-Cases:
  - **KI-Teaser-Generator** (Inserat-Wizard Step 3) — anonymisiert
  - **Matching-Engine** (Käufer × Inserate via pgvector)
  - **Content-Generation** für Branche × Kanton Landingpages
- Server-only via `ANTHROPIC_API_KEY`

---

## 📊 Monitoring

- **Errors:** Sentry (Client + Server)
- **Uptime:** Vercel-Built-in + Uptime Robot
- **DB:** Supabase-Metriken + Slow-Query-Log
- **Analytics:** Plausible (privacy-first)
- **Business-KPIs:** Admin-Dashboard mit MRR (aus Stripe), GMV (aus zahlungen), Conversion-Rates

---

## 🌐 Domain & DNS

- **Primary:** `passare.ch` → Vercel (nach DNS-Setup)
- **Beta-URL:** `passare-ch.vercel.app` (auto-alias auf Prod-Deploy)
- **E-Mail:** `info@passare.ch`, `noreply@passare.ch`, `beta@passare.ch` (Resend)
- **DNSSEC:** empfohlen (später)

---

## 🔄 Backup & Recovery

- **Supabase:** Daily Automated Backups (Free Tier) / PITR (Pro-Tier)
- **GitHub:** Source-of-Truth
- **Storage:** Supabase replikiert S3-compatible (EU-Region)

---

## 📅 Stack-Versionen (Stand 24.04.2026)

- Node 22.22
- Next.js 16.2
- React 19.0
- TypeScript 5.7
- Tailwind 3.4
- Supabase-JS 2.47 + @supabase/ssr 0.5
- Stripe 17.5
- Resend 4.0
- Claude SDK 0.32
- Fraunces (Variable, Google Fonts)
- Geist Sans + Mono (Vercel Package)
- Framer Motion 12
- Lucide React 0.468
