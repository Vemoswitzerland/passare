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
| Verkäufer | Einmalige Paketgebühr: Light CHF 290 / Pro CHF 890 / Premium CHF 1'890 (je + 8.1% MwSt) |
| Käufer | Basic gratis (2 Tiers!) · MAX CHF 199/Monat oder CHF 1'990/Jahr (je + 8.1% MwSt) |
| ~~Broker~~ | ~~Phase 2, nicht V1~~ (aber `is_broker`-Flag ab Etappe 2 in DB) |

**0% Erfolgsprovision auf Deals.** Wir verdienen an der Plattform, nicht am Verkaufspreis.

**Rollen-Naming (harte Regel):** Überall `verkaeufer` + `kaeufer` (beide transliteriert). Nie mischen!

---

## 🏗️ BLOCK A — FUNDAMENT & INFRASTRUKTUR (Etappen 1–10)

### ✅ Etappe 1 — Repo, Scaffold, Beta-Gate, Deploy [LIVE]
Next.js 15/16, Tailwind, Beta-Gate, Vercel-Deploy.

### ✅ Etappe 1.5 — Design-System v1.0 [LIVE]
Fraunces + Geist, Navy/Bronze/Cream, Lucide, Framer Motion, Living Style Guide `/design`.

### ✅ Etappe 1.7 — Self-Service-Modell + Einzelseiten [LIVE]
Homepage umgebaut, `/verkaufen` (Hero mit Dashboard-Mockup), `/kaufen` (Marktplatz), `/preise`. Alle Docs aktualisiert.

### ⏳ Etappe 2 — Supabase Setup + Core-Migrations [NEXT]
**Ziel:** Supabase-Projekt verknüpft, `profiles` Tabelle mit Rollen (`verkaeufer`/`kaeufer`/`admin`), RLS.
**Tabellen:** `profiles` (inkl. `is_broker`, `mfa_enrolled`, `qualitaets_score`, `avg_response_time_hours`, `tags`, `admin_notes`), Trigger `auth.users → profiles`, User-Roles-Enum.
**ENV:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
**Verifikation:** Login-Registrierungs-Flow funktioniert auf Live-URL.

### ⬜ Etappe 2.1 [NEU] — Staging-Umgebung + CI/CD-Gates
**Ziel:** 2. Supabase-Projekt (staging) + 2. Vercel-Projekt (`passare-staging.vercel.app`). GitHub Actions mit TypeScript-Check, ESLint, Unit-Tests (Vitest), Lighthouse CI. Migrations laufen zuerst auf Staging.

### ⬜ Etappe 3 — Auth-Flows komplett
`/auth/login`, `/auth/register`, `/auth/callback`, `/auth/check-email`, `/auth/reset`, Session-Management, Device-Trust-E-Mails.

### ⬜ Etappe 3.1 [NEU] — Rate-Limiting + Bot-Schutz
Upstash Ratelimit-Middleware auf `/auth/*`, `/api/contact`, `/api/nda`, `/api/inserat/*`. hCaptcha/Turnstile auf Registrierung, Kontakt, NDA, Bewertungstool. Honeypot-Felder überall.

### ⬜ Etappe 3.2 [NEU] — MFA/TOTP (Pflicht für Admin)
Supabase MFA-Flow für Admin-Rolle, optional für MAX-Käufer. Recovery-Codes (10×) beim Setup.

### ⬜ Etappe 4 — Rollen-Onboarding
3-Step Wizard: Rolle wählen (`verkaeufer`/`kaeufer`) → Basis-Profil → Interessen. Zwingende AGB+Datenschutz-Checkbox → `terms_acceptances`-Row.

### ⬜ Etappe 5 — shadcn-kompatible Basiskomponenten erweitern
Select, Combobox, Dialog, Sheet, Tabs, Tooltip, Popover.

### ⬜ Etappe 6 — Responsive Nav + Mobile-Menu
Sticky-Header, Mobile Drawer, Auth-State, Notifications-Bell mit Badge.

### ⬜ Etappe 7 — i18n-Setup (next-intl) DE/FR/IT/EN
`/de`, `/fr`, `/it`, `/en` Routing, hreflang, Language-Cookie.

### ⬜ Etappe 8 — Forms-Framework
react-hook-form + Zod (mit Range-Validations gegen Sanity-Werte!), einheitliche Error-Displays, Sonner-Toasts.

### ⬜ Etappe 9 — Analytics + Monitoring
Plausible, Sentry, Vercel Analytics, UTM-Capture in `zahlungen.source_utm`.

### ⬜ Etappe 10 — Feature-Flags System
DB-basiert, Admin-Toggle, Rollout-% + Target-Users.

### ⬜ Etappe 10.1 [NEU] — Playwright E2E-Suite (Critical Paths)
E2E-Tests: Registrierung→Onboarding→Inserat, Käufer→Anfrage→NDA→Datenraum, Stripe-Checkout→Webhook→Rechnung, Admin→Moderation. Läuft in CI als harter Gate.

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
In-App Messaging mit Thread-Historie (companymarket hat das nicht — klarer USP). UI wird schon in Block F gebaut, aber DB-Schema + Realtime muss hier vorhanden sein.

### ⬜ Etappe 15.1 [NEU] — `notifications` + `push_subscriptions`
In-App Notification-Center + Web Push (VAPID). Jede wichtige User-Aktion schreibt Row. UI-Bell in Nav.

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

### ⬜ Etappe 21 — `zahlungen` + `invoices` (Stripe Mirror + CH-Rechnungen)
Jede Transaktion in DB gespiegelt inkl. `amount_net`, `vat_rate=8.1`, `vat_amount`, `amount_gross`, `source_utm`. Separate `invoices`-Tabelle mit **fortlaufenden Rechnungsnummern `RE-YYYY-NNNNN`**, UID-Nummer-Feld, Storno/Gutschrift-Support. `stripe_event_id` unique für Webhook-Idempotenz.

### ⬜ Etappe 21.1 [NEU] — `terms_acceptances` + `consent_records`
AGB-Versionierung mit explizit erzwungener User-Zustimmung. Consent-Records für Newsletter/Analytics/Marketing (CH-FADP + DSGVO).

### ⬜ Etappe 22 — `subscriptions` (MAX-Abo) + `v_user_entitlements`-View
Laufzeit + Renewal-Logik für Käufer MAX. **Entitlements als View** (kein denormalisiertes `max_active`-Flag auf profiles!). Dunning-Status sichtbar.

### ⬜ Etappe 23 — `newsletter_abonnenten` + Segmente
Double-Opt-In, nach Branche/Kanton/Rolle.

### ⬜ Etappe 24 — `events_log` (Audit-Trail)
DSGVO-konform, alle sensiblen Aktionen.

### ⬜ Etappe 25 — `feature_flags`
Global + per-User Targeting.

### ⬜ Etappe 25.1 [NEU] — `bewertungen` + `admin_actions` + `api_keys`
Peer-Reviews (blind, 14-Tage-Sichtbarkeits-Logik). Admin-Actions-Audit für Impersonation + 4-Eyes. API-Keys-Tabelle reserviert für Etappe 132.

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
### ⬜ Etappe 43 — Impressum / Datenschutz / AGB (rechtskonform CH) mit Versionierung
### ⬜ Etappe 44 — Trust-Center Page (Public-Facing: Security, Compliance, Partner-Logos, Zertifikate)
### ⬜ Etappe 45 — Cookie-Consent (Privacy-First, CH-FADP + DSGVO, Consent-Mode v2 für Google Ads/Meta)

---

## 🧑‍💼 BLOCK D — VERKÄUFER-DASHBOARD (Etappen 46–55)

### ⬜ Etappe 46 — Dashboard-Layout + Sidebar (role=verkaeufer)
### ⬜ Etappe 47 — Dashboard-Home: Stats (Views, Anfragen, NDAs) + Onboarding-Checklist ("Noch 3 Schritte bis dein Inserat live ist")
### ⬜ Etappe 48 — Meine Inserate: Liste + Bulk-Actions + Duplizieren (Multi-Standort)
### ⬜ Etappe 49 — Inserat-Wizard Step 1 (Grunddaten + Zefix-Integration mit Fallback + Rate-Limit)
### ⬜ Etappe 49.1 [NEU] — Auto-Save + Draft-Resume im Wizard
Jeder Wizard-Step speichert nach 2s Idle in `inserate (status=draft)`. User kann Browser schliessen, Tab wiederfinden über Dashboard.
### ⬜ Etappe 50 — Inserat-Wizard Step 2 (Finanzen, EBITDA, MA)
### ⬜ Etappe 51 — Inserat-Wizard Step 3 (Details + KI-Teaser inkl. Anonymitäts-Check via Claude)
### ⬜ Etappe 52 — Inserat-Wizard Step 4 (Bilder EXIF-Strip + Paket + Stripe) — nach Zahlung: `status='in_review'` (IMMER)
### ⬜ Etappe 52.1 [NEU] — Inserat-Preview (Wie sehen Käufer das?)
Ein-Klick-Preview in neuem Tab mit "PREVIEW"-Badge, zeigt Inserat exakt wie öffentlich.
### ⬜ Etappe 53 — Bearbeiten / Pausieren / Verkauft-setzen / Blocklist pro Inserat
### ⬜ Etappe 54 — Interessenten-Liste + Anfrage-Management + Qualitäts-Filter (KYC, Finanzierungsnachweis)
### ⬜ Etappe 55 — Statistiken pro Inserat (Views, Conversion) + PDF-Export

---

## 🛒 BLOCK E — KÄUFER-DASHBOARD (Etappen 56–65)

### ⬜ Etappe 56 — Käufer Dashboard-Home (Match-Score auf jedem Inserat für eingeloggte Käufer)
### ⬜ Etappe 57 — Favoriten (Watchlist + Notizen + Tags/Ordner + Stages: Kontaktiert/NDA/DD/Abgelehnt)
### ⬜ Etappe 58 — Gespeicherte Suchen + Alerts (E-Mail, WhatsApp für MAX)
### ⬜ Etappe 59 — Käuferprofil erstellen (Reverse-Listing) + Anonym-Modus (Käufer sucht ohne dass Verkäufer ihn sehen)
### ⬜ Etappe 59.1 [NEU] — Team-Accounts (Seats-Modell)
Family-Offices + Investoren-Teams: 1 MAX-Account mit mehreren Seats (zusätzlich CHF 99/Seat/Monat).
### ⬜ Etappe 60 — Anfragen-Inbox (Threads) + Vergleichstool (2–3 Inserate nebeneinander)
### ⬜ Etappe 61 — NDA-Management
### ⬜ Etappe 62 — Datenraum-Zugänge + private Datei-Notizen
### ⬜ Etappe 63 — Matching-Engine (AI, pgvector)
### ⬜ Etappe 64 — Due-Diligence-Checkliste (personalisiert pro Inserat)
### ⬜ Etappe 65 — Angebots-/LOI-Management

---

## 💬 BLOCK F — MESSAGING + NDA (Etappen 66–70)

### ⬜ Etappe 66 — Secure Messaging UI + Thread-View (Typing-Indicator + Read-Receipts + Abwesenheitsmeldung)
### ⬜ Etappe 67 — Realtime Chat (Supabase Realtime) + Push-Notifications (Web Push, später FCM)
### ⬜ Etappe 68 — NDA Digital-Signatur (V1: einfache E-Signatur mit IP/UA/Timestamp; Upgrade auf Skribble QES in Etappe 138)
### ⬜ Etappe 69 — NDA-Template-System (Admin, mehrere Varianten pro Inserat wählbar)
### ⬜ Etappe 70 — E-Mail-Notifications bei Messaging + Anhang-Size-Limit + ClamAV-Virus-Scan

---

## 📂 BLOCK G — DATENRAUM (Etappen 71–75)

### ⬜ Etappe 71 — Datenraum-Upload (Verkäufer) + Drag&Drop + ClamAV-Virus-Scan + MIME-Check
### ⬜ Etappe 71.1 [NEU] — Ordner-Struktur + Vorlagen-Templates + Datei-Versionierung
Standard-Ordner (Finanzen / Rechtliches / Verträge / HR / Operations), User kann individuell anpassen. Jede Datei hat Versionen (V1, V2 …).
### ⬜ Etappe 72 — Access-Control (per-User) + Expiring Signed-URLs + View-Only-Mode (kein Download)
### ⬜ Etappe 73 — Dynamisches PDF-Wasserzeichen (Edge-Function, on-demand, mit User-ID/IP/Timestamp eingebettet)
### ⬜ Etappe 74 — Audit-Trail (events_log + datenraum_access_log) + OCR-Durchsuchbarkeit
### ⬜ Etappe 75 — Download-Tracking + Stats

---

## 💳 BLOCK H — ZAHLUNGEN (Etappen 76–80)

### ⬜ Etappe 76 — Stripe Checkout (Verkäufer-Pakete: Light/Pro/Premium) inkl. **MwSt 8.1%**, Twint, SEPA, Kreditkarte
### ⬜ Etappe 77 — Stripe Subscription (Käufer MAX monatlich + jährlich) inkl. MwSt
### ⬜ Etappe 78 — Stripe Webhooks (Idempotenz via `stripe_event_id`, Signatur-Check, Retry-Queue, Dead-Letter-Log, Chargeback-Handling)
### ⬜ Etappe 79 — Invoice-Generation mit fortlaufenden Rechnungsnummern RE-YYYY-NNNNN + UID + PDF-Versand (Resend)
### ⬜ Etappe 79.1 [NEU] — Refund-Flow + Stornorechnungen
Admin-triggered Refund mit 4-Eyes bei >CHF 500. Storno-Invoice mit Bezug zur Original-Invoice. Resend Stornorechnung-PDF.
### ⬜ Etappe 79.2 [NEU] — Dunning (Failed Payments) + Promo-Codes/Gutscheine
Stripe Smart Retries + `past_due`→Feature-Gate-Deaktivierung nach 3 fehlgeschlagenen Versuchen. Admin-Panel für Launch-Promo-Codes.
### ⬜ Etappe 80 — Verlängerungen + Subscription-Management (User sieht Zahlungshistorie + Rechnungen)

---

## 🛠️ BLOCK I — ADMIN-PANEL (Etappen 81–90)

### ⬜ Etappe 81 — Admin-Layout + Role-Gate (MFA-Pflicht!) + 4-Eyes-Framework für kritische Aktionen
### ⬜ Etappe 82 — Inserate-Moderation-Queue + **Anonymitäts-Audit-Check** (Regex + LLM-Check auf Firmenname)
### ⬜ Etappe 83 — User-Management + Rollen + Sperren + **Impersonation** (mit Audit-Log) + interne Notes + Tags
### ⬜ Etappe 84 — Payment-Overview (alle Transaktionen) + Refund-Trigger + Dunning-Status
### ⬜ Etappe 85 — Report-Generator (MRR, GMV, Conversion, Churn-Analyse, Cohort-Analyse, Revenue-Forecasting)
### ⬜ Etappe 86 — Feature-Flags Admin-UI + A/B-Test-Dashboard
### ⬜ Etappe 87 — Content-Management (Blog + Landingpages + AGB/Datenschutz mit Versionierung + Force-Re-Accept)
### ⬜ Etappe 88 — Newsletter-Versand (Broadcast-Engine, segmentiert) — Template-Editor kommt in Etappe 101
### ⬜ Etappe 89 — Support-Ticket-System + Zuordnung zu Admin + Prioritäten
### ⬜ Etappe 90 — System-Health Dashboard + Login-Attempts-Monitoring + Sentry-Integration + Rate-Limit-Übersicht

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

### ⬜ Etappe 111 — Telefon-Verifikation Twilio (Verkäufer, Teil des Onboardings, nicht nachgelagert)
### ⬜ Etappe 112 — Käufer-KYC (optional, für NDA-Fast-Track)
### ⬜ Etappe 113 — Verifikations-Badges (Verkäufer + Käufer + passare-Verified-Broker)
### ⬜ Etappe 114 — Peer-Bewertungen (Verkäufer ↔ Käufer, blind, bidirektional, 5-Stern + Kommentar)
### ⬜ Etappe 115 — **[NEU statt Trust-Center-Duplikat]** CH-FADP + Incident-Response-Plan + SLA-Definition (Uptime-Garantie für MAX)
### ⬜ Etappe 116 — DSGVO/FADP Self-Service: Datenauskunft + JSON-Export + Soft-Delete → 30-Tage-Wiederherstellung → Hard-Delete mit Anonymisierung
### ⬜ Etappe 117 — Accessibility WCAG 2.1 AA (parallel zu öffentlichen Etappen, nicht nachgelagert!)
### ⬜ Etappe 118 — OWASP Top 10 Security-Audit + externes Pentest
### ⬜ Etappe 119 — Bug-Bounty-Kontakt + security.txt
### ⬜ Etappe 120 — Finanzierungsnachweis-Upload (MAX-Käufer)

---

## 🌍 BLOCK M — I18N VOLLSTÄNDIG (Etappen 121–130)

### ⬜ Etappe 121 — Alle Strings auf DE (Schweizer Hochdeutsch, kein ß) extrahiert
### ⬜ Etappe 122 — FR Übersetzung (professionell, Swiss French)
### ⬜ Etappe 123 — IT Übersetzung (Ticino-Italienisch)
### ⬜ Etappe 124 — EN Übersetzung
### ⬜ Etappe 124.1 [NEU] — RM (Rhätoromanisch) Übersetzung — Kern-Seiten (Landessprache der Schweiz!)
### ⬜ Etappe 125 — Formatierung pro Locale (CHF mit Hochkomma, Datum, Dezimal)
### ⬜ Etappe 126 — Sprachwechsler mit Persistenz
### ⬜ Etappe 127 — SEO-Sprach-Routing
### ⬜ Etappe 128 — hreflang-Matrix + x-default + robots/sitemap **pro Sprache**
### ⬜ Etappe 129 — E-Mail-Templates lokalisiert
### ⬜ Etappe 130 — CMS-Content mehrsprachig + Auto-Translation DeepL/Claude für User-Generated Content

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
