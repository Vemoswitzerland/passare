# passare.ch — MASTER PLAN V2

> **Stand: 30.04.2026 — komplett überarbeitet.**
> Realitätsbasiert nach Code-Audit + Sprachmemo-Integration.
> Alte 196-Etappen-Version: siehe `MASTER_PLAN_ARCHIV_2026-04-30.md`.

---

## 📖 Wie dieser Plan funktioniert

3 Phasen mit klaren Zielen. Pro Item: **Status + Aufwand + Reihenfolge**.

**Status-Legende:**
- ✅ live & funktional
- 🔄 teilweise gebaut, braucht Polish
- ⏳ offen, geplant
- 💭 Idee, später entscheiden
- ❌ rausgeworfen aus altem Plan

**Phasen:**
- **Phase 1** = Public-Launch-Readiness (Beta-Gate raus, dann öffentlich live)
- **Phase 2** = Growth (post-Launch, Marktexpansion durch neue Persona-Layer)
- **Phase 3** = Money Machine (Vision, ab 12+ Monate Live-Traffic)

---

## 🎯 GESCHÄFTSMODELL (unverändert)

**passare = Self-Service-Plattform — KEIN Broker. 0% Erfolgsprovision.**

### Verkäufer — einmalige Paketgebühr pro Inserat
| Paket | Preis | Laufzeit | Verlängerung |
|---|---|---|---|
| Inserat Light | CHF 290 | 3 Monate | +CHF 190 / 3M |
| Inserat Pro | CHF 890 | 6 Monate | +CHF 490 / 6M |
| Inserat Premium | CHF 1'890 | 12 Monate | +CHF 990 / 12M |

Alle + 8.1% MwSt. **Keine Auto-Verlängerung** (wirkt abzockig).

### Käufer — drei Tiers (NEU: Talent-Stufe)
| Tier | Preis | Zielgruppe |
|---|---|---|
| **Basic** | gratis | Browsen, 5 Anfragen/Monat |
| **Talent** ⭐ NEU | CHF 24/Jahr | "Ich will Firma übernehmen" — frustrierte CH-Mitarbeiter mit Übernahme-Wunsch. Eigenes öffentliches Talent-Profil, im Newsroom posten, von Verkäufern findbar. |
| **MAX** | CHF 199/Monat oder CHF 1'990/Jahr | Aktive Käufer mit Mandat: 7-Tage-Vorzugriff, alle Filter, WhatsApp-Alerts, NDA-Fast-Track, Featured-Profil, KMU-Multiples-DB |

### Broker — Phase 2
Broker können sich heute schon als MAX-Käufer registrieren (mit `is_broker`-Flag). Eigenes Broker-Produkt → Phase 2.

### Rollen-Naming (harte Regel)
Im Code IMMER `verkaeufer` + `kaeufer` (transliteriert). Nie mischen.

---

## 📊 STATUS QUO — Was am 30.04.2026 LIVE ist

### Fundament & Auth — ✅ komplett
- Repo, Beta-Gate (`passare2026`), Vercel-Deploy
- Design-System v1.0 (Fraunces + Geist, Navy/Bronze/Cream, Lucide, Framer Motion)
- Custom-Domain `passare.ch` aktiv
- Robots.txt Disallow + X-Robots-Tag noindex global (Beta-Modus)
- Living Style Guide `/design`
- Live-Status-Page `/status` (Code 2827) mit Build-Log + Task-Liste
- Supabase EU-Central provisioniert, ENV verdrahtet
- 13 Migrations, ~18 Tabellen, RLS überall (mehrfach gefixt)
- Auth komplett: Register/Login/Reset/Email-Verify/PKCE/OTP + Google + LinkedIn OAuth
- Onboarding-Wizard 3-Step (Rolle → Profil → AGB-Accept) mit `terms_acceptances`-Tracking
- Session-Management via middleware.ts

### Verkäufer-Bereich — ✅ komplett
- Pre-Reg-Funnel: Zefix-Lookup → Smart-Pricing → erst danach Konto
- 5-Step-Inserat-Wizard mit Autosave (Firma → Kennzahlen → Beschreibung → Medien → Review)
- Inserat-Statuses: draft → in_review → published → paused → sold
- **Rückfrage-Workflow** (Admin stellt Frage → Verkäufer antwortet → Audit-Log) — besser als ursprünglich geplant
- Dashboard: Übersicht (KPIs), Inserate, Anfragen mit Drawer, NDA-Pipeline (3 Spalten), Datenraum (Versionen + Audit), Statistik (Charts), Paket-Verwaltung, Settings, Public-Preview

### Käufer-Bereich — ✅ komplett
- Marktplatz auf `/` mit Filter (Branche/Kanton/Sort)
- Inserat-Detail-Page mit Anfrage-Button + Merken/Teilen
- Anfragen-Inbox mit Konversations-Thread + Drawer
- NDA-Pipeline zum Signieren
- **Favoriten-Kanban-Pipeline** (Interesse / Gebot / Gewonnen / Abgelehnt) — Etappe 57.1 vorzeitig erledigt
- Saved Searches (max 3) mit Daily-Alerts
- Käuferprofil (Reverse-Listing) mit Anonym-Modus
- MAX-Abo via Stripe-Customer-Portal
- Berater-Datenraum-Share (zeitlich limitiert)

### Admin — ✅ komplett
- User-Management mit Impersonation
- Inserat-Review-Queue mit Rückfrage-Workflow
- Blog-Verwaltung mit KI-Generator
- Anfragen-Moderation
- Logs/Audit-Trail
- Volltextsuche über mehrere Tabellen
- Settings

### Lead-Magnete & Public-Tools — ✅ live
- `/bewerten` — 6-Fragen-Wizard mit echter Multiples-Engine
- `/atlas` — MapLibre-Karte mit Filter, Marker, Popups (nur inserierte Firmen, V1)
- `/ratgeber` — MDX-Blog mit KI-Generator + Kategorien

### Backend-Pipes — ✅ live
- 8 React-Email-Templates über Resend (Verifizierung, Welcome, Anfrage-Eingang, Anfrage-Beantwortet, NDA-Signiert, Alert-Neues-Inserat, Inserat-Bald-Abgelaufen, Zahlungs-Bestätigung)
- Stripe Checkout + Webhook + Customer-Portal
- Zefix-API mit 24h-Cache
- Anthropic Claude für Branche-Suggest, Teaser-Generator, Blog-Generator
- Rate-Limiting (IP-basiert) + AI-Audit-Logging

---

## 🚨 WAS BLOCKIERT DEN PUBLIC-LAUNCH

Diese Punkte müssen vor `BETA_GATE_ENABLED=false` erledigt sein.

---

## 📋 PHASE 1 — Public-Launch-Readiness

### P1.1 — Cross-Bereich-Integration polishen ⏳ — 1-2 Tage
*Letzter offener Task aus aktuellem Status:*
- Verkäufer ↔ Käufer ↔ Admin Datenflüsse end-to-end testen
- Kein-Mock-Daten-Garantie (alle Listen ziehen aus DB)
- Status-Übergänge konsistent (Inserat published → erscheint im Marktplatz, Anfrage → kommt im Verkäufer-Dashboard an, etc.)

### P1.2 — Rechnungs-Logic + Compliance ⏳ — 3-5 Tage
- `invoices` Tabelle mit fortlaufenden Nummern `RE-YYYY-NNNNN`
- MwSt 8.1% korrekt ausgewiesen (net + vat + gross + UID-Nr.)
- PDF-Generation + Resend-Versand nach Zahlung
- Storno-Rechnungen mit Bezug auf Original
- Stripe-Webhook-Idempotenz via `stripe_event_id` UNIQUE
- Refund-Flow + Dunning (Failed Payments, Smart Retries, Feature-Gate-Deaktivierung)

### P1.3 — Trust + Compliance Pflicht-Pages ⏳ — 2-3 Tage
- AGB + Datenschutz versionsiert (Force-Re-Accept bei neuer Version)
- Impressum (CH-rechtskonform mit UID-Nr.)
- Cookie-Consent-Banner (CH-FADP + DSGVO Consent-Mode v2)
- Trust-Center-Page (Public-Facing: Security, Compliance, Partner-Logos)
- DSGVO/FADP Self-Service: Datenauskunft + JSON-Export + Soft-Delete (30-Tage-Wiederherstellung) → Hard-Delete

### P1.4 — Bot- und Missbrauchs-Schutz ⏳ — 2 Tage
- hCaptcha oder Cloudflare Turnstile auf Register/Bewerten/Anfrage/Kontakt
- Honeypot-Felder
- Rate-Limit auf Auth-Routes verschärfen (Upstash)

### P1.5 — MFA für Admin ⏳ — 1-2 Tage
*Kritisch wegen Impersonation-Funktion!*
- Supabase MFA/TOTP-Flow für Admin-Rolle (Pflicht)
- Optional für MAX-Käufer
- Recovery-Codes (10×) beim Setup

### P1.6 — Telefon-Verifikation Verkäufer ⏳ — 1-2 Tage
- Twilio-SMS-OTP integriert in Onboarding für Rolle=verkaeufer
- Trust-Signal sichtbar auf Inserat-Detail ("Verkäufer-Telefon verifiziert")

### P1.7 — i18n DE/FR/IT/EN aktivieren ⏳ — 1-2 Wochen (großer Brocken)
- next-intl Routing aktivieren (`/de`, `/fr`, `/it`, `/en`)
- DE als Default, alle Strings extrahiert
- FR/IT/EN initial via DeepL, dann manueller Pass durch native Speaker
- Sprachwechsler in Header
- hreflang-Matrix
- E-Mail-Templates lokalisiert
- Formatierung pro Locale (CHF-Hochkomma, Datum, Dezimal)
- ❌ Rätoromanisch — bewusst NICHT in Phase 1

### P1.8 — Powerups-Shop-UI ⏳ — 2-3 Tage
*Tabelle existiert, UI fehlt:*
- Verkäufer-Dashboard: Powerup-Shop-Page (Featured 14 Tage, Boost, etc.)
- Stripe-Checkout pro Powerup
- Aktive Powerups in Inserat-Detail sichtbar (Featured-Badge etc.)

### P1.9 — Monitoring & Observability ⏳ — 1-2 Tage
- Sentry Frontend + Server
- Plausible (privacy-first Analytics)
- Vercel Analytics
- UTM-Capture in `zahlungen.source_utm`
- Cost-Monitoring-Alerts (Stripe/Supabase/Resend/Claude)

### P1.10 — CI/CD-Gates ⏳ — 2-3 Tage
- 2. Vercel-Projekt `passare-staging.vercel.app`
- 2. Supabase-Projekt für Staging
- GitHub Actions: TypeScript-Check + ESLint + Lighthouse CI
- Migrations laufen ZUERST auf Staging
- Branch-Protection auf `main`

### P1.11 — E2E-Tests Critical Paths ⏳ — 3-4 Tage
- Playwright-Setup
- 5 kritische Flows als harter Gate:
  1. Register → Onboarding → Inserat veröffentlichen → Marktplatz
  2. Käufer findet Inserat → Anfrage → NDA-Sign → Datenraum-Zugriff
  3. Stripe-Checkout (Verkäufer-Paket) → Webhook → Rechnung
  4. Admin moderiert Inserat (Approve / Rückfrage / Reject)
  5. `/bewerten` (Lead-Magnet) → Lead in DB

### P1.12 — Inserat-Pricing-UX-Polish ⏳ — 1 Tag
- Klare Anzeige "8.1% MwSt inkl." auf allen Paket-CTAs
- Verlängerungs-Mail 14/7/3 Tage vor expires_at
- "Inserat-Bald-Abgelaufen" funktional getestet (Email-Template existiert ja)

---

### Phase 1 Reihenfolge & Aufwand

| # | Item | Aufwand | Block? |
|---|---|---|---|
| 1 | P1.1 Cross-Bereich-Integration | 1-2 Tage | sofort |
| 2 | P1.2 Rechnungen + MwSt | 3-5 Tage | sofort |
| 3 | P1.3 Trust + AGB + Cookie | 2-3 Tage | parallel zu 2 |
| 4 | P1.4 CAPTCHA + Bot-Schutz | 2 Tage | parallel |
| 5 | P1.5 MFA Admin | 1-2 Tage | parallel |
| 6 | P1.6 Telefon-Verify Verkäufer | 1-2 Tage | parallel |
| 7 | P1.7 i18n DE/FR/IT/EN | 1-2 Wochen | parallel zu allem |
| 8 | P1.8 Powerups-Shop | 2-3 Tage | nach 2 |
| 9 | P1.9 Monitoring | 1-2 Tage | parallel |
| 10 | P1.10 CI/CD + Staging | 2-3 Tage | parallel |
| 11 | P1.11 E2E-Tests | 3-4 Tage | nach 1+8 |
| 12 | P1.12 Pricing-UX-Polish | 1 Tag | parallel |

**Geschätzte Phase-1-Dauer:** 4-6 Wochen mit Agent-Teams parallel, 8-10 Wochen alleine.

**Phase-1-Done-Definition:** `BETA_GATE_ENABLED=false` möglich, Public-Launch-Date setzen.

---

## 📋 PHASE 2 — Growth (post-Launch, 3-6 Monate)

### P2.1 — Nachfolger-Marktplatz ⏳ NEU aus Memo
*Verdoppelt den adressierbaren Markt — Babyboomer-Inhaber + Übernahme-Talente.*

- `inserate.inserat_type` Enum: `verkauf | nachfolge_gesucht`
- Verkäufer-Wizard: zusätzliche Auswahl "Ich verkaufe" vs "Ich suche Nachfolger"
- Bei Nachfolge: ggf. günstigeres Pricing-Paket (Nachfolge-Light: CHF 90?)
- `kaeufer_profil.profile_type` Enum: `kaeufer | uebernahme_talent`
- Talent-Profil: Branchen-Erfahrung, Region, Budget-Range, Zeithorizont, Motivation, Anonym-Modus
- Public-Page `/nachfolge` zeigt beide Seiten nebeneinander (Mandate × Talente)
- Bidirektionales Matching (Verkäufer findet Talente, Talente finden Mandate)

### P2.2 — Käufer-Talent-Tier ⏳ NEU aus Memo
*CHF 24/Jahr für 500'000 frustrierte CH-Mitarbeiter.*

- `subscriptions.tier` erweitern um `talent`
- Onboarding-Quiz für Talent-Tier (Branche, Standort, Budget, Motivation) → Profil auto-generiert
- Talent kann im Newsroom posten (Mini-Beiträge "Suche Maler-Betrieb in BE/SO")
- Pricing-Page `/preise` aktualisieren

### P2.3 — Atlas v2 mit Auto-Wertberechnung ⏳ NEU aus Memo
*"Handelsregister in cool" — jede CH-Firma sichtbar, mit fiktivem Wert.*

- `firmen_bulk` Tabelle mit allen ~600'000 CH-Firmen aus Zefix-Bulk-Export
- Auto-Wert pro Firma (Branche × MA × Region × Multiples-DB)
- Atlas-Map zeigt nicht nur inserierte Firmen, sondern alle (gegated nach Zoom-Level)
- Inhaber kann sein Listing "claimen" → Lead in Verkäufer-Funnel
- Branchen-Heatmap, Kanton-Drill-Down
- Virale Share-Karten ("meine Firma ist 2.4M wert")
- DSGVO: nur öffentliche HR-Daten + Wert-RANGE für nicht-geclaimte Firmen
- 468 Branche×Kanton-SEO-Pages auto-generiert mit echten Firmen-Listings

### P2.4 — Branchenleader-Content-Hub ⏳ NEU aus Memo
*Multi-Author-Editor für Branchen-VIPs — User-generated SEO-Content.*

- Neue Rolle `branchenleader` (invite-only)
- Eigene Profil-URL `/insights/peter-muster` mit RSS + LinkedIn-Cross-Post
- Editor mit MDX (gleicher wie Admin-Blog, weniger Rechte)
- Live-Cases (anonymisierte Deal-Stories — User berichten)
- Events-Kalender mit Live-Stream-Embed (Restream/Mux)
- Podcast-Format "Schweizer Nachfolge" — passare produziert, Gäste aus User-Pool

### P2.5 — PWA + Web-Push ⏳
- `manifest.json` + Service-Worker (Workbox)
- VAPID-Push-Keys
- Push-Permission nach 1. Login + Erfolgserlebnis
- Offline-Strategien für Favoriten, Listings
- Install-Prompt nach Engagement

### P2.6 — MAX-Abo-Features ausbauen ⏳
- Daily-Digest 07:00 (3 Top-Matches per E-Mail/Push)
- WhatsApp-Alerts (Twilio)
- 7-Tage-Vorzugriff auf neue Inserate
- Featured-Käuferprofil
- NDA-Fast-Track (Verkäufer sieht "MAX-Käufer" Badge)
- KMU-Multiples-DB öffentlich für MAX

### P2.7 — Anonymitäts-Coach Live-Streaming ⏳
*Im Wizard prüft Claude in Echtzeit auf Anonymitäts-Verstösse.*

- Streaming-Endpoint `/api/anon-coach`
- Debounce 800ms
- Highlight in UI auf Titel/Teaser/Beschreibung
- Suggestion-Picker (3 Verbesserungs-Vorschläge)
- Branchen-spezifische Hinweise

### P2.8 — Anfrage-Scoring ⏳
*Käufer-Qualität 0-100 für Verkäufer-Inbox.*

- Score deterministisch (KYC + Finanzierungsnachweis + Branchen-Erfahrung + Budget-Match + Account-Alter + Antwort-Historie)
- Anzeige als Badge in Anfragen-Liste
- Filter "nur >70 Punkte"
- Erklärungs-Tooltip pro Score-Komponente

### P2.9 — Expert-Marketplace ⏳
*Zertifizierte Berater (Anwälte, Treuhänder, M&A-Berater) mit Buchungsflow + 20% Plattform-Cut.*

- Berater-Verzeichnis mit Filter (Spezialgebiet, Region, Sprache)
- Booking-Flow (Calendly-Integration)
- Stripe-Connect für Auszahlung minus 20%
- Zertifizierungs-Workflow (Admin-Approval)
- Bewertungs-System nach Termin

### P2.10 — Referral-Programm ⏳
- Verkäufer → Verkäufer (CHF 50 Gutschrift bei erstem Inserat)
- Käufer → Käufer (1 Monat MAX gratis)
- NPS-Survey nach 30 Tagen
- E-Mail-Drip-Campaigns 7-Tage-Onboarding

### P2.11 — Match-Engine v2 (pgvector) ⏳
- Embedding-Vektor pro Inserat + Käuferprofil
- Match-Score 0-100 auf jedem Inserat für eingeloggte Käufer
- "Mehr-wie-das"-Empfehlungen
- A/B-Tests via Feature-Flags

### P2.12 — Feature-Flags-System ⏳
- DB-Tabelle `feature_flags` (global + per-User Targeting + Rollout-%)
- Admin-UI zum Toggle
- TypeScript-Helper `useFeatureFlag('xyz')`

### P2.13 — Käufer-KYC + Finanzierungsnachweis ⏳
- Optional für NDA-Fast-Track
- Upload + Admin-Review → "Verifiziert"-Badge
- Soft-Gate: Verkäufer kann "nur verifizierte Anfragen" einstellen

### P2.14 — Peer-Bewertungen ⏳
- Verkäufer ↔ Käufer (blind, bidirektional, 5-Stern + Kommentar)
- 14-Tage-Sichtbarkeits-Logik (beide müssen bewerten oder Frist abläuft)
- Reputation-Score sichtbar auf Profil

---

### Phase 2 Priorisierung

**Erst (Markt-Erweiterung):** P2.1 Nachfolger-Marktplatz + P2.2 Talent-Tier zusammen — das ist die größte Hebelwirkung aus den Sprachmemos.

**Dann (Promotion):** P2.3 Atlas v2 + P2.4 Branchenleader-Hub — User-Magnet + SEO-Goldgrube.

**Dann (Power-User-Tools):** P2.5 PWA + P2.6 MAX-Features + P2.7 Anonymitäts-Coach.

**Dann (Quality + Trust):** P2.8 Scoring + P2.13 KYC + P2.14 Peer-Bewertungen.

**Parallel:** P2.10 Referrals + P2.12 Feature-Flags (kontinuierliche Verbesserung).

---

## 📋 PHASE 3 — Money Machine (Vision, 12+ Monate)

> Cyrils "Next Big Thing". Nicht jetzt bauen — als strategische Klammer dokumentieren.

### Säule 1 — Financing
- Banken-Lead-Pipeline (Hypothekarbank Lenzburg-Pilot)
- Crowd-Lending-Plattform innerhalb passare (KMU-Akquisitions-Finanzierung)
- Optional: passare-eigener Akquisitions-Fund

### Säule 2 — Contracting
- LOI-Generator (Claude, branchenspezifisch)
- NDA-Auto-Verhandlung (statt Standard-Template)
- Vollständiger SPA-Generator (Share Purchase Agreement)
- Notar-Integration (digital)
- Skribble QES (Swiss Qualified Electronic Signature)

### Säule 3 — Data Command
- passare-Insights-Dashboard als B2B-Subscription für Banken/Investoren/Verbände
- Public Valuation API (für Partner)
- Quartals-Markt-Report (paid + Lead-Magnet free)
- Predictive Matching (welche Branche/Region wird heiss in 12M)
- White-Label-Config (Kanton-Verband nutzt passare als eigenes Portal)

---

## 🛑 ANTI-PATTERN — explizit aus dem Plan rausgeworfen

- ❌ **Kein NDA-Pflicht-Gate** für Erstkontakt. NDA = Feature des Verkäufers, nicht Voraussetzung.
  > Cyril: "völlig unverbindlich, ohne NDA. Was zwischen Käufer/Verkäufer passiert interessiert uns nicht."
- ❌ **Keine Gratis-Zone für Broker.** Plattform von Tag 1 mit Preis (cf. Talent-Tier ist auch zahlpflichtig, nicht gratis).
- ❌ **Keine Auto-Verlängerungs-Falle.** Wirkt abzockig. Lieber gezielte Renewal-Mails.
- ❌ **Keine Dark-Pattern-Notifications.** Lieber langsam wachsen mit hoher Qualität.
- ❌ **Kein Rätoromanisch in Phase 1** — Overkill bei aktuellem Volumen.
- ❌ **Kein eingebettetes Video-Conferencing** — User nutzen Teams/Zoom.
- ❌ **Keine "kuratierte Redaktion"** oder Broker-Sprache in der UI — passare ist Self-Service.

---

## 🌟 NEUE PERSONAS (aus Sprachmemos)

Werden in `PERSONA_WALKTHROUGH.md` ausführlich beschrieben.

### Persona 4 — Hans, 64, Inhaber Malerbetrieb
**Sucht Nachfolger, nicht Cash-Out.** Hat Geld, will Lebenswerk weiterführen lassen. Heute fällt er durch alle Raster: kein Käufer (er verkauft), aber auch nicht klassischer Verkäufer (will keine reine Cash-Transaktion).
→ Phase-2-Feature P2.1 Nachfolger-Marktplatz adressiert ihn.

### Persona 5 — Marc, 38, Malermeister
**Will eigene Firma — am liebsten übernehmen statt gründen.** Karriere-Schritt, will sich positionieren, aber nicht zu öffentlich (aktueller Arbeitgeber). Pains: Geld (im Übernahme-Moment), Know-How.
→ Phase-2-Features P2.1 + P2.2 (Talent-Tier).

### Persona 6 — Lena, 52, frustrierte HR-Managerin
**"Geborene Chefin, will selber was übernehmen."** Eine von Cyrils 500'000 frustrierten CH-Mitarbeitern. Budget für CHF 24/Jahr passt. Würde sonst nie auf MAX gehen.
→ Phase-2-Feature P2.2 Talent-Tier.

---

## 📊 FORTSCHRITT (Stand 30.04.2026)

| Phase | Items | Status |
|---|---|---|
| **Status Quo** (Fundament + V/K/A-Bereiche + Lead-Magnete + Backend) | ~75 reale Tasks | ✅ alles live |
| **Phase 1** (Public-Launch-Readiness) | 12 Items | ⏳ 0/12 |
| **Phase 2** (Growth) | 14 Items | ⏳ 0/14 |
| **Phase 3** (Money Machine, Vision) | 3 Säulen | 💭 später |

**Realistisch erreichbar bis Public-Launch:** 4-6 Wochen mit Agent-Teams parallel.

---

## 🛑 REGELN (kondensiert)

1. **Tiefe > Breite.** Lieber ein Feature perfekt als zwei halb.
2. **Immer deployen** am Ende (`vercel --prod --yes` + Alias setzen).
3. **Immer verifizieren** im Chrome auf passare-ch.vercel.app nach Deploy.
4. **MASTER_PLAN.md aktualisieren** (Status-Marker setzen).
5. **Design-System respektieren** (siehe `docs/DESIGN_SYSTEM.md`).
6. **Geschäftsmodell befolgen** (Self-Service, 0% Provision, 3 Käufer-Tiers).
7. **Keine Broker-Features bis Phase 2** (aber `is_broker`-Flag in DB ist OK).
8. **RLS-first** auf jeder neuen Tabelle.
9. **Rollen-Naming strikt:** `verkaeufer` + `kaeufer` (transliteriert).
10. **Sicherheit nicht verschieben:** Phase 1 hat MFA + Bot-Schutz + CAPTCHA als HARTE Gates vor Launch.
11. **Rechtssicherheit nicht verschieben:** MwSt + Rechnungsnummern + AGB-Versionierung + Consent-Records vor Launch.
12. **Testing als Gate:** Keine Phase-2-Etappe ist „fertig" ohne E2E-Test.
13. **NDA optional, nicht Pflicht** für Erstkontakt.

---

*Letzte Aktualisierung: 30.04.2026 — Plan komplett überarbeitet nach Code-Audit + Sprachmemo-Integration. Alte Version: `MASTER_PLAN_ARCHIV_2026-04-30.md`.*
