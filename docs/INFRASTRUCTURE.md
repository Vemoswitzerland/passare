# passare.ch — Infrastruktur-Architektur

> **Technische Referenz.** Wie ist passare.ch aufgebaut, warum so, und welche Services
> sprechen miteinander.

---

## 🏛️ Architektur-Überblick

```
                    ┌─────────────────────────────────────┐
                    │           PASSARE.CH                │
                    │         (Vercel Edge)               │
                    └────────────┬────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼──────┐        ┌──────▼──────┐        ┌─────▼──────┐
    │   CLIENT   │        │   SERVER    │        │    EDGE    │
    │ (React 19) │        │  (Node.js)  │        │  (Runtime) │
    │            │        │             │        │            │
    │  Dashboard │        │ API Routes  │        │ Middleware │
    │  Public    │        │ Server      │        │ Beta-Gate  │
    │  Admin     │        │ Actions     │        │ i18n-RR    │
    └─────┬──────┘        └──────┬──────┘        └─────┬──────┘
          │                      │                      │
          └──────────┬───────────┘                      │
                     │                                  │
          ┌──────────▼──────────────────────────────────▼──────┐
          │              SUPABASE (EU-FRA)                     │
          │  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
          │  │  Auth   │ │   DB   │ │Storage │ │ Realtime │  │
          │  │(JWT+RLS)│ │(PG 16) │ │(S3-cmp)│ │(WebSock) │  │
          │  └─────────┘ └────────┘ └────────┘ └──────────┘  │
          │         ┌────────────────┐                        │
          │         │  Edge Funct.   │ (Deno)                 │
          │         └────────────────┘                        │
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

## 📦 Deployment-Pipeline

```
GitHub Push → GitHub Action (Lint+TypeCheck) → Vercel Build → Preview/Prod
                                                    │
                                                    ├─ Prod: main-Branch
                                                    └─ Preview: Feature-Branches
```

**Vercel-Projekt:** `passare`
**Production-Domain:** `passare.ch` (kommt nach Domain-Setup; vorerst `passare.vercel.app`)
**Preview-Deployments:** Automatisch pro PR
**Environment Variables:** Alle `NEXT_PUBLIC_*` + Server-Secrets in Vercel Dashboard

---

## 🗄️ Datenbank-Architektur

### Schemas
- `public` — App-Daten (inserate, profiles, anfragen, etc.)
- `auth` — Supabase Auth (verwaltet von Supabase)
- `storage` — Supabase Storage Metadaten
- `analytics` (geplant) — Event-Tracking, separierte Writes

### Kern-Tabellen (nach voll implementiertem Plan)
```
profiles (1:1 auth.users)
  ├─ rolle (enum: verkaufer, kaeufer, broker, admin)
  ├─ full_name, phone, kanton, sprache
  ├─ verified_phone, verified_kyc, verified_broker
  └─ created_at

inserate
  ├─ id (uuid), slug (unique), owner_id (→ profiles)
  ├─ status (draft, in_review, published, paused, sold, expired)
  ├─ titel, teaser, beschreibung, branche_id, kanton_code
  ├─ umsatz_range, ebitda_range, ebitda_marge, mitarbeitende
  ├─ kaufpreis, kaufpreis_vhb, plan, featured_until, views
  ├─ published_at, expires_at, sold_at
  └─ created_at, updated_at

inserate_media
  ├─ id, inserat_id (→ inserate)
  ├─ storage_path, type (image, document), order
  └─ visibility (public, nda_required)

anfragen
  ├─ id, inserat_id, kaeufer_id (→ profiles)
  ├─ status (neu, antwort, nda_angefragt, nda_unterzeichnet, closed)
  └─ created_at

nachrichten
  ├─ id, anfrage_id (→ anfragen), sender_id
  ├─ body, attachments, read_at
  └─ created_at

favoriten (kaeufer-Watchlist)
  ├─ user_id, inserat_id, notiz
  └─ created_at

gespeicherte_suchen
  ├─ user_id, name, kriterien (jsonb), alert_frequency
  └─ last_notified_at

nda_requests
  ├─ id, inserat_id, kaeufer_id, template_version
  ├─ status (pending, accepted, signed, rejected, expired)
  └─ signed_at, ip, user_agent, pdf_storage_path

datenraum_files
  ├─ id, inserat_id, kategorie, storage_path
  ├─ watermark_on, access_list (jsonb — user-ids)
  └─ created_at

datenraum_access_log
  ├─ file_id, user_id, action (view, download)
  └─ created_at, ip

broker_profile
  ├─ user_id, slug, bio, spezialgebiete (jsonb)
  ├─ badges (jsonb), website, linkedin
  └─ verified_at

kaeufer_profile (öffentliche "Ich suche"-Profile)
  ├─ user_id, aktiv, kriterien (jsonb)
  └─ last_activity_at

zahlungen
  ├─ id, user_id, stripe_payment_intent, amount, currency
  ├─ status, plan_code, inserat_id (optional)
  └─ created_at

subscriptions
  ├─ id, user_id, stripe_subscription_id, plan
  ├─ status, current_period_start/end
  └─ cancelled_at

newsletter_abonnenten
  ├─ email, rolle_interesse, branche_interesse, kanton_interesse
  ├─ confirmed_at, unsubscribed_at
  └─ source

events_log (Audit-Trail)
  ├─ id, user_id, event_type, metadata (jsonb)
  ├─ ip, user_agent
  └─ created_at

feature_flags
  ├─ key, enabled, rollout_pct, target_users (jsonb)
  └─ updated_at

branchen (Ref)
  ├─ id, slug, label_de/fr/it/en, parent_id
  └─ icon

kantone (Ref)
  ├─ code (ZH, BE, …), name_de/fr/it/en, region
  └─ population

rechtsformen (Ref)
  ├─ code (AG, GmbH, EG, …), label_de/fr/it/en
  └─ min_kapital

atlas_firmen (Cache für Zefix-Daten)
  ├─ uid, name, rechtsform, kanton, gemeinde
  ├─ fiktiver_wert, wert_datum, status
  └─ inserat_id (optional)

blog_posts
  ├─ id, slug, published, published_at
  ├─ titel/excerpt/body pro Sprache
  ├─ kategorie, tags, lesezeit, author_id
  └─ featured_image

support_tickets
  ├─ id, user_id (optional), email, subject, body
  ├─ status, assigned_to, priority
  └─ created_at
```

### RLS-Strategie
- **owner-only:** `favoriten`, `gespeicherte_suchen`, `datenraum_access_log` (nur eigene Zeilen)
- **dual-owner:** `nachrichten`, `anfragen` (Käufer + Verkäufer sehen Thread)
- **public-read (limited):** `inserate` (nur `status=published`), `blog_posts` (`published=true`)
- **admin-only writes:** `feature_flags`, `branchen`, `kantone`, `rechtsformen`
- **broker+owner:** `broker_profile` (broker eigene; public read des `slug`-Profils)

### Indizes (kritisch)
- `inserate` auf `(status, published_at)`, `(branche_id, kanton_code)`, `slug`
- `anfragen` auf `(inserat_id, kaeufer_id)` unique
- `nachrichten` auf `(anfrage_id, created_at)`
- `favoriten` auf `(user_id)`, `(inserat_id, user_id)` unique
- `atlas_firmen` auf `uid` unique, `(kanton, status)`

---

## 🔐 Auth-Flow

```
1. User klickt "Registrieren"
2. Supabase `signUp` → confirmation-email via Resend-Integration
3. User klickt Confirm-Link → `/auth/callback` → exchange code → cookies gesetzt
4. Redirect nach `/onboarding/rolle` (wenn profile.rolle NULL)
5. Rolle + Profile Setup → redirect `/dashboard`
```

**Session:** JWT in Cookie, Refresh via Supabase SSR.
**MFA:** TOTP optional ab Etappe 130.
**Social-Login:** Google + Apple (optional, später).

---

## 💳 Payment-Flow

```
1. User wählt Paket im Inserat-Wizard Step 4
2. Server Action → Stripe Checkout Session erstellen
3. Redirect zu Stripe-Checkout
4. Bei Success: Stripe Webhook → `payment_intent.succeeded` → Vercel Endpoint
5. Webhook setzt `zahlungen.status=paid` + `inserate.status=published`
6. Resend schickt Bestätigungs-E-Mail + Rechnung als PDF
```

---

## 📧 E-Mail-System (Resend)

**Sender-Domain:** `passare.ch` (SPF + DKIM + DMARC konfiguriert)
**Templates (React Email):**
- `welcome.tsx` — nach Registrierung
- `confirm-email.tsx` — E-Mail-Verifikation
- `password-reset.tsx`
- `inserat-published.tsx`
- `new-anfrage.tsx` — Verkäufer wird informiert
- `nda-request.tsx`
- `nda-signed.tsx`
- `payment-success.tsx`
- `newsletter-*` — Kampagnen

**Transactional:** sofort. **Campaigns:** via Resend Broadcasts + Segmente.

---

## 🌍 i18n-Setup

- `next-intl` mit Dynamic-Routing `/[locale]/...`
- Default: `de` (ohne Prefix)
- Andere: `fr`, `it`, `en` (mit Prefix)
- Middleware erkennt `Accept-Language` beim ersten Besuch
- Cookie `NEXT_LOCALE` persistiert Wahl
- hreflang-Tags in `<head>` für alle Alternativen

---

## 🗺️ Maps-Architektur

- **Tiles:** MapLibre + OSM / optional Mapbox-Tiles
- **Canton-Boundaries:** `public/ch-cantons.json` (GeoJSON)
- **Rendering:** Dynamic-imported, `ssr: false`
- **Klick:** Drawer mit Firmendetails (Zefix-Cache)

---

## 🤖 AI-Integration (Claude)

- `@anthropic-ai/sdk` → `claude-sonnet-4-*`
- **Use-Cases:**
  - KI-Beschreibungsgenerator (Etappe 51)
  - Käufer-Matching-Embeddings (Etappe 141)
  - Content-Generation für Landingpages (Etappe 103)
- Server-only via `ANTHROPIC_API_KEY`

---

## 🧪 Quality Gates

- **TypeScript strict:** `npm run typecheck`
- **ESLint:** `npm run lint`
- **Build:** `npm run build` (muss ohne Errors durchlaufen)
- **Lighthouse:** Ziel > 95 für Performance/SEO/A11y auf Public-Pages
- **Manuelle Verifikation:** Chrome auf passare.ch nach jedem Deploy
- **E2E (geplant):** Playwright-Tests für kritische Flows

---

## 🔒 Security-Prinzipien

1. RLS auf allen User-Tabellen
2. CSP-Header (via `next.config.js`)
3. Rate-Limiting auf Auth + NDA + Payments (Upstash Redis später)
4. Secrets nur server-seitig via `process.env`
5. Stripe-Webhook-Signatures verifiziert
6. Dokumenten-Access im Datenraum über signed-URLs (Supabase Storage)
7. Wasserzeichen auf allen NDA-PDFs mit Käufer-Identität

---

## 📊 Monitoring

- **Errors:** Sentry (Client + Server)
- **Uptime:** Vercel-Built-in + externes Monitor (Uptime Robot)
- **DB:** Supabase-Metriken + Slow-Query-Log
- **Traffic:** Plausible (privacy-first)
- **Business-KPIs:** Eigener Admin-Dashboard (Etappe 95)

---

## 🌐 Domain & DNS

- **Primary:** `passare.ch` → Vercel
- **Fallback:** `passare.vercel.app` (immer live)
- **E-Mail:** `info@passare.ch`, `noreply@passare.ch`, `beta@passare.ch` (via Resend/Cloudflare)
- **DNSSEC:** empfohlen (später)

---

## 🔄 Backup & Recovery

- **Supabase:** Daily Automated Backups (PITR optional im Pro-Plan)
- **GitHub:** Repo = Source of Truth, Vercel zieht von dort
- **Storage:** Supabase replikiert S3-compatible (EU-Region)

---

## 📅 Stack-Versionen (Stand Etappe 1)

- Node 22
- Next.js 15.1.3
- React 19.0.0
- TypeScript 5.7
- Tailwind 3.4.17
- Supabase-JS 2.47
- Stripe 17.5
- Claude SDK 0.32

Updates werden mit jedem grösseren Block geprüft.
