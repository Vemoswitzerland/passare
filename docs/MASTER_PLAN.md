# passare.ch — MASTER PLAN

> **Der vollständige, etappenweise Aufbau des Schweizer Firmen-Verkaufsportals.**
> Jede Etappe ist eine eigene Chat-Session. Jede wird **enorm tief** implementiert —
> niemals oberflächlich. Jede Etappe endet mit einem **Deploy auf Vercel** und einer
> **Verifikation auf passare.ch** im Chrome-Browser.

---

## 📖 Wie dieser Plan zu lesen ist

- **Blöcke** (A–Z) sind grobe Themen.
- **Etappen** (1, 2, 3…) sind atomare Umsetzungsschritte einer einzelnen Chat-Session.
- Jede Etappe hat:
  - **Ziel** (was am Ende live sein muss)
  - **Umfang** (welche Dateien, Routes, DB-Änderungen)
  - **Abhängigkeiten** (welche Etappen vorher fertig sein müssen)
  - **Erledigt** (✓ sobald live auf passare.ch)
  - **Verifikation** (wie man prüft dass es funktioniert)

Die Reihenfolge ist zwingend, ausser explizit anders vermerkt.

---

## 🏗️ BLOCK A — FUNDAMENT & INFRASTRUKTUR (Etappen 1–10)

### Etappe 1 — Repo, Scaffold, Beta-Gate, Deploy ✓ [LIVE]
**Ziel:** Leere `passare.ch` Domain auf Vercel mit Beta-Gate (Code-Eingabe) und Landingpage.
**Dateien:** `package.json`, `next.config.js`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/beta/page.tsx`, `src/app/api/beta/route.ts`, `src/middleware.ts`.
**DB:** Keine.
**ENV:** `BETA_ACCESS_CODE`, `BETA_GATE_ENABLED`.
**Verifikation:** passare.ch öffnen → Redirect auf /beta → Code `passare2026` eingeben → Homepage sichtbar.

### Etappe 2 — Supabase Projekt + Core Migrations
**Ziel:** Supabase-Projekt verbunden, `profiles` Tabelle mit Rollen (verkaufer/kaeufer/broker/admin), RLS aktiv, Trigger für `auth.users → profiles`.
**Tabellen:** `profiles`, `user_roles` (enum).
**Verifikation:** Supabase SQL Editor zeigt Tabellen, Vercel-Build grün.

### Etappe 3 — Auth: Login + Register + Email-Verify + Callback
**Ziel:** Komplette Auth-Flows live. Magic-Link + Passwort.
**Routen:** `/auth/login`, `/auth/register`, `/auth/callback`, `/auth/check-email`, `/auth/reset`, `/auth/reset/[token]`.
**Verifikation:** Registrierung → Bestätigungs-Mail im Resend-Log → Link klick → eingeloggt.

### Etappe 4 — Rollenwahl-Onboarding + Profile-Setup
**Ziel:** Nach Register: 3-Step Rollenwahl + Basis-Profil (Name, Kanton, Telefon optional).
**Routen:** `/onboarding/rolle`, `/onboarding/profil`, `/onboarding/interessen`.

### Etappe 5 — Design System + shadcn-kompatible Basiskomponenten
**Ziel:** `Button`, `Input`, `Label`, `Card`, `Badge`, `Tabs`, `Dialog`, `Sheet`, `Toast` in einheitlicher Passare-Optik.
**Dateien:** `src/components/ui/*`.

### Etappe 6 — Layout: Nav + Footer + Mobile-Menu
**Ziel:** Responsive Header mit Auth-State, Sprachwechsel, Dashboard-Link. Footer mit allen Links.
**Komponenten:** `Nav`, `NavMobile`, `Footer`, `LanguageSwitcher`.

### Etappe 7 — i18n-Setup (next-intl) DE/FR/IT/EN
**Ziel:** `/de`, `/fr`, `/it`, `/en` Routing, Übersetzungs-JSONs, Language-Cookie, hreflang-Tags.
**Abhängigkeit:** Etappe 6 (Nav muss Switcher haben).

### Etappe 8 — Design System Erweitert: Forms, Validation, Toasts
**Ziel:** `FormField` mit react-hook-form + Zod, Error-Display, Success-Toasts via Sonner.

### Etappe 9 — Analytics + Monitoring Setup
**Ziel:** Plausible für öffentliche Site-Views, Sentry für Errors, Vercel Analytics.
**ENV:** `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `SENTRY_DSN`.

### Etappe 10 — Feature-Flags System (intern, DB-basiert)
**Ziel:** `feature_flags` Tabelle + Admin-Toggle → erlaubt z.B. «Bewertungstool public» an/aus.

---

## 🗄️ BLOCK B — KERN-DATENMODELLE (Etappen 11–25)

### Etappe 11 — `inserate` Tabelle + RLS
**Felder:** id, slug, status, owner_id, titel, teaser, beschreibung, branche_id, kanton_code, umsatz_range, ebitda_range, ebitda_marge, mitarbeitende, gruendungsjahr, kaufpreis, kaufpreis_vhb, plan, views, featured_until, created_at, updated_at, published_at, expires_at.
**RLS:** owner sieht eigene; public sieht nur status='published'.

### Etappe 12 — `inserate_media` + Supabase Storage Bucket
**Ziel:** Bilder + Dokumente pro Inserat, öffentlich signierte URLs für Teaser, private für Datenraum.

### Etappe 13 — Reference Tables: `branchen`, `rechtsformen`, `kantone`, `waehrungen`
**Ziel:** Stammdaten mit DE/FR/IT/EN Labels. Seed-Migration mit allen 26 Kantonen, 40 Branchen, 12 Rechtsformen.

### Etappe 14 — `kategorien` (hierarchisch) + Tags
**Ziel:** Baumstruktur (Hauptkategorie → Unterkategorie → Detail), z.B. Dienstleistung → IT → SaaS.

### Etappe 15 — `anfragen` + `nachrichten` (Messaging-Threads)
**Ziel:** Käufer stellt Anfrage → Thread pro Inserat×Käufer → beide Parteien können antworten.

### Etappe 16 — `favoriten` (Watchlist)
**Ziel:** Käufer markiert Inserat als Favorit. `favoriten(user_id, inserat_id, created_at)`.

### Etappe 17 — `gespeicherte_suchen` + Alert-Regel
**Ziel:** Käufer speichert Suchkriterien (JSON) + `alert_frequency` (never/daily/weekly).

### Etappe 18 — `nda_requests` + eSign-Prozess
**Ziel:** Käufer fordert NDA → Template wird generiert → eSign-Klick (IP+Timestamp) → nach Verkäufer-Approval Datenraum freigeschaltet.

### Etappe 19 — `datenraum_files` + Access-Permissions
**Ziel:** File-Verweis mit `inserat_id`, `kategorie`, `watermark_on`, Download-Log.

### Etappe 20 — `broker_profile` + Badges
**Ziel:** Verifizierter Broker hat Profil mit Bio, Spezialgebieten, Referenzen, verifizierten Mandaten.

### Etappe 21 — `kaeufer_profile` (öffentliche Suchprofile)
**Ziel:** Käufer kann «Ich suche…»-Profil öffentlich listen (Kriterien, Budget, Region, Branche).

### Etappe 22 — `zahlungen` (Stripe)
**Ziel:** Jede Transaktion in Postgres gespiegelt mit `stripe_id`, `status`, `amount`, `plan_code`.

### Etappe 23 — `subscriptions` (für Broker-Abos, Käufer-Premium)
**Ziel:** Laufzeit-Abos mit Renewal-Logik.

### Etappe 24 — `newsletter_abonnenten` + Segmente
**Ziel:** E-Mail-Listen nach Branche / Kanton / Rolle + Double-Opt-In.

### Etappe 25 — `events_log` (Audit-Trail, DSGVO)
**Ziel:** Jede sensible Aktion (Login, Datenraum-Zugriff, NDA, Zahlung) wird mit user_id + ip + ua geloggt.

---

## 🌐 BLOCK C — ÖFFENTLICHE SEITEN (Etappen 26–45)

### Etappe 26 — Homepage v2 (Hero + Value Prop)
**Ziel:** Elegante Full-Screen Hero mit Video/Animation, dreiteiliger Value-Prop (Verkaufen / Kaufen / Bewerten).

### Etappe 27 — Homepage Feature-Sections
**Ziel:** «Wie es funktioniert», «Warum passare», «Erfolgsgeschichten», «Unsere Zahlen».

### Etappe 28 — Homepage Trust + Newsletter
**Ziel:** Logos von Partnern/Brokern, Presse, Newsletter-CTA mit Lead-Magnet (Whitepaper).

### Etappe 29 — Inserate-Liste: Grid + Sidebar-Filter (14+ Kriterien)
**Ziel:** Branche, Kanton, Umsatz, EBITDA, Preis, Mitarbeiter, Alter, Rechtsform, Nachfolge-Grund, Plan, Featured-Only, Text-Suche, Sort.

### Etappe 30 — Inserate-Detail v1 (Anonymisiert, Teaser)
**Ziel:** Öffentliche Sicht: Teaser-Titel, anonyme Kennzahlen-Range, Bilder ohne sensitive Daten, «NDA anfragen»-CTA.

### Etappe 31 — Inserate-Detail v2 (nach NDA, Vollsicht)
**Ziel:** Nach akzeptierter NDA: echter Firmenname, exakte Zahlen, Datenraum-Link.

### Etappe 32 — Inserate Foto-Gallery + Location-Map
**Ziel:** Lightbox, Lazy-Load, Leaflet-Karte mit ungefährer Position (Kanton-Mitte).

### Etappe 33 — Inserate: Ähnliche Inserate + SEO-Related
**Ziel:** «Ähnliche Angebote» Block unten, basierend auf Branche × Preisrange × Region.

### Etappe 34 — Atlas v2: Karte CH + Filter + Drawer
**Ziel:** Bundesweite Karte mit Firmen aus Zefix, Filter für Branche/Rechtsform/Alter, Click → Drawer mit Firma.

### Etappe 35 — Atlas Nachfolge-Radar (Firmen mit hohem Übergabe-Risiko)
**Ziel:** Score basierend auf Alter Firma, Alter Inhaber (geschätzt), Branche → Heatmap.

### Etappe 36 — Käufer-Suchprofile (öffentliche Liste)
**Ziel:** Seite mit allen öffentlichen «Ich suche…»-Einträgen, Verkäufer können kontaktieren.

### Etappe 37 — Broker-Verzeichnis (öffentlich)
**Ziel:** Grid mit verifizierten Brokern, Filter nach Kanton/Spezialisierung, Profilseite pro Broker.

### Etappe 38 — Berater-Directory (Treuhänder, M&A, Anwälte)
**Ziel:** Ähnlich Broker-Directory, aber für Berater-Partner.

### Etappe 39 — Öffentliches Bewertungstool (Lead-Magnet!)
**Ziel:** 3-Step Funnel: Branche + Umsatz + EBITDA → Multiples-Wert-Range + Kontakt-Capture.

### Etappe 40 — Finanzierungsrechner (Public)
**Ziel:** Input: Kaufpreis, Eigenkapital → Output: monatliche Rate, benötigte Finanzierung.

### Etappe 41 — KMU-Multiples-Datenbank (quartalsweise aktualisiert)
**Ziel:** Öffentliche Tabelle: Branche × Jahr × Multiple-Range (Quelle: eigene Inserat-Daten).

### Etappe 42 — Blog (Supabase-backed, nicht hardcoded)
**Ziel:** Admin-CMS für Posts, DE/FR/IT/EN, Kategorien, Lesezeit, Related-Posts.

### Etappe 43 — Branche×Kanton Landingpages (SEO)
**Ziel:** `/inserate/branche/[slug]/kanton/[code]` — auto-generiert, SEO-optimiert.

### Etappe 44 — Whitepaper-Downloads (Lead-Capture)
**Ziel:** «Nachfolge-Leitfaden», «Due Diligence Checkliste», «LOI-Muster» → E-Mail-Anmeldung → PDF-Download.

### Etappe 45 — FAQ + Help-Center
**Ziel:** Strukturierte FAQ-DB, Suche, Kategorien (Verkäufer / Käufer / Broker / Allgemein).

---

## 🧑‍💼 BLOCK D — VERKÄUFER-DASHBOARD (Etappen 46–55)

### Etappe 46 — Dashboard-Layout + Rollen-basierte Sidebar
**Ziel:** `/dashboard` mit Sidebar, unterschiedliche Nav-Items je Rolle (verkaufer/kaeufer/broker/admin).

### Etappe 47 — Dashboard Home: Stats-Overview für Verkäufer
**Ziel:** 4 Kacheln: Views, Anfragen, Favoriten, Letzte Aktivität. Chart: Views/Day.

### Etappe 48 — «Meine Inserate» Liste + Actions
**Ziel:** Tabelle aller eigenen Inserate, Bearbeiten/Pausieren/Duplizieren/Löschen, Status-Badges.

### Etappe 49 — Inserat-Wizard Step 1 (Grunddaten + Zefix-Autocomplete)
**Ziel:** Firma aus Zefix laden, Branche, Kanton, Rechtsform, Gründungsjahr.

### Etappe 50 — Inserat-Wizard Step 2 (Finanzen)
**Ziel:** Umsatz-Range, EBITDA-Range, EBITDA-Marge, Mitarbeiter, Kaufpreis/VHB, Übergabe-Grund.

### Etappe 51 — Inserat-Wizard Step 3 (Details + KI-Beschreibung)
**Ziel:** Titel, Teaser, Beschreibung → KI-Generator (Claude) mit Anonymisierungs-Regeln.

### Etappe 52 — Inserat-Wizard Step 4 (Bilder + Paket + Stripe-Checkout)
**Ziel:** Bilder hochladen, Plan wählen (Basic gratis / Standard CHF 290 / Premium CHF 890), Stripe Checkout.

### Etappe 53 — Inserat bearbeiten + Pausieren/Verkauft-setzen
**Ziel:** Alle Wizard-Steps auch nachträglich editierbar, Statuswechsel mit Log.

### Etappe 54 — Interessenten-Liste + Anfrage-Management
**Ziel:** Alle Anfragen zu eigenen Inseraten, Vorfilter, Antworten im Thread.

### Etappe 55 — Inserat-Statistiken (Views, Conversion, Top-Referrer)
**Ziel:** Detaillierte Analytics pro Inserat: Views/Tag, Geräte, Herkunft, Konversion auf Anfrage.

---

## 🛒 BLOCK E — KÄUFER-DASHBOARD (Etappen 56–65)

### Etappe 56 — Käufer Dashboard-Home
**Ziel:** Kacheln: Favoriten, Gespeicherte Suchen mit neuen Matches, offene Anfragen, NDA-Status.

### Etappe 57 — Favoriten verwalten (Watchlist mit Notizen)
**Ziel:** Favoriten-Liste, private Notizen pro Eintrag, Tags, Sortierung.

### Etappe 58 — Gespeicherte Suchen + E-Mail-Alerts
**Ziel:** Suche speichern, Alert-Frequenz wählen, neue Treffer per E-Mail.

### Etappe 59 — Käuferprofil erstellen (öffentlich auswählbar)
**Ziel:** «Ich suche…»-Profil mit Kriterien, Budget, Region; öffentlich oder nur für Broker.

### Etappe 60 — Anfragen-Inbox (Threads)
**Ziel:** Alle laufenden Konversationen mit Verkäufern, Threaded-View, Unread-Badges.

### Etappe 61 — NDA-Management (Request + Status + Signed-PDF)
**Ziel:** «NDA anfragen»-Button pro Inserat → Status-Tracking → Download Signed-PDF.

### Etappe 62 — Datenraum-Zugänge (für Käufer)
**Ziel:** Liste aller Datenräume auf die Zugriff besteht, Dokumentenliste, Download-Log.

### Etappe 63 — Matching-Engine: AI-Vorschläge
**Ziel:** Basierend auf Käuferprofil → Claude/Embedding ranked passende Inserate.

### Etappe 64 — Due-Diligence Checkliste (pro Deal)
**Ziel:** Checkliste mit ~80 Punkten, pro Inserat aktivierbar, Fortschritts-Bar.

### Etappe 65 — Angebote / LOI-Verwaltung
**Ziel:** LOI-Template-Generator, Versand an Verkäufer, Status-Tracking.

---

## 🤝 BLOCK F — BROKER-DASHBOARD (Etappen 66–75)

### Etappe 66 — Broker Dashboard-Home
**Ziel:** Übersicht: Aktive Mandate, Leads, laufende Deals, Commission.

### Etappe 67 — Portfolio: Mehrere Mandate verwalten
**Ziel:** Alle Mandate (Inserate unter eigenem Brand), Bulk-Actions, Kategorisierung.

### Etappe 68 — Lead-CRM mit Tags + Notizen + Team-Kommentare
**Ziel:** Jeder eingehende Lead als Karte, Kanban (Neu / Kontaktiert / NDA / LOI / Closed), Team-Notes.

### Etappe 69 — Provisions- / Commission-Tracking
**Ziel:** Pro Deal geplante vs. realisierte Commission, Rechnungen, Zahlungsstatus.

### Etappe 70 — Öffentliche Broker-Profilseite
**Ziel:** `/broker/[slug]` — Bio, Spezialgebiete, Mandate (optional), Referenzen, Kontakt.

### Etappe 71 — Broker Badge-System (Verified, Premium, Certified)
**Ziel:** Verifikation durch KYC + Referenzen, Badge wird im Profil + Inseraten angezeigt.

### Etappe 72 — White-Label (Inserate unter Broker-Branding)
**Ziel:** Broker kann Inserate mit eigenem Logo/Farben präsentieren auf `/broker/[slug]/mandate`.

### Etappe 73 — Broker-Verifikation (KYC)
**Ziel:** Dokument-Upload (HR-Auszug, Vollmacht), Admin-Review, Approval/Reject.

### Etappe 74 — Team-Funktion (mehrere Broker-Accounts, Shared-Lead-Pool)
**Ziel:** Agentur mit mehreren Mitarbeitern, Rollen (Admin/Member), Lead-Zuweisung.

### Etappe 75 — Deal-Pipeline (Kanban: Interesse → NDA → LOI → DD → Closing)
**Ziel:** Visual Pipeline pro Broker, Drag&Drop zwischen Stages, automatische E-Mails bei Stage-Change.

---

## 💬 BLOCK G — MESSAGING + NDA (Etappen 76–80)

### Etappe 76 — Secure Messaging UI (Inbox + Thread-View)
**Ziel:** Desktop-first Inbox mit Thread-Liste links, Nachrichten rechts, Markdown-Support.

### Etappe 77 — Realtime Chat via Supabase Realtime
**Ziel:** Subscribe auf `nachrichten` Tabelle, Typing-Indicator, Read-Receipts.

### Etappe 78 — NDA Digital Signature
**Ziel:** Klick-to-Sign mit IP + Timestamp + User-Agent, Speicherung in `nda_signatures`.

### Etappe 79 — NDA-Template-System (Admin-editierbar)
**Ziel:** Admin kann NDA-Texte pro Sprache pflegen, Platzhalter für Firmenname/Datum.

### Etappe 80 — E-Mail-Notifications für Messaging
**Ziel:** Bei neuer Nachricht → E-Mail an Empfänger, Digest-Option (täglich/sofort).

---

## 📂 BLOCK H — DATENRAUM (Etappen 81–85)

### Etappe 81 — Datenraum-Upload (Verkäufer-Seite)
**Ziel:** Ordnerstruktur, Drag&Drop, Virus-Scan (ClamAV via Edge-Function), Metadaten.

### Etappe 82 — Access-Control (pro User pro Dokument)
**Ziel:** Matrix-Editor: Welcher Käufer sieht welches Dokument (nach NDA-Approval).

### Etappe 83 — Dynamisches Wasserzeichen auf PDFs
**Ziel:** Beim Download wird PDF mit «Empfänger-Email + Datum» gestempelt.

### Etappe 84 — Audit-Trail (wer hat wann was gesehen/geladen)
**Ziel:** Vollständiges Log pro Datenraum, exportierbar als CSV.

### Etappe 85 — Download-Tracking + Statistiken
**Ziel:** Verkäufer sieht welcher Käufer wie aktiv im Datenraum ist.

---

## 💳 BLOCK I — ZAHLUNGEN (Etappen 86–90)

### Etappe 86 — Stripe Checkout (Light / Pro / Premium)
**Ziel:** Checkout für Inserat-Pakete, Preise konfigurierbar via Stripe.

### Etappe 87 — Stripe Webhooks (payment_intent.succeeded etc.)
**Ziel:** Auto-Aktivierung des Inserats nach erfolgter Zahlung.

### Etappe 88 — Invoice-Generation + PDF-Versand
**Ziel:** Automatische Schweizer Rechnung mit MWST, Versand per Resend.

### Etappe 89 — Subscription-Management (Broker, Käufer-Premium)
**Ziel:** Monatliche/jährliche Abos, Upgrade/Downgrade/Cancel-Flow.

### Etappe 90 — Stripe Connect für Broker (Commission-Payouts)
**Ziel:** Optional: Plattform-Fee bei Broker-Deal, direkte Payout-Struktur.

---

## 🛠️ BLOCK J — ADMIN-PANEL (Etappen 91–100)

### Etappe 91 — Admin-Layout + Auth-Gate (role=admin)
**Ziel:** Separate `/admin` Route, nur für Admins, eigene Nav.

### Etappe 92 — Inserate-Moderation-Queue
**Ziel:** Neue Inserate werden auf `in_review` gesetzt → Admin approved/rejected mit Kommentar.

### Etappe 93 — User-Management (Liste, Rollen, Sperren, KYC)
**Ziel:** Tabelle aller User, Filter, Rollen ändern, Sperren, KYC-Review.

### Etappe 94 — Payment-Overview (alle Transaktionen)
**Ziel:** Tabelle Zahlungen, Umsatz-Reports, Stripe-Disputes.

### Etappe 95 — Report-Generator (GMV, Active Listings, Conversion)
**Ziel:** Dashboard mit KPIs: MRR, neue Inserate/Tag, Conversion-Rate, Churn.

### Etappe 96 — Feature-Flags Admin-UI
**Ziel:** Toggle für alle Feature-Flags, per-User Targeting.

### Etappe 97 — Content-Management (Blog + Landingpages)
**Ziel:** Rich-Text-Editor, Bilder, Publish-Workflow.

### Etappe 98 — Newsletter-Sender (Kampagnen)
**Ziel:** Template-Auswahl, Segment-Auswahl, Versand mit Resend Broadcast.

### Etappe 99 — Support-Ticket-System (für User-Anfragen)
**Ziel:** Inbound via E-Mail + Kontaktformular, Tickets mit Status, Admin-Antwort.

### Etappe 100 — System-Health Dashboard (Errors, Uptime, Queues)
**Ziel:** Sentry-Integration, Cron-Job-Status, DB-Performance-Metrics.

---

## 📝 BLOCK K — CONTENT & SEO (Etappen 101–110)

### Etappe 101 — Blog-Post-Editor mit Preview
**Ziel:** Rich-Text, Markdown, Bilder, Kategorien, Featured-Image.

### Etappe 102 — Blog-Listen + Detail-SEO-optimiert
**Ziel:** JSON-LD Schema.org (Article), Related-Posts, Share-Buttons.

### Etappe 103 — Automatische Branche×Kanton Landingpages
**Ziel:** Dynamische Routen, pro Kombi ~800 Wörter Content, Inserate-Teaser.

### Etappe 104 — Sitemap.xml + Robots.txt (pro Sprache)
**Ziel:** Automatische Sitemap mit allen Inseraten, Blog-Posts, Landingpages.

### Etappe 105 — Schema.org Structured Data (Product, Organization)
**Ziel:** Inserate als `Product`, Broker als `Organization`, Blog als `Article`.

### Etappe 106 — Open-Graph + Twitter Card Generator
**Ziel:** Dynamisch generierte Social-Share-Bilder via `@vercel/og`.

### Etappe 107 — Canonical URLs + hreflang
**Ziel:** Korrekte Canonical pro Sprache, hreflang-Matrix in `<head>`.

### Etappe 108 — SEO-Audit + Lighthouse 100
**Ziel:** Alle Public-Pages erreichen Lighthouse-Perf/SEO/A11y > 95.

### Etappe 109 — SEO-Content für Hauptseiten (manuell verfasst)
**Ziel:** Einzigartige Copy für /, /verkaufen, /kaufen, /bewerten, /atlas, /broker.

### Etappe 110 — Google Business + Bing Webmaster verifiziert
**Ziel:** Domain-Property in Google Search Console + Bing eingetragen.

---

## 📣 BLOCK L — MARKETING & WACHSTUM (Etappen 111–120)

### Etappe 111 — Newsletter-Builder (WYSIWYG)
**Ziel:** Drag&Drop E-Mail-Builder mit passare-Branding.

### Etappe 112 — E-Mail-Kampagnen + A/B-Tests
**Ziel:** Subject-Line-Test, Send-Time-Test, Performance-Tracking.

### Etappe 113 — Referral-Programm (Broker → andere Broker)
**Ziel:** Tracking-Link, Bonus-Credits bei Conversion.

### Etappe 114 — Social-Share Optimizations + Share-Buttons
**Ziel:** LinkedIn/WhatsApp/E-Mail-Share auf allen Inseraten + Blog.

### Etappe 115 — Event-Tracking (PostHog oder Plausible Custom Events)
**Ziel:** Track: Registrierung, Inserat-Publish, Anfrage, NDA-Sign.

### Etappe 116 — Notification-Center (In-App)
**Ziel:** Bell-Icon mit Unread-Count, Feed der letzten Events.

### Etappe 117 — Onboarding-Flows (Welcome-Tour)
**Ziel:** Interactive Tour nach Registrierung, rollenspezifisch.

### Etappe 118 — Empfehlungsprogramm für Verkäufer
**Ziel:** «Lade andere KMU-Inhaber ein» → 1 Monat Pro gratis.

### Etappe 119 — PR-Kit + Pressebereich
**Ziel:** `/presse` mit Boilerplate, Logos, Screenshots, Medienkontakt.

### Etappe 120 — Podcast / Videos (Embedded auf Blog)
**Ziel:** Interviews mit Nachfolge-Experten, Case-Studies, embedded Spotify/YouTube.

---

## 🛡️ BLOCK M — TRUST, QUALITÄT, COMPLIANCE (Etappen 121–130)

### Etappe 121 — Telefon-Verifikation via Twilio (für Verkäufer)
**Ziel:** Vor Inserat-Live: SMS-Code + Rückruf-Option, Verified-Badge.

### Etappe 122 — KYC für Käufer (optional, für NDA-Freischaltung)
**Ziel:** ID-Upload, Admin-Review oder automatisiert (Passbase/Onfido).

### Etappe 123 — Inserat-Verifikations-Badge (nach Phone+KYC)
**Ziel:** Sichtbares Siegel auf verifizierten Inseraten.

### Etappe 124 — Portal-Bewertungen (Verkäufer bewerten Broker etc.)
**Ziel:** 5-Stern-System nach abgeschlossenem Deal.

### Etappe 125 — Trust-Center Page (Security + Datenschutz Highlights)
**Ziel:** `/trust` mit allen Sicherheitsmassnahmen, Zertifikaten.

### Etappe 126 — DSGVO: Datenauskunft + Export + Löschung
**Ziel:** Self-Service in Dashboard: Meine Daten exportieren + Konto löschen.

### Etappe 127 — Cookie-Consent Banner (Privacy-First)
**Ziel:** Minimal, nur technisch notwendige Cookies, Plausible datenschutzfreundlich.

### Etappe 128 — Accessibility (WCAG 2.1 AA)
**Ziel:** Audit mit axe-core, alle Forms tastaturbedienbar, Screenreader-Tests.

### Etappe 129 — Impressum, Datenschutz, AGB — rechtskonform CH
**Ziel:** Von Anwalt geprüft, mit Datenbearbeitungsverzeichnis, FADP-konform.

### Etappe 130 — Security Audit + Penetration Test Checkliste
**Ziel:** OWASP Top 10 geprüft, Bug-Bounty-Kontakt eingerichtet.

---

## 🌍 BLOCK N — I18N VOLLSTÄNDIG (Etappen 131–140)

### Etappe 131 — Alle Strings auf DE extrahiert
**Ziel:** Kein hartcodierter String mehr in Komponenten, alle via `t()`.

### Etappe 132 — FR Übersetzung (professionell)
**Ziel:** FR-Translations komplett, Schweizer FR-Varianten beachtet.

### Etappe 133 — IT Übersetzung
**Ziel:** IT komplett, Tessin-spezifische Begriffe.

### Etappe 134 — EN Übersetzung (für internationale Käufer)
**Ziel:** EN komplett, US- vs. UK-English vereinheitlicht.

### Etappe 135 — Formatierung pro Locale (CHF, Datum, Dezimal)
**Ziel:** 1'000.00 CHF in DE/IT, 1 000,00 CHF in FR, CHF 1,000.00 in EN.

### Etappe 136 — Sprachwechsler mit Persistenz (Cookie)
**Ziel:** User-Choice bleibt über Sessions, URL spiegelt Sprache.

### Etappe 137 — SEO-Sprach-Routing (`/de/`, `/fr/`…)
**Ziel:** Saubere URL-Struktur pro Sprache, default ohne Prefix.

### Etappe 138 — hreflang-Matrix + x-default
**Ziel:** Jede Seite hat alle 4 Sprachvarianten verlinkt.

### Etappe 139 — E-Mail-Templates lokalisiert (4 Sprachen)
**Ziel:** Alle transactional E-Mails in 4 Sprachen via Resend.

### Etappe 140 — CMS-Content mehrsprachig (Blog, FAQ)
**Ziel:** Admin kann jeden Post in 4 Sprachen pflegen, Fallback auf DE.

---

## 🚀 BLOCK O — ADVANCED FEATURES (Etappen 141–150)

### Etappe 141 — KI-Käufer-Matching (Embeddings + pgvector)
**Ziel:** Inserat + Käuferprofil als Embeddings, Cosine-Similarity-Ranking.

### Etappe 142 — Public Company Valuation API (für Partner)
**Ziel:** Rest-API mit API-Keys, Rate-Limiting, Docs.

### Etappe 143 — Banken/Finanzierungs-Integration (Referral-Links)
**Ziel:** Partner-Banken listen, Kreditanfrage mit Vor-Check.

### Etappe 144 — Treuhand-Partner-Portal
**Ziel:** Treuhänder erhält Lead-Feed für seine Region, Bezahlmodell.

### Etappe 145 — Öffentliche API (für Drittanbieter)
**Ziel:** `/api/v1/listings` mit Filter, Auth via API-Key.

### Etappe 146 — PWA + Offline-Capable Dashboard
**Ziel:** Manifest, Service-Worker, offline Read-Only.

### Etappe 147 — Calendar-Integration (Meetings buchen)
**Ziel:** Cal.com oder Calendly embed, pro Broker verfügbar.

### Etappe 148 — Video-Conferencing embedded (Daily.co oder Whereby)
**Ziel:** 1-Click-Meeting aus Thread heraus.

### Etappe 149 — E-Signing mit Skribble (Swiss QES)
**Ziel:** Für LOI + Verträge: Qualified Electronic Signature nach Schweizer Recht.

### Etappe 150 — LOI-Template-Generator (Wizard)
**Ziel:** Käufer-LOI: Preis, Bedingungen, Exclusivity → PDF.

---

## ⚡ BLOCK P — OPTIMIERUNG & PERFORMANCE (Etappen 151–160)

### Etappe 151 — Image-Optimization (Supabase Smart Compression)
### Etappe 152 — Caching-Strategy (Next.js + Supabase RPC + Redis later)
### Etappe 153 — CDN Setup (Vercel Edge + Cloudflare in front?)
### Etappe 154 — Database-Indexes + Query-Analyse
### Etappe 155 — Query-Optimization (N+1 killing)
### Etappe 156 — Lazy-Loading + Dynamic-Imports
### Etappe 157 — Bundle-Size-Optimization (Analyze + Tree-Shake)
### Etappe 158 — Core-Web-Vitals < 2.5s LCP, < 100ms INP
### Etappe 159 — Lighthouse 100 auf allen Hauptseiten
### Etappe 160 — Performance-Monitoring (Real-User-Metrics)

---

## 📅 REIHENFOLGE & PRIORITÄTEN

**Sprint 1 (Must-Have für Beta-Launch):** Etappen 1–15, 26, 29, 30, 46, 48, 49–52, 56, 86, 87, 91, 92.
**Sprint 2 (Public Launch v1):** Etappen 16–25, 27, 28, 31–35, 39, 42, 53–55, 57, 58, 60, 76, 88, 94, 95.
**Sprint 3 (Broker + NDA + Datenraum):** Etappen 18, 19, 20, 61, 62, 66–75, 78–85.
**Sprint 4 (Skalierung + i18n):** Etappen 40, 41, 43, 63, 96, 97, 131–140.
**Sprint 5 (Trust + Advanced):** Etappen 44, 45, 89, 90, 98–100, 121–130, 141–150.

---

## 🛑 REGELN FÜR JEDE ETAPPE

1. **Ein Chat = eine Etappe.** Niemals zwei Etappen in einem Chat.
2. **Tiefe > Breite.** Lieber eine Etappe perfekt als zwei halb.
3. **Immer deployen** am Ende der Etappe. Push auf main = Vercel-Deploy.
4. **Immer verifizieren** im Chrome auf passare.ch nach dem Deploy.
5. **Immer aktualisieren** in diesem MASTER_PLAN.md: ✓ hinter die Etappe.
6. **Immer testen** — zumindest manuell im Browser. Wenn möglich: E2E via Playwright.
7. **Design-System respektieren.** Niemals neue Farben/Fonts einführen ohne Update im Tailwind-Config.
8. **Keine Breaking Changes** ohne Migration-Pfad.
9. **Alle Strings via i18n** sobald i18n-Setup (Etappe 7) live ist.
10. **RLS-first** — jede neue Tabelle kriegt sofort Row-Level-Security.

---

## 📊 FORTSCHRITT

- ✅ Etappe 1 (Repo + Beta-Gate + Deploy) — **LIVE**
- ⏳ Etappe 2 (Supabase-Setup) — **NEXT**
- ⬜ Etappen 3–160 — pending

---

*Letzte Aktualisierung: Etappe 1 live — passare.ch Beta-Gate aktiv.*
