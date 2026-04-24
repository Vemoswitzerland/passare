# passare.ch — GAP-ANALYSE

> Stand: 24.04.2026 · Review von `MASTER_PLAN.md`, `CLAUDE.md`, `INFRASTRUCTURE.md`, `COMPETITOR_RESEARCH.md`
> Ziel: companymarket.ch vollständig ablösen — aber lückenlos, konsistent und rechtssicher.

---

## 🚨 TEIL 1 — KRITISCHE INKONSISTENZEN (SOFORT FIXEN)

Diese Widersprüche sind **hart blockierend** — zwei Dokumente sagen etwas Unterschiedliches, das muss zuerst einheitlich werden.

### 1.1 Käufer-Pricing widerspricht sich
- `MASTER_PLAN.md` Z.25 + `INFRASTRUCTURE.md` Z.14 + `CLAUDE.md` Z.54–55: **nur 2 Tiers** (Basic CHF 0 / MAX CHF 199)
- `CLAUDE.md` Z.199: **3 Tiers** ("CHF 0 / CHF 49/M / CHF 199/M")
→ Entscheide dich. Entweder 2 Tiers (klarer, einfacher) oder 3 Tiers (mehr Revenue, komplexer). Ich empfehle **2 Tiers für V1**, Pro-Mittelweg ist Ballast vor dem Product-Market-Fit.

### 1.2 Rollen-Naming inkonsistent
- `INFRASTRUCTURE.md` Z.70: `rolle enum: verkaufer | kaeufer | admin`
- `CLAUDE.md` Z.87: `/dashboard/verkaufer` (ohne `e`)
- `CLAUDE.md` Z.88: `/dashboard/kaeufer` (mit `e`)
→ Mische nicht Transliteration. Nimm konsequent **`verkaeufer` + `kaeufer`** (sauber) oder `verkaufer` + `kaufer` (hässlich). Empfehlung: überall `verkaeufer`/`kaeufer`.

### 1.3 Duplikate in Etappen
- Etappe 44 = Etappe 115: **Trust-Center Page** (doppelt, lösche eine)
- Etappe 88 (Newsletter-Sender) vs. Etappe 101 (Newsletter-Builder): das ist dasselbe Feature in zwei Blöcken. Zusammenlegen oder sauber abgrenzen (z.B. 88 = Versand-Logik, 101 = Template-Editor).

### 1.4 `profile.max_active` existiert nicht im Schema
- `INFRASTRUCTURE.md` Z.290: `profile.max_active=true` nach Subscription-Webhook
- Aber `profiles`-Tabelle Z.68–74 hat kein `max_active`-Feld
→ Entweder Feld hinzufügen ODER aus `subscriptions` via View/Function ableiten. Empfehlung: **View `v_user_entitlements`** mit aktuellen Berechtigungen (besser als denormalisierte Flags).

### 1.5 `inserate.status` nach Zahlung — undefiniert
- `INFRASTRUCTURE.md` Z.280: "status='in_review' (Admin-Moderation) **oder** direkt 'published'"
→ Entscheide. Empfehlung V1: **immer `in_review`** nach Zahlung. Später Auto-Publish für verifizierte Wiederkehrer.

### 1.6 Typo
- `CLAUDE.md` Z.201: "Vierprachigkeit" → "Viersprachigkeit"

### 1.7 "3+3" vs "3+2"
- Dein Chat-Text spricht von "Verkäufer 3 + Käufer 3" — tatsächlich sind es 3+2 (Basic gratis + MAX). Klarstellen (oder eben Pro-Tier wieder rein — siehe 1.1).

---

## 🔒 TEIL 2 — LAUNCH-BLOCKER (MUSS VOR V1 REIN)

Ohne diese kann passare.ch **nicht rechtssicher oder sicher live gehen**.

### 2.1 Schweizer MwSt (8.1 %) nirgends modelliert
- Stripe-Checkout muss MwSt korrekt ausweisen
- Rechnungen (Etappe 79) brauchen MwSt-Zeile + UID
- Tabelle `zahlungen` fehlt Feld `amount_net`, `vat_rate`, `vat_amount`, `invoice_number`
→ **Neue Etappe:** "MwSt + CH-konforme Rechnungsnummerierung"

### 2.2 Rate-Limiting & Bot-Schutz
- Weder in Master-Plan noch Infra erwähnt
- Kontaktformulare, Login, Registrierung, NDA-Requests sind alle Brute-Force-Ziele
→ **Neue Etappe:** Upstash Ratelimit + hCaptcha/Turnstile auf allen Formularen

### 2.3 Virus-Scan für Uploads
- Datenraum nimmt PDFs entgegen (Etappe 71)
- Keine ClamAV/VirusTotal-Integration geplant
→ Pflicht für Datenraum + Nachrichten-Anhänge

### 2.4 DSGVO-konkret, nicht nur als Etappen-Titel
- Etappe 116 sagt nur "Datenauskunft + Export + Löschung"
- Es fehlt: konkreter User-Facing Self-Service-Flow, Consent-Records-Tabelle, Verarbeitungsverzeichnis, DPA-Vorlage für B2B-Käufer
→ Etappe 116 aufsplitten in 3 Unter-Etappen

### 2.5 AGB-Versionierung
- User müssen neue AGB-Version aktiv akzeptieren
- Tabelle `terms_acceptances` fehlt: `user_id`, `version`, `accepted_at`, `ip`

### 2.6 Anonymitäts-Check beim Inserat
- Kernversprechen deines Modells: Verkäufer **anonym** bis NDA
- Es gibt keine Logik die prüft, ob Titel/Teaser/Bilder/Beschreibung die Firma verraten
→ Admin-Moderation-Queue (Etappe 82) braucht Checkliste + optional LLM-Prüfung: "Nennt dieser Text den Firmennamen?"

### 2.7 Impersonation / "Login as user"
- Admin-Support kann Probleme sonst nicht reproduzieren
- Muss aber gelogged werden (Audit-Trail)
→ In Etappe 83 ergänzen

### 2.8 4-Eyes-Prinzip für kritische Admin-Aktionen
- Inserat löschen, User permanent sperren, Refund ausstellen
- Aktuell: 1 Admin = kann alles. Compliance-Risiko.
→ In Etappe 81 als Option vorsehen, später Pflicht

### 2.9 Stripe-Webhooks: Idempotenz + Retry
- `INFRASTRUCTURE.md` beschreibt Webhooks nur Happy-Path
- Was passiert bei doppeltem Webhook? Failed Payment? Chargeback?
→ Etappe 78 muss explizit Idempotency-Keys + Chargeback-Handling + Refund-Flow enthalten

### 2.10 Monetäre Limits / Sanity-Checks
- Was wenn jemand `kaufpreis_exakt = 999'999'999'999` eintippt?
- Was wenn `ebitda_marge = -500%`?
→ Zod-Schemas mit Ranges, nicht nur Types

### 2.11 Zefix-Integration: Missing Contract
- Etappe 49 nennt "Zefix" beiläufig
- Aber kein Flow beschrieben: Was bei Firma-nicht-gefunden? Autopopulation welcher Felder? Rate-Limits der Zefix-API?
→ Eigenständig dokumentieren

### 2.12 E-Mail-Deliverability
- Resend ist gut, aber es fehlen: SPF/DKIM/DMARC-Config, Bounce-Handling, Suppression-List, Warm-Up-Plan
- Ohne Suppression-List: ein User meldet Spam → ganze Domain leidet

### 2.13 Testing — komplett abwesend
Im Master-Plan gibt es **keine einzige Test-Etappe**. Kein Unit-Test, kein E2E-Test, kein Lighthouse-CI als Gate, keine Migration-Smoke-Tests.
→ Mindestens 2 Etappen: "E2E mit Playwright für Critical Paths" + "Migration-Test-Pipeline"

### 2.14 Backup-Restore-Drill
- "Daily Backups" ist kein Backup-Plan, sondern ein Feature
- Es fehlt: einmal pro Monat Restore-Test auf Staging, sonst hat man kein Backup sondern nur Hoffnung

### 2.15 Staging-Umgebung
- Nur "beta" existiert
- Staging ≠ Prod-mit-Beta-Gate. Du brauchst ein 2. Supabase-Projekt + 2. Vercel-Projekt für gefährliche Migrations

---

## 🧩 TEIL 3 — FEATURE-LÜCKEN GEGENÜBER COMPANYMARKET.CH

### 3.1 Response-Rate & Antwortzeit (Airbnb-Style)
- companymarket hat das nicht — aber: es ist **das** Signal für Käufer-Trust
- "Reagiert meistens innerhalb 24h" Badge pro Verkäufer
- Braucht: `profiles.avg_response_time_hours`, auto-berechnet

### 3.2 Verkäufer-Qualitätsscore
- Vollständigkeit Inserat, Bilder, Finanzdaten, EBITDA, Datenraum = Score 0–100
- Zeigt Käufern "Premium-Verkäufer", motiviert Verkäufer zur Vervollständigung
- Ist ein zusätzlicher USP gegenüber companymarket (keine Qualitätssignale)

### 3.3 Vergleichstool für Käufer
- Käufer wählt 2–3 Inserate → nebeneinander
- Killer-Feature das companymarket nicht hat

### 3.4 Favoriten-Organisation
- Aktuell nur Watchlist-Liste + Notiz
- Müsste: Tags, Ordner, Status-Tracking ("Kontaktiert", "NDA", "DD", "Abgelehnt")

### 3.5 Team-Accounts für Käufer
- Family-Offices, Investoren, Broker-Suchende: Mehrere Personen teilen einen MAX-Account
- Aktuell kein Seats-Modell

### 3.6 Broker-als-Käufer-Case
- `CLAUDE.md` Z.63: "Broker können sich als Käufer registrieren (MAX-Abo)"
- Aber: Broker haben andere Bedürfnisse als Endkäufer (multi-client-management, CRM-Light)
- Selbst wenn Phase 2 kommt: im Datenmodell **jetzt schon** vorsehen (`profiles.is_broker bool`), damit keine Migration nötig ist

### 3.7 Certification-Badge Äquivalent zu CHDU
- companymarket hat "CHDU" (Certified Advisor) in Experten-Directory
- Für Launch: simples "passare Verified Broker" mit manueller Freigabe durch Admin reicht

### 3.8 Partnerschaften sichtbar
- companymarket zeigt Swiss Life + Hypo Lenzburg prominent → Trust
- Entsprechendes für passare: UBS? Raiffeisen? Treuhand-Verband?
- Mindestens Placeholder-Block + Etappe für Partner-Onboarding

### 3.9 Bewertungen untereinander
- Verkäufer bewertet Käufer, Käufer bewertet Verkäufer (kommunikations-qualität)
- Braucht: `bewertungen` Tabelle, Anti-Retaliation-Logik (beidseitig, blind)

### 3.10 Podcasts/Videos
- companymarket hat 7-Step-Workshop-Videos + Podcast
- Deine Etappe 109 ist "Podcast/Videos embedded" — aber kein Content-Plan wer die Videos produziert

---

## 🛠️ TEIL 4 — FEHLENDE ETAPPEN / ZU OBERFLÄCHLICHE ETAPPEN

### Auth (Block A)
- **Fehlt:** Magic-Link-Login alleine reicht nicht — du brauchst auch Google/Apple/LinkedIn SSO (v.a. LinkedIn für Käufer-Seriosität)
- **Fehlt:** MFA/TOTP ist nur "später" in Infra — für Admin-Rolle muss es von Tag 1 Pflicht sein
- **Fehlt:** Session-Revoke (User sieht alle aktiven Sessions, kann einzelne killen)
- **Fehlt:** Device-Trust ("Neuer Login aus unbekanntem Land")

### Datenmodell (Block B)
- **Fehlt:** `terms_acceptances` (AGB-Versionierung)
- **Fehlt:** `consent_records` (DSGVO-Zustimmungen: Newsletter, Analytics, Marketing)
- **Fehlt:** `notifications` Tabelle (In-App Notif-Center, nicht erst Etappe 105)
- **Fehlt:** `bewertungen` (Peer-Reviews)
- **Fehlt:** `invoices` separat von `zahlungen` (Rechnungs-PDFs, Rechnungsnummern, Storno-Rechnungen)
- **Fehlt:** `tags` + `user_tags` (Admin tagged User intern: "Whale", "Problematisch", "Tester")
- **Fehlt:** `admin_notes` (interne Notizen pro User ohne dass der User es sieht)
- **Fehlt:** `api_keys` (für Etappe 132 — Public Valuation API)

### Verkäufer-Dashboard (Block D)
- **Fehlt:** Inserat-**Vorschau** vor Publish (wie sehen Käufer das?)
- **Fehlt:** Inserat-**Auto-Save** während Wizard (User schliesst Tab → Daten weg)
- **Fehlt:** Inserat-**Duplizieren** (Multi-Standort-Betriebe)
- **Fehlt:** **Blocklist** pro Inserat (User A darf niemals anfragen)
- **Fehlt:** **Statistik-Export** PDF/CSV
- **Fehlt:** **Onboarding-Checklist** ("Noch 3 Schritte bis live")

### Käufer-Dashboard (Block E)
- **Fehlt:** **Anonyme Suchprofile** (Käufer scannt den Markt ohne dass Verkäufer ihn sehen)
- **Fehlt:** **Due-Diligence-Notizen pro File** im Datenraum (privat)
- **Fehlt:** **Favoriten-Stages** (nicht nur flache Liste, sondern Pipeline)
- **Fehlt:** **Auto-Match-Score** sichtbar auf jedem Inserat für eingeloggte Käufer

### Messaging (Block F)
- **Fehlt:** Typing-Indicator + Read-Receipts (moderne Erwartung)
- **Fehlt:** Anhang-Size-Limit + Virus-Scan
- **Fehlt:** Push-Notifications (Web Push, später Mobile)
- **Fehlt:** Abwesenheits-Responder (Verkäufer: "Ich bin bis 15.5. im Urlaub")
- **Fehlt:** Auto-Translation zwischen Käufer/Verkäufer-Sprache

### Datenraum (Block G)
- **Fehlt:** Ordner-Struktur + Ordner-Templates
- **Fehlt:** Datei-Versionierung
- **Fehlt:** Expiring Links
- **Fehlt:** View-Only-Mode (kein Download)
- **Fehlt:** OCR-Durchsuchbarkeit
- **Fehlt:** NDA-gebunden-ausklappbare Bereiche (nicht nur "alles oder nichts")

### Payments (Block H)
- **Fehlt:** **Refund-Flow** (Stornorechnung, Rückbuchung)
- **Fehlt:** **Dunning** bei Abo-Payment-Failed (3 Retry-Versuche, dann Access-Revoke)
- **Fehlt:** **Twint** (CH-Marktstandard, viel Konversion)
- **Fehlt:** **Kreditkarten-Speichern** für Verlängerung-1-Klick
- **Fehlt:** **MwSt korrekt** (siehe 2.1)
- **Fehlt:** **Promo-Codes / Gutscheine** (Launch-Marketing)

### Admin (Block I)
- **Fehlt:** Login-Attempts-Monitoring
- **Fehlt:** System-Errors-Viewer mit Sentry-Integration
- **Fehlt:** Revenue-Forecasting, Churn-Analyse, Cohort-Analyse
- **Fehlt:** Mass-E-Mail-Versand mit Segment-Filter (Etappe 88 ist vage)
- **Fehlt:** User-Impersonation (Support)
- **Fehlt:** Review-Queue für Verkäufer-Bewertungen
- **Fehlt:** A/B-Test-Dashboard (eng verzahnt mit Feature-Flags)

### SEO (Block J)
- **Fehlt:** JSON-LD für `Product` / `BusinessForSale` Schema
- **Fehlt:** Canonical-Strategy für Sprach-Duplikate + hreflang-Matrix explizit
- **Fehlt:** Pagination-rel-prev/next für Marketplace
- **Fehlt:** robots.txt + sitemap.xml **pro Sprache** nicht nur global
- **Fehlt:** Image-Alt-Text mehrsprachig auto

### Marketing (Block K)
- **Fehlt:** UTM-Parameter-Tracking in DB (`zahlungen.source_utm`)
- **Fehlt:** Meta/LinkedIn Conversions-API Server-Side (Ads-ROI-Messung)
- **Fehlt:** Drip-Campaigns (Verkäufer: 7-Tage-Onboarding-Serie)
- **Fehlt:** NPS-Survey (in-App nach 30 Tagen)

### Trust/Compliance (Block L)
- **Fehlt:** CH-spezifische Cookie-Compliance (FADP, nicht nur DSGVO)
- **Fehlt:** Incident-Response-Plan für Datenleck
- **Fehlt:** SLA-Definition (Uptime-Garantie für MAX-Käufer?)

### I18n (Block M)
- **Fehlt:** Rhaeto-Romanisch (RM) — Landessprache der Schweiz!
- **Fehlt:** Währungs-Anzeige wenn FR/IT-Region: trotzdem CHF, aber Format anders
- **Fehlt:** CH-vs-DE Deutsch Unterscheidung? (ss vs ß)

### Advanced (Block N)
- **Fehlt:** Webhook-System für Broker (später): passare schickt Events an deren CRM
- **Fehlt:** Public API mit Authentication (Etappe 132 zu vage)

---

## 🔄 TEIL 5 — REIHENFOLGE-KRITIK

Einige Etappen sind **zu spät** oder **zu früh** geplant:

| Etappe | Problem | Empfehlung |
|---|---|---|
| 9 (Analytics) | Zu früh — ohne Traffic uselss | nach Etappe 26 |
| 15 (Messaging DB) → 66 (Messaging UI) | 51 Etappen Lücke, aber Messaging braucht man fast sofort | UI nach Etappe 25 |
| 105 (Notification-Center) | Zu spät — User fragen "wo sehe ich meine Anfragen" | nach Etappe 15 |
| 82 (Moderation-Queue) | Muss parallel zu Etappe 52 (Inserat-Publish) laufen, sonst kommt 1 Inserat durch Admin-less | zeitgleich |
| 117 (WCAG 2.1 AA) | Zu spät | parallel, nicht Nachgelagert |
| 68 (NDA-eSign) | Skribble-Integration (Etappe 138) ist viel weiter hinten geplant, aber NDA-Signatur braucht genau das | Etappe 138 vor 68 ziehen oder NDA nur mit Basis-Signatur und Skribble später upgraden |
| 111 (Telefon-Verifikation) | Zu spät — sollte Teil des Verkäufer-Onboardings sein | Block D |

---

## 🎯 TEIL 6 — KONKRETE PRIORISIERUNGS-EMPFEHLUNG

Wenn du companymarket.ch **wirklich ablösen** willst, hat dein Plan zu viele "nice to have"-Etappen im Weg. Reorganisiere wie folgt:

### Phase 1 — MVP (Etappen 1–40 komprimiert)
Ziel: **live in 8 Wochen**, rechtssicher, Grundfunktionen.
- Auth + Rollen + Onboarding
- Inserat-Wizard + Public-Detail
- Zahlungen (3 Pakete) + MwSt + Rechnung
- Messaging + NDA (Basic)
- Admin-Kern (Moderation, User, Payments)
- i18n DE+FR
- Rate-Limit, Bot-Schutz, Virus-Scan
- DSGVO-Self-Service
- Test-Suite + Staging

### Phase 2 — Marktführer-Features (danach, 3 Monate)
- Datenraum (echter), KI-Matching, Reverse-Listings
- Bewertungstool (Multiples), Finanzierungsrechner
- SEO-Landingpages 18×26
- Käufer MAX-Abo launchen
- IT+EN Übersetzungen

### Phase 3 — Scale (nach ersten CHF 100k Revenue)
- Broker-Produkt
- Public Valuation API
- Partner-Integrationen (Banken, Treuhand)
- White-Label

---

## 📊 TEIL 7 — ZUSAMMENFASSUNG NACH AMPELFARBE

| Bereich | Status |
|---|---|
| Geschäftsmodell | 🟢 Klar definiert |
| Datenbank-Grundgerüst | 🟢 Solide |
| Admin-Dashboard Anforderung | 🟡 Gut gedacht, aber Detailtiefe fehlt |
| Käufer-Pricing-Konsistenz | 🔴 Widersprüchlich (Tier-Anzahl) |
| Rechtssicherheit (MwSt, DSGVO, AGB) | 🔴 Grosse Lücken |
| Security (Rate-Limit, Virus-Scan, 2FA) | 🔴 Kaum adressiert |
| Testing / QA | 🔴 Komplett fehlend |
| SEO-Plan | 🟡 Ansätze da, Details fehlen |
| i18n | 🟡 4 Sprachen, aber kein RM + CH-DE-Nuance |
| Payment-Flows | 🟡 Happy-Path OK, Edge-Cases fehlen |
| Wettbewerbsvorteil-Features | 🟢 EBITDA, Datenraum, Messaging — stark |
| Content/Marketing-Infrastruktur | 🟡 Nur Titel, keine Logik |
| Broker-Roadmap | 🟢 Bewusst Phase 2 |

---

## 🧾 TEIL 8 — 15 EMPFOHLENE NEUE ETAPPEN

Diese fehlen bislang komplett und sollten eingeschoben werden:

1. **A1 MwSt + Rechnungsnummerierung** (zwischen Etappe 21 und 22)
2. **A2 Rate-Limiting + Bot-Schutz** (direkt nach Etappe 3)
3. **A3 Virus-Scan Pipeline** (vor Etappe 71)
4. **A4 Test-Suite & CI-Gates** (parallel ab Etappe 2)
5. **A5 Staging-Umgebung** (parallel Etappe 1)
6. **B1 Consent & Terms Tables** (in Block B)
7. **B2 Notifications-System** (frühzeitig, nicht Block K)
8. **D1 Inserat-Anonymitäts-Audit** (Admin + LLM, Block I)
9. **D2 Inserat-Preview + Auto-Save** (Block D)
10. **E1 Käufer-Pipeline/Stages** (Block E)
11. **F1 Push-Notifications** (Block F)
12. **G1 Ordner-Struktur + Versionierung Datenraum** (Block G)
13. **H1 Refund + Dunning + Twint** (Block H)
14. **I1 Impersonation + 4-Eyes** (Block I)
15. **L1 CH-FADP + Incident-Response** (Block L)

---

*Review erstellt: 24.04.2026 · Audit-Basis: MASTER_PLAN v1 (160 Etappen) + Support-Docs*
