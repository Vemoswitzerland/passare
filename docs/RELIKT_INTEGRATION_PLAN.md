# Relikt-Integration — Cyrills Sprachmemos zu passare

**Quelle:** 9 Walliserdeutsche Sprachmemos + Flipchart-Foto vom 29.04.2026
**Transkripte:** `/Users/cyrill/Desktop/Passare vorsxchläge/TRANSKRIPTE.md`
**Zweck:** Cyrills Brainstorming sauber in den bestehenden MASTER_PLAN integrieren — ohne Duplikate, ohne Verlust.

---

## TL;DR — die 5 wirklich neuen Ideen

| # | Idee | Bestehender Plan | Status |
|---|---|---|---|
| 1 | **Nachfolger-Marktplatz** (Verkäufer sucht Nachfolger statt Käufer) | nicht enthalten | NEU |
| 2 | **Käufer-Talent-Profile** für CHF 20-30/Jahr (frustrierte Mitarbeiter) | nur MAX (199.-) | NEU |
| 3 | **Atlas mit Auto-Wertberechnung jeder CH-Firma** | Atlas nur als Karte | ERWEITERN |
| 4 | **Branchenleader-Content-Hub** (User-generated Content) | nur statischer Blog | ERWEITERN |
| 5 | **Financing + Contracting + Data als Phase 3 Vision** | einzelne Etappen, nicht als Vision | KONSOLIDIEREN |

Das Übrige aus den Memos (Self-Service, Verkäufer-Wizard, Käufer-Suche, Broker-Phase-2, Pricing-Logik, NDA-optional) ist im MASTER_PLAN bereits abgedeckt — teilweise präziser als in der Sprachmemo.

---

## Was ist GUT abgedeckt (keine Aktion nötig)

| Sprachmemo-Bubble | MASTER_PLAN |
|---|---|
| Bubble 1 — Marktplatz wie Autoscout | ✅ Etappe 1.7 LIVE, Etappe 32.5 (NL-Suche), Etappe 30 (Ähnliche) |
| Bubble 2 — Verkäufer-Inserieren self-service | ✅ Etappen 49-55 (Wizard mit Zefix, Auto-Save, KI-Teaser, Anonymitäts-Coach) |
| Bubble 3 — Käufer mit Dossier | ✅ Etappe 59 (Käuferprofil-Reverse-Listing), Etappe 56.1 (Daily-Digest) |
| Bubble 5 — Broker als Power-User | ✅ Block P (Phase 2, Etappen 151-160) — bewusst später |
| Bubble 6 — In-App Kommunikation | ✅ Etappen 66-70 (Messaging + Realtime + Push) |
| Pricing — kein Auto-Verlängern | ✅ Bereits CLAUDE.md + Etappe 80 |
| M&A-Berater-Upsell zw. Bubble 4↔6 | ✅ Etappe 134.1 (Expert-Marketplace mit 20% Cut) |

---

## Was ist NEU oder MUSS NACHGESCHÄRFT werden

### 1. Nachfolger-Marktplatz (NEU — eigener Track)

**Cyrills Insight:** passare ist nicht nur Firmen-Verkauf. Die Babyboomer-Welle braucht **Nachfolger**, nicht zwingend Käufer. Auf der Gegenseite gibt's Talente (Maler-Meister, frustrierte Angestellte) die eine Firma übernehmen wollen aber gar nicht aktiv suchen.

**Konkretes Beispiel aus Memo 4:** Malerbetrieb hat keinen Nachfolger. Auf der anderen Seite hat einer die Malermeister-Prüfung gemacht, will eine Firma eröffnen → statt neue Firma gründen, bestehende übernehmen.

**Was wir bauen müssen:**
- Neue Inserat-Kategorie **"Nachfolge gesucht"** (statt "Firma zu verkaufen")
  - Verkäufer-Wizard hat zusätzliche Option: "Ich suche Nachfolger" vs "Ich verkaufe Firma"
  - Bei "Nachfolger" anderes Pricing-Modell denkbar (günstiger, weil oft kein direkter Cash-Out)
- Neue Käufer-Kategorie **"Übernahme-Kandidat / Talent-Profil"**
  - Eigenes öffentliches Profil mit: Branchen-Erfahrung, Ausbildung, Region, Budget-Range, Zeithorizont, Motivation
  - Verkäufer kann diese Profile durchsuchen ("Ich suche jemanden mit Maler-Erfahrung in BE/SO")
  - Anonym-Modus damit aktueller Arbeitgeber nichts merkt
- **Match-Engine bidirektional** — Verkäufer findet Talente, Talente finden Inserate

**Wo im MASTER_PLAN integrieren:**
- Erweitert Etappe 11 (`inserate`-Tabelle) um `inserat_type` (verkauf | nachfolge_gesucht)
- Erweitert Etappe 20 (`kaeufer_profile`) um Sub-Type (kaeufer | uebernahme_talent)
- NEUE **Etappe 31.1 — Nachfolger-Hub**: Public-Page `/nachfolge` zeigt beides nebeneinander (offene Nachfolge-Mandate × Talent-Profile)
- Erweitert Etappe 63 (Matching-Engine) um Bidirektionalität

**Why das wichtig ist:** Verdoppelt den adressierbaren Markt. Babyboomer-Inhaber sind oft nicht Verkäufer im klassischen Sinn (wollen kein Cash-Out, wollen Lebenswerk weiterführen lassen). Frustrierte Angestellte/Meister sind keine MAX-Käufer (kein 199.-/Monat-Budget) aber sehr hohe Volumen-Persona.

---

### 2. Käufer-Talent-Tier — NEUER 3. Tier (CHF 20-30/Jahr)

**Cyrills Zahl:** 500'000 frustrierte Schweizer Mitarbeiter. Geborene Chefs. Wert: 20-30 Fr./Jahr für Selbstpräsentation.

**Aktuell hat passare 2 Käufer-Tiers:**
- Basic: gratis
- MAX: CHF 199/Monat (CHF 1'990/Jahr)

**Neu vorgeschlagen:**

| Tier | Preis | Zweck |
|---|---|---|
| Basic | gratis | Browsen, 5 Anfragen/Monat |
| **Talent** ⭐ NEU | CHF 24/Jahr (CHF 2/Monat) | Öffentliches Übernahme-Talent-Profil + Verkäufer können dich finden + Newsroom-Beiträge |
| MAX | CHF 199/Monat | Power-Tools: 7-Tage-Vorzugriff, alle Filter, WhatsApp-Alerts, NDA-Fast-Track, Featured |

**Why nicht in Basic mitnehmen:** Cyrill will keine Gratis-Zone. Talent-Tier monetisiert die "Ich-bin-geborener-Chef"-Persona ohne MAX-Hürde.

**Why nicht in MAX:** MAX ist für aktive Käufer mit Budget. Talent-Tier ist für Personen ohne aktives Mandat aber Übernahme-Wille — komplett anderes Pricing-Sensitivity.

**Wo im MASTER_PLAN integrieren:**
- Pricing-Section in CLAUDE.md erweitern: 3 Tiers
- Etappe 22 (`subscriptions`) erweitern um `tier='talent'`
- Etappe 59 (Käuferprofil) → Talent-Profil ist der Default-Output, MAX dann Upsell
- NEUE **Etappe 56.2 — Talent-Tier Onboarding**: Quiz "Welche Branche, welcher Standort, welches Budget" → Profil auto-generiert

---

### 3. Atlas mit fiktiver Wertberechnung — Eyecatcher Gamification

**Cyrills Insight:** Handelsregister "in cool". JEDE Firma in der Schweiz mit auto-berechnetem fiktivem Wert. Trigger: "die fühlen sich angefickt oder geschmeichelt" → Promotion-Hook.

**Aktueller Plan:** Etappe 32 — Atlas-Karte mit Pins der inserierten Firmen. Etappe 34 — Bewertungstool als Lead-Magnet. Beide sind getrennt.

**Neu vorgeschlagen — Atlas v2:**
- Karte zeigt **alle ~600'000 aktiven CH-Firmen** (Quelle: Zefix + BfS-Branche)
- Jede Firma hat einen **Auto-Wert** (Branche × Mitarbeiterzahl × Region × Multiples-DB)
- Inhaber kann sein Listing "claimen" und genauer machen → Lead in den Verkäufer-Tunnel
- Branchen-Heatmap, Kanton-Drill-Down, Top-Wert-Listen pro Region
- Soft-Gating: Wert ungenau → "Genauen Wert berechnen" CTA → /bewerten-Tool
- Optional: virale Share-Karte ("Meine Firma ist laut passare CHF 2.4M wert")

**Why das ein Killer ist:**
- SEO-Goldgrube (468 Branche×Kanton-Pages aus Etappe 38, jetzt mit echten Firmen-Listings)
- Lead-Magnet für nicht-aktive Inhaber → "schau mal was deine Firma wert ist" → Conversion in Verkäufer
- Datennetzwerk-Effekt: je mehr User claimen/korrigieren, desto präziser die Multiples-DB

**Wo im MASTER_PLAN integrieren:**
- Etappe 32 zu **Etappe 32 v2 — Atlas mit Auto-Wertung** umschreiben
- Etappe 36 (KMU-Multiples-DB) wird Vorbedingung statt Folge
- Zefix-Bulk-Import als Vorarbeit (separate Etappe 11.5 — `firmen_bulk` Tabelle mit allen CH-Firmen)
- DSGVO-Check: nur öffentliche HR-Daten + grobe Wert-Range (kein präziser Auto-Wert ohne Inhaber-Claim)

---

### 4. Branchenleader-Content-Hub — User-generated Marketing

**Cyrills Insight:** Plattform soll nicht statisch sein mit "SEO-Geschiss". Branchenleader sollen sich auf der Plattform zeigen können — die machen dann Promotion für uns. Events, Live-Stream, Podcasts.

**Aktueller Plan:** Etappe 37 (Blog), Etappe 41 (Whitepaper), Etappe 109 (Podcast/Videos embedded). Alle sind **passare produziert**, nicht User-Generated.

**Neu vorgeschlagen — Co-Creation Layer:**
- **Branchenleader-Profile** (Self-Service-Mini-Magazin pro Person/Firma)
  - Bekannte M&A-Anwälte, Treuhänder, KMU-Inhaber, Investoren bekommen kostenlosen Account
  - Eigene Content-Page mit Posts, Insights, Case-Studies
  - Eigene URL `/insights/peter-muster` mit RSS + LinkedIn-Cross-Post
- **Live-Cases** = anonymisierte Deal-Stories (User berichten von ihrer Übernahme)
- **Events-Kalender** mit Live-Stream-Integration (passare hostet, Branchenleader sind Speaker)
- **Podcast-Format** "Schweizer Nachfolge" (passare produziert, aber Gäste = User-Pipeline)

**Why das funktioniert:**
- Branchenleader brauchen Reichweite, passare braucht Content. Win-Win.
- Jeder Branchenleader-Beitrag ist Long-Tail-SEO-Content
- Trust-Signal für Käufer/Verkäufer ("die ernsthaften Leute sind hier")
- Skaliert ohne Redaktions-Kosten

**Wo im MASTER_PLAN integrieren:**
- Erweitert Etappe 37 (Blog) zu **Etappe 37 v2 — Multi-Author Content-Plattform**
- NEUE **Etappe 91.5 — Branchenleader-Onboarding**: Invite-only Editor-Rolle
- NEUE **Etappe 109.1 — Live-Stream-Integration** (z.B. via Restream/Mux + Embed)
- Verbinden mit Etappe 134.1 (Expert-Marketplace) — Branchenleader sind potenzielle Berater

---

### 5. Phase 3 Vision konsolidieren — Money-Machine

**Cyrills Insight (Memo 9):** Drei Säulen jenseits V1:
1. **Financing** — Crowd-Lending / Fund (Käufer kriegt Geld direkt in passare)
2. **Contracting** — AI-Anwalts-Maschine (Verträge in passare)
3. **Data** — Realtime-Kommandoschiff (B2B-Produkt für Banken/Investoren)

**Aktueller Plan:** Hat einzelne Etappen die das antippen, aber nicht als zusammenhängende Phase 3:
- Etappe 133 (Banken-Integration), 138 (eSign Skribble), 139 (LOI-Generator), 132 (Public Valuation API)

**Neu vorgeschlagen — Phase 3 Block (Etappen 161-180):**
Einen neuen Block **"BLOCK Q — MONEY MACHINE (Phase 3)"** ergänzen, parallel zu Block P (Broker Phase 2). Cyrill betont, dass das nicht V1 ist — also dokumentieren, nicht jetzt bauen.

```
BLOCK Q — MONEY MACHINE (Phase 3, ab 12+ Monate Live)

  Q1: Financing
    161 — Bankenintegration (Hypo Lenzburg, Credit Suisse Schweiz, etc.) als Lead-Pipeline
    162 — Crowd-Lending Pilot (KMU-Akquisitions-Finanzierung)
    163 — Fund-Vehicle (passare-eigener Akquisitions-Fund?)

  Q2: Contracting
    164 — LOI-Generator V2 (Claude-basiert, branchenspezifisch)
    165 — NDA-Auto-Anwalt (Verhandlung statt Standard-Template)
    166 — Vollständiger SPA (Share Purchase Agreement) Generator
    167 — Notarintegration (digital)

  Q3: Data Command
    168 — passare-Insights-Dashboard (Subscription-Produkt für Banken/Investoren)
    169 — Public Valuation API (Etappe 132 ausgebaut)
    170 — M&A-Markt-Report quartalsweise (paid + Lead-Magnet free)
    171 — Predictive Matching (welche Branche/Region wird in 12M heiss)
```

**Why als eigener Block:**
- Macht Phase-3-Vision explizit für Investoren/Partner
- Schützt davor, das jetzt schon halbgar einzubauen (Cyrills Zitat: "im ersten Moment Finger davon lassen")
- Datennetzwerk-Effekt nur möglich nach 6-12 Monaten Live-Traffic

---

## Was die Sprachmemos zusätzlich klären (Regel-Schärfung)

### NDA wird OPTIONAL — nicht zwingend

Cyrills Zitat: *"völlig unverbindlich, völlig ohne NDA. Am Schluss publizieren wir das Inserat, der Käufer macht Kontakt — was dazwischen passiert, interessiert uns nicht. Da können wir uns nur die Finger verbrennen."*

**Aktueller MASTER_PLAN:** Etappe 18, 28, 61, 68 — NDA wirkt an mehreren Stellen wie Pflicht-Gate.

**Neue Regel:**
- NDA bleibt als FEATURE für Verkäufer der's nutzen will (Premium-Tier)
- NDA wird NICHT Pflicht-Gate für Erstkontakt
- Default-Flow: Käufer schickt Anfrage → Verkäufer entscheidet ob NDA nötig oder direkt antworten
- passare moderiert NICHT die Verhandlung dazwischen

**Action:** Etappe 27/28 umformulieren — Teaser ohne NDA sichtbar, Vollsicht wahlweise mit/ohne NDA je nach Verkäufer-Setting.

### Self-Promotion-Regel: passare wartet auf User-Wachstum

Cyrils Zitat: *"Bin auf das Geld nicht angewiesen, kann mir Zeit lassen, kann Leads selber einkaufen."*

**Bedeutet:** Keine Wachstums-Hacks die User belästigen (Auto-Verlängerung, Spam-Notifications, Dark-Patterns). Lieber langsam wachsen mit hoher Qualität.

**Action:** Bei Marketing-Etappen (101-110) explizit Anti-Dark-Pattern-Regel als ausgeschriebenes Prinzip.

---

## Roadmap-Patch — konkrete Anpassungen am MASTER_PLAN

### CLAUDE.md
- Käufer-Pricing-Tabelle erweitern auf 3 Tiers (Basic / **Talent CHF 24/Jahr** / MAX)
- Anti-Broker-Sprache schärfen: NDA = optional, nicht zwingend
- Phase-3-Vision (Block Q) als Ausblick erwähnen

### MASTER_PLAN.md
- Etappe 11 erweitern: `inserat_type` Enum (verkauf | nachfolge_gesucht)
- NEUE Etappe 11.5: `firmen_bulk` Tabelle (alle CH-Firmen aus Zefix für Atlas)
- Etappe 20 erweitern: `kaeufer_profile.profile_type` (kaeufer | uebernahme_talent)
- Etappe 22 erweitern: `tier='talent'` Subscription
- Etappe 32 zu v2 umschreiben: Atlas mit Auto-Wertung
- NEUE Etappe 31.1: Nachfolger-Hub `/nachfolge`
- NEUE Etappe 56.2: Talent-Tier Onboarding
- Etappe 37 zu v2: Multi-Author Content-Plattform
- NEUE Etappe 91.5: Branchenleader-Onboarding
- NEUE Etappe 109.1: Live-Stream-Integration
- NEUER Block Q (Etappen 161-171): Money Machine Phase 3

### docs/PERSONA_WALKTHROUGH.md
- Neue Persona: **"Marc, 38, Malermeister, will eigene Firma"** (Talent-Persona)
- Neue Persona: **"Hans, 64, Inhaber Malerbetrieb, sucht Nachfolger statt Cash-Out"** (Nachfolger-Persona)

---

## Reihenfolge — was zuerst?

**Sofort (nach Etappe 4 LIVE):**
1. CLAUDE.md anpassen (3 Tiers, NDA-optional, Phase-3-Erwähnung)
2. MASTER_PLAN.md mit allen oben genannten Etappen-Erweiterungen patchen
3. PERSONA_WALKTHROUGH um 2 neue Personas erweitern

**In den nächsten 3 Monaten:**
4. Etappe 11 mit `inserat_type` ausliefern (Datenmodell)
5. Etappe 11.5 Bulk-Import CH-Firmen (Vorbereitung Atlas v2)
6. Etappe 20 mit `profile_type` (Datenmodell)

**Mit Block C/D/E:**
7. Etappe 31.1 Nachfolger-Hub als Public-Page
8. Etappe 56.2 Talent-Tier-Onboarding
9. Etappe 32 v2 Atlas mit Auto-Wertung (nach Etappe 36 Multiples-DB)

**Block J/K (Content):**
10. Etappe 37 v2 Multi-Author + Etappe 91.5 Branchenleader-Onboarding

**Phase 3 (12+ Monate):**
11. Block Q Money Machine

---

## Was NICHT übernommen wird (bewusst)

- **"Ohne NDA komplett"** ist zu absolut — wir bieten NDA als Feature für Verkäufer die es wollen, machen es aber nicht zur Pflicht. Cyrills Hardline-Position wird abgemildert weil rechtlich nötig in CH.
- **"Banken machen nichts mehr"** — als Vision OK (Block Q), aber V1 sollte trotzdem mit klassischen Bankpartnern starten (Hypo Lenzburg-Pilot).
- **"500.000 frustrierte Mitarbeiter"** als Zielgruppe — Marketing-Sprache, nicht in Produktbeschreibung übernehmen.

---

## Offene Fragen an Cyrill

1. **Talent-Tier-Pricing exakt:** CHF 24/Jahr (2.-/Monat) oder lieber CHF 49/Jahr?
2. **Nachfolger-Mandate**: gleiches Pricing wie Verkaufs-Inserate (Light/Pro/Premium) oder eigenes günstigeres Paket?
3. **Atlas-Auto-Wert**: Soll der Wert öffentlich sichtbar sein für nicht-geclaimte Firmen (Risiko: Inhaber-Empörung) oder nur grobe Range?
4. **Phase 3 Block Q**: jetzt schon offiziell in MASTER_PLAN aufnehmen oder erst nach Launch?
5. **Branchenleader-Onboarding**: invite-only oder application-based (jeder kann sich bewerben)?

---

*Erstellt aus 9 Sprachmemos vom 29.04.2026 + Flipchart-Foto. Cross-Referenz: docs/MASTER_PLAN.md, docs/PERSONA_WALKTHROUGH.md, CLAUDE.md.*
