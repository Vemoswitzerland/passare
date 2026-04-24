# passare.ch — MASTER PLAN

> **Der vollständige, etappenweise Aufbau der Schweizer KMU-Nachfolge-Plattform.**
> Jede Etappe = eine Chat-Session. Enorme Tiefe pro Etappe. Jede endet mit Deploy auf Vercel.

---

## 📖 Wie dieser Plan zu lesen ist

- **Blöcke** (A–P) sind grobe Themen.
- **Etappen** sind atomare Umsetzungsschritte.
- Jede Etappe hat: Ziel · Umfang · Abhängigkeiten · Erledigt · Verifikation.
- Reihenfolge ist zwingend, ausser explizit anders vermerkt.

**Stabile URL:** https://passare-ch.vercel.app · Beta-Code: `passare2026`

---

## 🎯 DAS GESCHÄFTSMODELL (immer im Kopf behalten!)

**passare ist eine Self-Service-Plattform — KEIN Broker.**

| Benutzergruppe | Einnahmequelle |
|---|---|
| Verkäufer | Einmalige Paketgebühr: Light CHF 290 / Pro CHF 890 / Premium CHF 1'890 |
| Käufer | Basic gratis · MAX CHF 199/Monat oder CHF 1'990/Jahr |
| ~~Broker~~ | ~~Phase 2, nicht V1~~ |

**0% Erfolgsprovision auf Deals.** Wir verdienen an der Plattform, nicht am Verkaufspreis.

---

## 🏗️ BLOCK A — FUNDAMENT & INFRASTRUKTUR (Etappen 1–10)

### ✅ Etappe 1 — Repo, Scaffold, Beta-Gate, Deploy [LIVE]
Next.js 15/16, Tailwind, Beta-Gate, Vercel-Deploy.

### ✅ Etappe 1.5 — Design-System v1.0 [LIVE]
Fraunces + Geist, Navy/Bronze/Cream, Lucide, Framer Motion, Living Style Guide `/design`.

### ✅ Etappe 1.7 — Self-Service-Modell + Einzelseiten [LIVE]
Homepage umgebaut, `/verkaufen` (Hero mit Dashboard-Mockup), `/kaufen` (Marktplatz), `/preise`. Alle Docs aktualisiert.

### ⏳ Etappe 2 — Supabase Setup + Core-Migrations [NEXT]
**Ziel:** Supabase-Projekt verknüpft, `profiles` Tabelle mit Rollen (verkaeufer/kaeufer/admin), RLS.
**Tabellen:** `profiles`, Trigger `auth.users → profiles`, User-Roles-Enum.
**ENV:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
**Verifikation:** Login-Registrierungs-Flow funktioniert auf Live-URL.

### ⬜ Etappe 3 — Auth-Flows komplett
`/auth/login`, `/auth/register`, `/auth/callback`, `/auth/check-email`, `/auth/reset`.

### ⬜ Etappe 4 — Rollen-Onboarding
3-Step Wizard: Rolle wählen (verkaufer/kaeufer) → Basis-Profil → Interessen.

### ⬜ Etappe 5 — shadcn-kompatible Basiskomponenten erweitern
Select, Combobox, Dialog, Sheet, Tabs, Tooltip, Popover.

### ⬜ Etappe 6 — Responsive Nav + Mobile-Menu
Sticky-Header, Mobile Drawer, Auth-State.

### ⬜ Etappe 7 — i18n-Setup (next-intl) DE/FR/IT/EN
`/de`, `/fr`, `/it`, `/en` Routing, hreflang, Language-Cookie.

### ⬜ Etappe 8 — Forms-Framework
react-hook-form + Zod, einheitliche Error-Displays, Sonner-Toasts.

### ⬜ Etappe 9 — Analytics + Monitoring
Plausible, Sentry, Vercel Analytics.

### ⬜ Etappe 10 — Feature-Flags System
DB-basiert, Admin-Toggle.

---

## 🗄️ BLOCK B — KERN-DATENMODELLE (Etappen 11–25)

### ⬜ Etappe 11 — `inserate` Tabelle + RLS
Felder: id, slug, status (draft/in_review/published/paused/sold), owner_id, titel, teaser, beschreibung, **branche_id, kanton_code, region_code** (CH-Grossregion), umsatz_bucket, ebitda_marge, ebitda_bucket, mitarbeitende_bucket, mitarbeitende_exakt, gruendungsjahr, rechtsform, kaufpreis_exakt, kaufpreis_bucket, kaufpreis_vhb, uebergabe_zeitpunkt, uebergabe_grund, plan (light/pro/premium), views, featured_until, published_at, expires_at.

### ⬜ Etappe 12 — `inserate_media` + Supabase Storage
Bucket `inserat-public` (Teaser-Bilder, CDN) + `inserat-private` (Datenraum, Signed-URLs).

### ⬜ Etappe 13 — Reference Tables
`branchen` (18 Standard-CH), `kantone` (26), `regionen` (5 Grossregionen), `rechtsformen` (12), `uebergabe_gruende` (5).

### ⬜ Etappe 14 — `kategorien` (4 Top-Level)
Unternehmen / Kapital-Investition / Beteiligung-Franchise / Share-Sales.

### ⬜ Etappe 15 — `anfragen` + `nachrichten` (Messaging-Threads)
In-App Messaging mit Thread-Historie (companymarket hat das nicht — klarer USP).

### ⬜ Etappe 16 — `favoriten` (Watchlist)
Käufer markiert Inserat als Favorit, mit optionaler Notiz.

### ⬜ Etappe 17 — `gespeicherte_suchen` + Alert-Regel
JSON-Kriterien + alert_frequency.

### ⬜ Etappe 18 — `nda_requests` + eSign
Template-System, digitale Signatur, IP+Timestamp+UA-Log.

### ⬜ Etappe 19 — `datenraum_files` + Access-Permissions
Per-User-Access, Wasserzeichen-Konfiguration.

### ⬜ Etappe 20 — `kaeufer_profile` (Reverse-Listings)
Öffentliche "Ich suche…"-Profile mit Kriterien.

### ⬜ Etappe 21 — `zahlungen` (Stripe Mirror)
Jede Transaktion in DB gespiegelt.

### ⬜ Etappe 22 — `subscriptions` (MAX-Abo)
Laufzeit + Renewal-Logik für Käufer MAX.

### ⬜ Etappe 23 — `newsletter_abonnenten` + Segmente
Double-Opt-In, nach Branche/Kanton/Rolle.

### ⬜ Etappe 24 — `events_log` (Audit-Trail)
DSGVO-konform, alle sensiblen Aktionen.

### ⬜ Etappe 25 — `feature_flags`
Global + per-User Targeting.

---

## 🌐 BLOCK C — ÖFFENTLICHE SEITEN (Etappen 26–45)

*Bereits teils implementiert in Etappe 1.7, hier weitere Vertiefungen.*

### ⬜ Etappe 26 — Homepage-Optimierungen (SEO + Perf)
### ⬜ Etappe 27 — Inserate-Detail v1 (Teaser öffentlich, anonym)
### ⬜ Etappe 28 — Inserate-Detail v2 (Vollsicht nach NDA)
### ⬜ Etappe 29 — Foto-Gallery + Location-Map pro Inserat
### ⬜ Etappe 30 — Ähnliche Inserate-Block (Branche × Preisrange)
### ⬜ Etappe 31 — Käufer-Suchprofile öffentlich auflisten (Reverse-Listings)
### ⬜ Etappe 32 — Atlas-Karte CH mit Firmen-Pins
### ⬜ Etappe 33 — Nachfolge-Radar (Score-basierte Heatmap)
### ⬜ Etappe 34 — Öffentliches Bewertungstool (Lead-Magnet!)
Wert-Rechner (EBITDA-Multiples × Branche × Kanton) → gratis Range → E-Mail-Capture.
### ⬜ Etappe 35 — Finanzierungsrechner (EK/FK-Split)
### ⬜ Etappe 36 — KMU-Multiples-Datenbank (quartalsweise)
### ⬜ Etappe 37 — Blog (Supabase-backed, nicht hardcoded)
### ⬜ Etappe 38 — Branche × Kanton SEO-Landingpages (18 × 26 = 468)
### ⬜ Etappe 39 — FAQ / Help-Center (strukturiert)
### ⬜ Etappe 40 — Ratgeber-Hub mit Kategorien
### ⬜ Etappe 41 — Whitepaper-Downloads (Lead-Capture)
### ⬜ Etappe 42 — Newsletter-Anmeldung + Trigger
### ⬜ Etappe 43 — Impressum / Datenschutz / AGB (rechtskonform CH)
### ⬜ Etappe 44 — Trust-Center Page
### ⬜ Etappe 45 — Cookie-Consent (Privacy-First)

---

## 🧑‍💼 BLOCK D — VERKÄUFER-DASHBOARD (Etappen 46–55)

### ⬜ Etappe 46 — Dashboard-Layout + Sidebar (role=verkaufer)
### ⬜ Etappe 47 — Dashboard-Home: Stats (Views, Anfragen, NDAs)
### ⬜ Etappe 48 — Meine Inserate: Liste + Bulk-Actions
### ⬜ Etappe 49 — Inserat-Wizard Step 1 (Grunddaten + Zefix)
### ⬜ Etappe 50 — Inserat-Wizard Step 2 (Finanzen, EBITDA, MA)
### ⬜ Etappe 51 — Inserat-Wizard Step 3 (Details + KI-Teaser)
### ⬜ Etappe 52 — Inserat-Wizard Step 4 (Bilder + Paket + Stripe)
### ⬜ Etappe 53 — Bearbeiten / Pausieren / Verkauft-setzen
### ⬜ Etappe 54 — Interessenten-Liste + Anfrage-Management
### ⬜ Etappe 55 — Statistiken pro Inserat (Views, Conversion)

---

## 🛒 BLOCK E — KÄUFER-DASHBOARD (Etappen 56–65)

### ⬜ Etappe 56 — Käufer Dashboard-Home
### ⬜ Etappe 57 — Favoriten (Watchlist + Notizen)
### ⬜ Etappe 58 — Gespeicherte Suchen + Alerts
### ⬜ Etappe 59 — Käuferprofil erstellen (Reverse-Listing)
### ⬜ Etappe 60 — Anfragen-Inbox (Threads)
### ⬜ Etappe 61 — NDA-Management
### ⬜ Etappe 62 — Datenraum-Zugänge
### ⬜ Etappe 63 — Matching-Engine (AI)
### ⬜ Etappe 64 — Due-Diligence-Checkliste
### ⬜ Etappe 65 — Angebots-/LOI-Management

---

## 💬 BLOCK F — MESSAGING + NDA (Etappen 66–70)

### ⬜ Etappe 66 — Secure Messaging UI + Thread-View
### ⬜ Etappe 67 — Realtime Chat (Supabase Realtime)
### ⬜ Etappe 68 — NDA Digital-Signatur
### ⬜ Etappe 69 — NDA-Template-System (Admin)
### ⬜ Etappe 70 — E-Mail-Notifications bei Messaging

---

## 📂 BLOCK G — DATENRAUM (Etappen 71–75)

### ⬜ Etappe 71 — Datenraum-Upload (Verkäufer)
### ⬜ Etappe 72 — Access-Control (per-User)
### ⬜ Etappe 73 — Dynamisches PDF-Wasserzeichen
### ⬜ Etappe 74 — Audit-Trail
### ⬜ Etappe 75 — Download-Tracking + Stats

---

## 💳 BLOCK H — ZAHLUNGEN (Etappen 76–80)

### ⬜ Etappe 76 — Stripe Checkout (Verkäufer-Pakete: Light/Pro/Premium)
### ⬜ Etappe 77 — Stripe Subscription (Käufer MAX monatlich + jährlich)
### ⬜ Etappe 78 — Stripe Webhooks (payment_intent + subscription events)
### ⬜ Etappe 79 — Invoice-Generation + PDF-Versand (Resend)
### ⬜ Etappe 80 — Verlängerungen + Subscription-Management

---

## 🛠️ BLOCK I — ADMIN-PANEL (Etappen 81–90)

### ⬜ Etappe 81 — Admin-Layout + Role-Gate
### ⬜ Etappe 82 — Inserate-Moderation-Queue
### ⬜ Etappe 83 — User-Management + Rollen + Sperren
### ⬜ Etappe 84 — Payment-Overview (alle Transaktionen)
### ⬜ Etappe 85 — Report-Generator (MRR, GMV, Conversion)
### ⬜ Etappe 86 — Feature-Flags Admin-UI
### ⬜ Etappe 87 — Content-Management (Blog + Landingpages)
### ⬜ Etappe 88 — Newsletter-Sender (Broadcasts)
### ⬜ Etappe 89 — Support-Ticket-System
### ⬜ Etappe 90 — System-Health Dashboard

---

## 📝 BLOCK J — CONTENT & SEO (Etappen 91–100)

### ⬜ Etappe 91 — Blog-Editor + Preview
### ⬜ Etappe 92 — Blog-SEO (Schema.org, Related)
### ⬜ Etappe 93 — Branche × Kanton Landingpages (468 auto-generiert)
### ⬜ Etappe 94 — Sitemap.xml + Robots.txt pro Sprache
### ⬜ Etappe 95 — Structured Data (Product, Organization)
### ⬜ Etappe 96 — OG + Twitter Cards (dynamisch, @vercel/og)
### ⬜ Etappe 97 — Canonical URLs + hreflang-Matrix
### ⬜ Etappe 98 — Lighthouse 100 auf Public-Pages
### ⬜ Etappe 99 — SEO-Content Hauptseiten (manuell)
### ⬜ Etappe 100 — Google Business + Bing Webmaster

---

## 📣 BLOCK K — MARKETING & GROWTH (Etappen 101–110)

### ⬜ Etappe 101 — Newsletter-Builder (WYSIWYG)
### ⬜ Etappe 102 — E-Mail-Kampagnen + A/B-Tests
### ⬜ Etappe 103 — Social-Share Optimizations
### ⬜ Etappe 104 — Event-Tracking (PostHog custom events)
### ⬜ Etappe 105 — In-App Notification-Center
### ⬜ Etappe 106 — Onboarding-Tours (rollenspezifisch)
### ⬜ Etappe 107 — Referral-Programm (Verkäufer → Verkäufer)
### ⬜ Etappe 108 — PR-Kit + Pressebereich
### ⬜ Etappe 109 — Podcast/Videos embedded
### ⬜ Etappe 110 — Landing-Page-Varianten A/B

---

## 🛡️ BLOCK L — TRUST, QUALITÄT, COMPLIANCE (Etappen 111–120)

### ⬜ Etappe 111 — Telefon-Verifikation Twilio (Verkäufer)
### ⬜ Etappe 112 — Käufer-KYC (optional, für NDA-Fast-Track)
### ⬜ Etappe 113 — Verifikations-Badges (Verkäufer + Käufer)
### ⬜ Etappe 114 — Portal-Bewertungen (5-Stern)
### ⬜ Etappe 115 — Trust-Center Page
### ⬜ Etappe 116 — DSGVO Datenauskunft + Export + Löschung
### ⬜ Etappe 117 — Accessibility WCAG 2.1 AA
### ⬜ Etappe 118 — OWASP Top 10 Security-Audit
### ⬜ Etappe 119 — Bug-Bounty-Kontakt
### ⬜ Etappe 120 — Finanzierungsnachweis-Upload (MAX-Käufer)

---

## 🌍 BLOCK M — I18N VOLLSTÄNDIG (Etappen 121–130)

### ⬜ Etappe 121 — Alle Strings auf DE extrahiert
### ⬜ Etappe 122 — FR Übersetzung (professionell)
### ⬜ Etappe 123 — IT Übersetzung
### ⬜ Etappe 124 — EN Übersetzung
### ⬜ Etappe 125 — Formatierung pro Locale (CHF, Datum, Dezimal)
### ⬜ Etappe 126 — Sprachwechsler mit Persistenz
### ⬜ Etappe 127 — SEO-Sprach-Routing
### ⬜ Etappe 128 — hreflang-Matrix + x-default
### ⬜ Etappe 129 — E-Mail-Templates lokalisiert
### ⬜ Etappe 130 — CMS-Content mehrsprachig

---

## 🚀 BLOCK N — ADVANCED FEATURES (Etappen 131–140)

### ⬜ Etappe 131 — KI-Käufer-Matching (pgvector)
### ⬜ Etappe 132 — Public Valuation API (für Partner)
### ⬜ Etappe 133 — Banken/Finanzierungs-Partner-Integration
### ⬜ Etappe 134 — Berater-Directory (Treuhänder, Anwälte)
### ⬜ Etappe 135 — WhatsApp-Alerts für MAX-Abo
### ⬜ Etappe 136 — Calendar-Integration (Meetings)
### ⬜ Etappe 137 — Video-Conferencing embedded
### ⬜ Etappe 138 — E-Signing Skribble (Swiss QES)
### ⬜ Etappe 139 — LOI-Template-Generator
### ⬜ Etappe 140 — CSV-Export (intern, nicht public!)

---

## ⚡ BLOCK O — OPTIMIERUNG (Etappen 141–150)

### ⬜ Etappe 141 — Image-Optimization (Supabase Smart-Compression)
### ⬜ Etappe 142 — Caching-Strategy (ISR + Redis)
### ⬜ Etappe 143 — CDN + Cache-Headers
### ⬜ Etappe 144 — Database-Indexes + Query-Analyse
### ⬜ Etappe 145 — N+1 Query Killing
### ⬜ Etappe 146 — Lazy-Loading + Dynamic-Imports
### ⬜ Etappe 147 — Bundle-Size-Optimization
### ⬜ Etappe 148 — Core-Web-Vitals < 2.5s LCP
### ⬜ Etappe 149 — Lighthouse 100 global
### ⬜ Etappe 150 — Real-User-Monitoring

---

## 🔮 BLOCK P — PHASE 2: BROKER-ANGEBOT (Etappen 151–160)

*Nicht in V1 — nach Launch und erstem Traffic-Volumen.*

### ⬜ Etappe 151 — Broker-Pakete konzipieren (Starter/Pro/Agency)
### ⬜ Etappe 152 — Broker-Dashboard Layout
### ⬜ Etappe 153 — Portfolio: Mandate verwalten
### ⬜ Etappe 154 — Lead-CRM mit Kanban
### ⬜ Etappe 155 — Commission-Tracking
### ⬜ Etappe 156 — Broker-Profilseite + Badge
### ⬜ Etappe 157 — White-Label-Option
### ⬜ Etappe 158 — Broker-Verifikation (KYC)
### ⬜ Etappe 159 — Team-Accounts
### ⬜ Etappe 160 — Deal-Pipeline (Stages)

---

## 📊 FORTSCHRITT

| Block | Status |
|---|---|
| A Fundament (1–10) | 3 ✓ / 7 ⏳ |
| B Datenmodelle (11–25) | 0/15 |
| C Public (26–45) | 0/20 |
| D Verkäufer-Dashboard (46–55) | 0/10 |
| E Käufer-Dashboard (56–65) | 0/10 |
| F Messaging + NDA (66–70) | 0/5 |
| G Datenraum (71–75) | 0/5 |
| H Zahlungen (76–80) | 0/5 |
| I Admin (81–90) | 0/10 |
| J Content + SEO (91–100) | 0/10 |
| K Marketing (101–110) | 0/10 |
| L Trust (111–120) | 0/10 |
| M i18n (121–130) | 0/10 |
| N Advanced (131–140) | 0/10 |
| O Optimierung (141–150) | 0/10 |
| P Phase 2 Broker (151–160) | 0/10 |

**Gesamt: 3 / 160 Etappen ✓**

---

## 🛑 REGELN FÜR JEDE ETAPPE

1. **Ein Chat = eine Etappe.** Niemals zwei.
2. **Tiefe > Breite.** Lieber eine perfekt als zwei halb.
3. **Immer deployen** am Ende (`vercel --prod --yes` + `vercel alias set ... passare-ch.vercel.app`).
4. **Immer verifizieren** im Chrome auf `passare-ch.vercel.app` nach dem Deploy.
5. **MASTER_PLAN.md aktualisieren** (✓ hinter die Etappe).
6. **Design-System respektieren** (siehe `docs/DESIGN_SYSTEM.md`).
7. **Geschäftsmodell befolgen** (Self-Service-Plattform, 0% Provision).
8. **Keine Broker-Features bis Phase 2.**
9. **RLS-first** auf jeder neuen Tabelle.
10. **Taxonomie einhalten** (18 Branchen, 26 Kantone, 5 Regionen, Bucket-Enums — siehe `docs/COMPETITOR_RESEARCH.md`).

---

*Letzte Aktualisierung: 24.04.2026 · Etappe 1.7 live (Self-Service-Modell)*
