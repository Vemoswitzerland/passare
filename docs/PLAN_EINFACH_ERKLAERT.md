# passare.ch — Was bauen wir? (Einfache Erklärung)

> Stand: 27.04.2026 · Damit du als Nicht-Techniker komplett verstehst was im Plan steht.

---

## 🎯 Was ist passare.ch?

passare ist ein **Marktplatz** auf dem Firmen verkauft und gekauft werden — wie ein Immobilien-Portal, aber für ganze Unternehmen. Wir verbinden Verkäufer und Käufer **direkt** miteinander. Wir nehmen **keine Provision auf den Verkaufspreis** (das ist unser USP, das macht uns einzigartig). Wir verdienen nur an einer **Plattform-Gebühr**.

Es gibt drei Arten von Menschen die passare nutzen:
1. **Verkäufer** — meistens Firmen-Inhaber Ende 50/60 die in Pension gehen wollen und keinen Nachfolger haben
2. **Käufer** — Investoren, andere Firmen, oder Privatpersonen die ein Unternehmen übernehmen wollen
3. **Admin** — wir (das passare-Team) die die Plattform betreuen

---

## 💰 Wie verdienen wir Geld?

### Verkäufer zahlen einmalig pro Inserat:
- **Light:** CHF 290 für 3 Monate (Einsteiger-Paket)
- **Pro:** CHF 890 für 6 Monate (Standard)
- **Premium:** CHF 1'890 für 12 Monate (mit Mehrsprachigkeit + Homepage-Feature)

→ Plus 8.1% Schweizer Mehrwertsteuer.

### Käufer haben zwei Optionen:
- **Basic:** Gratis. Sieht alle öffentlichen Inserate, aber mit Wartezeit und Limits.
- **MAX:** CHF 199/Monat oder CHF 1'990/Jahr. Bekommt 7 Tage Vorsprung, alle Filter, unbegrenzte Anfragen, WhatsApp-Alerts.

### Später (Phase 2):
Berater-Vermittlung mit 20% Provision · Partner-Portal für Banken/Anwälte mit Revenue-Share · Broker-Jahres-Abos.

---

## 🏗️ Was alles im Plan steht (196 Etappen in 16 Blöcken)

Ein **Block** ist ein grobes Thema. Eine **Etappe** ist ein konkreter Bauschritt (1 Etappe = 1 Chat).

### Block A — Fundament & Infrastruktur (Etappen 1–10.1)
Das Fundament: Webseite-Skelett, Beta-Code-Schutz, Datenbank-Setup, Login-System, Bot-Schutz, Zwei-Faktor-Authentisierung für Admin, Test-Umgebung getrennt von Live, automatische Tests in der CI-Pipeline.

### Block B — Datenmodelle (Etappen 11–25.1)
Welche Daten speichern wir wo? Inserate, Bilder, Branchen, Kantone, Anfragen, Nachrichten, NDA-Verträge, Datenraum-Dateien, Käufer-Profile, Zahlungen, Rechnungen, Abonnements, Newsletter, Feature-Flags, Bewertungen, Audit-Logs. Plus AGB-Versionierung und Datenschutz-Einwilligungen.

### Block C — Öffentliche Seiten (Etappen 26–45)
Was jeder ohne Login sieht: Homepage, Inserate-Liste, Inserate-Detail mit anonymem Teaser, Foto-Galerie, Karte der Schweiz mit Firmen-Pins, Bewertungs-Tool (Lead-Magnet!), Verkäuflich-Check, Finanzierungs-Rechner, AI-Chat-Suche, öffentliche Q&A pro Inserat, 468 SEO-Landingpages für jede Branche × Kanton-Kombination, Blog, Ratgeber, FAQ, Datenschutz-Seiten, Cookie-Banner.

### Block D — Verkäufer-Dashboard (Etappen 46–55)
Was Verkäufer im eingeloggten Bereich tun: Dashboard mit Statistiken, Inserate verwalten, Wizard zum Inserat-Erstellen (4 Schritte mit Auto-Save), Anonymitäts-Coach beim Tippen, Buchhaltungs-Import (Bexio/Abacus/Sage), KI-Teaser-Generator, Bilder-Upload mit EXIF-Strip, Bezahlung, Vorschau-Funktion, Anfragen-Inbox mit Qualitäts-Scoring, wöchentlicher Report per Mail, Statistik-Export.

### Block E — Käufer-Dashboard (Etappen 56–65)
Was Käufer tun: Dashboard mit Match-Score auf jedem Inserat, Favoriten-Liste, Tages-Digest morgens 7:00 Uhr, Deal-Pipeline-Kanban, gespeicherte Suchen mit Alerts, Käufer-Profil veröffentlichen (Reverse-Listing), Anfragen-Inbox, NDA-Management, Datenraum-Zugang inkl. Möglichkeit Steuerberater zeitlich begrenzt einzuladen, Matching-Engine, Due-Diligence-Checkliste, LOI-Management. Plus Team-Accounts für Family-Offices.

### Block F — Messaging + NDA (Etappen 66–70)
Sichere In-App-Nachrichten (companymarket hat das nicht — klarer Vorteil!), Echtzeit-Chat, digitale NDA-Signatur, Virus-Scan auf Anhängen.

### Block G — Datenraum (Etappen 71–75.2)
Geschützter Bereich für vertrauliche Dokumente: Drag&Drop-Upload, Virus-Scan, Ordner-Vorlagen pro Branche, Datei-Versionierung, dynamisches PDF-Wasserzeichen mit Käufer-Name/IP, Notfall-Knopf «alle Zugänge sperren», Audit-Trail wer was wann angeschaut hat, OCR-Suche.

### Block H — Zahlungen (Etappen 76–80)
Stripe-Integration für Verkäufer-Pakete und Käufer-Abos, Schweizer Mehrwertsteuer 8.1%, Twint, Kreditkarte, fortlaufende Rechnungsnummern (RE-2026-00001 …), Storno-Rechnungen, Refunds mit 4-Augen-Prinzip ab CHF 500, Dunning-Logik bei fehlgeschlagenen Zahlungen, Promo-Codes für Launch-Aktionen.

### Block I — Admin-Panel (Etappen 81–90.1)
Was wir als Plattform-Betreiber brauchen: Command-Center-Home (heute zu tun), gestriger Tages-Digest per Mail, Inserate-Moderations-Queue mit AI-Vorprüfung durch Claude, Bulk-Approval für Vertrauens-Verkäufer, User-Management mit Impersonation und 4-Augen-Prinzip, Fraud-Detection mit Risk-Score 0–100, **granulare Admin-Rollen** (super_admin, moderator, support, finance, content_editor — wichtig für Datenschutz!), Zahlungs-Übersicht, DATEV/Bexio-Export, MwSt-Quartalsabrechnung, Reports (MRR, GMV, Conversion), Newsletter-Versand, Support-Tickets mit Sentiment-Analyse und SLA-Timer, öffentliche Status-Page.

### Block J — Content & SEO (Etappen 91–100)
Suchmaschinen-Optimierung: Blog-Editor, 468 SEO-Landingpages auto-generiert, Sitemap pro Sprache, Schema.org-Markup, OpenGraph-Bilder, Lighthouse-Score 100.

### Block K — Marketing & Growth (Etappen 101–110)
Newsletter-Builder, Drip-Kampagnen (7-Tage-Onboarding), Social-Share, Conversions-API für Meta/LinkedIn-Ads, **PWA + Web-Push** (Native-App-Feeling auf Handy ohne App-Store), Onboarding-Tours, NPS-Umfragen, Referral-Programm, PR-Kit, Landingpage-A/B-Tests.

### Block L — Trust, Qualität, Compliance (Etappen 111–120)
Telefon-Verifikation, Käufer-KYC, Verifikations-Badges, Peer-Bewertungen, CH-FADP-Compliance, Incident-Response-Plan, SLA-Garantie für MAX-Käufer, Datenschutz-Self-Service (Export + Löschung), WCAG 2.1 AA Barrierefreiheit, OWASP-Pentest, Bug-Bounty, Finanzierungsnachweis-Upload.

### Block M — i18n vollständig (Etappen 121–130)
Vier Sprachen (DE, FR, IT, EN) plus Rätoromanisch für die Kern-Seiten. Übersetzungs-Memory, lokalisierte E-Mail-Templates, Auto-Translation für User-Content via DeepL/Claude.

### Block N — Advanced Features (Etappen 131–140.1)
KI-Käufer-Matching mit pgvector, Public Valuation API, Banken-Partner-Integration, Berater-Directory, **Expert-Marketplace** (Berater-Vermittlung mit 20% Provision — neue Einnahmequelle!), WhatsApp-Alerts, Calendar-Integration, Video-Conferencing, Skribble QES E-Signing, LOI-Generator, **Partner-Portal** für Banken/Berater/Broker mit Revenue-Share.

### Block O — Optimierung (Etappen 141–150)
Bilder kompromieren, Caching, CDN, Database-Indizes, Lazy-Loading, Bundle-Size kleiner machen, Core-Web-Vitals < 2.5s LCP.

### Block P — Phase 2: Broker-Angebot (Etappen 151–160)
**Nicht in V1!** Erst nach Launch wenn genug Traffic da ist: dediziertes Broker-Dashboard, Mandate verwalten, Kanban-CRM, Provisions-Tracking, White-Label-Option.

---

## ⚠️ Was MUSS noch geändert/entschieden werden (vor Etappe 2)

Diese Punkte sind **nicht mehr im Plan ungeklärt**, sondern entweder bereits dokumentiert oder müssen noch von Cyrill bestätigt werden:

### Bereits geklärt im Plan ✅
- Käufer hat **2 Tiers** (Basic + MAX), keine Pro-Zwischenstufe
- Rollen heissen überall **`verkaeufer` + `kaeufer`** (transliteriert)
- Inserat geht nach Zahlung **immer in `in_review`**, nicht direkt published
- `max_active`-Flag auf profiles wurde entfernt → wird über `v_user_entitlements`-View abgefragt
- Trust-Center (Etappe 44) ≠ Incident-Response (Etappe 115) — sind klar getrennt
- Newsletter: Etappe 88 = Versand-Engine, Etappe 101 = Builder/Editor (sauber abgegrenzt)
- 196 Etappen total (alle Dokumente konsistent)

### Offene Geschäfts-Entscheidungen die nur Cyrill treffen kann ⚠️

**1. Promo-Codes zum Launch — wie aggressiv?**
Empfehlung: 50% Rabatt auf erstes Light-Inserat für die ersten 50 Verkäufer (= CHF 145 statt 290). Lockt erste Inhalte auf die Plattform.

**2. MAX-Käufer Trial-Modell?**
Aktuell: nur Basic-gratis und MAX-bezahlt. Frage: Soll es 14-Tage-Gratis-Trial auf MAX geben? Risiko: Trial-Hopper. Empfehlung: keine Trials in V1, dafür 7-Tage-Geld-zurück.

**3. Wer ist das «Gesicht» von passare?**
companymarket hat Carla Kaufmann persönlich als Marke. Marco (unsere Käufer-Persona) misstraut anonymen Plattformen. Frage: Wer ist auf About-Seite + Testimonials? Empfehlung: Cyrill als Gründer + 1 Senior-Beirat (M&A-Erfahrung).

**4. Anwalts-/Berater-Marketplace — wann genau?**
Aktuell als Etappe 134.1 geplant. Frage: Wirklich erst Etappe 134? Oder als Light-Version schon zur Beta? Empfehlung: 3 Hand-verlesene Berater zum Soft-Launch listen, vollen Marketplace dann Etappe 134.

**5. Telefon-Verifikation Twilio — Pflicht oder optional?**
Aktuell: Etappe 111 (zu spät). Wir verschieben sie nach vorn (zu Block D, Verkäufer-Onboarding). Aber: Soll sie Pflicht sein für alle Verkäufer oder nur «Verified-Badge»? Empfehlung: Pflicht für Verkäufer (Spam-Schutz), optional für Käufer.

**6. Beta-Launch-Datum?**
Realistisch nach Etappen 1–80 = ca. 80 Chats à 1 Etappe. Bei 5 Chats/Woche = 16 Wochen = 4 Monate. Soft-Beta also etwa Anfang September 2026. Frage: Realistisch oder zu spät?

**7. Pricing-Test in Beta?**
Aktuell fix: Light 290 / Pro 890 / Premium 1'890. Frage: Mit ersten 20 Verkäufern A/B-testen ob Pro CHF 690 oder 890 oder 1'090 besser performt? Empfehlung: ja, Etappe 86 (A/B-Test-Dashboard) macht das möglich.

### Reihenfolge-Optimierungen die Claude noch machen wird 🔄
- Telefon-Verifikation (Etappe 111) **vorziehen** in Block D
- WCAG-Barrierefreiheit (Etappe 117) **parallel** zu Public-Pages laufen lassen, nicht nachgelagert
- PWA + Web-Push (Etappe 103.1) **früher** — nach Block E statt in Block K

Diese drei Punkte werden bei Bedarf in der jeweiligen Etappe nachgezogen.

---

## 🚦 Realistischer Bauplan in Etappen-Häppchen

| Phase | Etappen | Ungefährer Zeitrahmen | Was läuft am Ende |
|---|---|---|---|
| **Setup-Phase** | 1–10.1 | 2 Wochen | Login funktioniert, Datenbank steht, Tests laufen |
| **Daten-Phase** | 11–25.1 | 2 Wochen | Alle Tabellen + RLS sind da |
| **Public-Phase** | 26–45 | 4 Wochen | Öffentliche Seiten + Marketplace + SEO-Landingpages live |
| **Dashboard-Phase** | 46–65 | 5 Wochen | Verkäufer können inserieren, Käufer suchen |
| **Trust-Phase** | 66–80 | 3 Wochen | Messaging + NDA + Datenraum + Zahlungen |
| **Admin-Phase** | 81–90.1 | 3 Wochen | Wir können moderieren, Fraud erkennen, Reports ziehen |
| **Polish-Phase** | 91–120 | 3 Wochen | SEO + Marketing + Compliance |
| **i18n-Phase** | 121–130 | 2 Wochen | Vier Sprachen live |
| **Advanced-Phase** | 131–150 | 4 Wochen | KI-Matching + Skribble + Performance-Optimierungen |
| **Beta-Launch** 🚀 | — | nach Phase 7 | Plattform öffnet kontrolliert |
| **Public-Launch** 🌍 | nach Beta-Tests | — | Beta-Code raus, Google-Indexierung an |
| **Phase-2-Broker** | 151–160 | später | Broker-Produkt nach erstem Traffic-Volumen |

**Gesamt-Zeitschätzung (sehr grob): 6–9 Monate** vom heutigen Stand bis Public-Launch.

---

## 📚 Wo finde ich was?

| Dokument | Zweck |
|---|---|
| `CLAUDE.md` | Globale Anweisungen für die KI-Entwicklung. Pflicht-Read pro neuem Chat. |
| `MASTER_PLAN.md` | Die 196 Etappen im Detail. Abhängigkeiten, Verifikation. |
| `INFRASTRUCTURE.md` | Datenbank-Schema, RLS-Strategie, Sicherheit. |
| `COMPETITOR_RESEARCH.md` | Was companymarket.ch macht — und wo wir besser sind. |
| `GAP_ANALYSIS.md` | Erste Lücken-Analyse mit 15 zusätzlichen Etappen. |
| `PERSONA_WALKTHROUGH.md` | 3 Personen (Marco/Anna/Lukas) durch die Plattform — 21 zusätzliche Etappen. |
| `DESIGN_SYSTEM.md` | Farben, Fonts, Komponenten, Motion-Regeln. |
| **`PLAN_EINFACH_ERKLAERT.md`** | **Du bist hier — einfache Sprache für Cyrill.** |

---

*Dokument erstellt: 27.04.2026 · Stand nach Gap-Analyse + Persona-Walkthrough · Plan jetzt 196 Etappen, alle Doppelungen aufgelöst, alle 6 offenen Geschäftsfragen markiert.*
