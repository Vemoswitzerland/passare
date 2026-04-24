# Competitor Research — companymarket.ch

> Stand: 24.04.2026
> Quelle: Deep-Research via WebFetch
>
> **Ziel:** Verstehen was der CH-Marktführer anbietet, um passare.ch gezielt besser zu positionieren.

---

## 🏢 Überblick

[companymarket.ch](https://www.companymarket.ch) ist der "grösste Schweizer Nachfolge- und Unternehmensvermittlungsportal" (Betrieb: Carla Kaufmann, Zürich). Kombiniert klassischen KMU-Marktplatz + Käufer-Gesuche + Expertenverzeichnis + Shop für Templates/Checklisten + Beratungsleistungen.

**Monetarisierung:**
- Inserat-Gebühren (Verkäufer)
- Jahresabos für Berater/Broker
- Zusatzservices (Assessment CHF 750, Due Diligence CHF 150, Banner CHF 400)

---

## 💰 Preismodell companymarket.ch (exakt)

| Produkt | Preis CHF |
|---|---|
| Standard-Inserat (>250k Verkaufspreis) | 550 |
| Small Business-Inserat (<250k) | 275 |
| Unlimitiert-Inserat (bis Verkauf) | 900 |
| Komplett-Paket (One-Pager + NDA + LoI + Banner 30T) | 1'000 |
| Jahrespauschale Klein (bis 15 Inserate) | 3'000 |
| Jahrespauschale Gross (unlimitiert, Broker) | 5'000 |
| NDA / LoI Template einzeln | 50 |
| Due-Diligence Checkliste einzeln | 50 |
| Due-Diligence Komplett (1–6) | 150 |
| NachfolgeAssessment (Bewertung + Beratung) | 750 |
| 100er-Liste (Kontaktliste) | 300 |
| Skyscraper-Banner (30 Tage) | 400 |
| Nachfolge-Magazin | 25 |

**Vergleich zu passare.ch:**
- Unsere Pakete: Light CHF 290 / Pro CHF 890 / Premium CHF 1'890
- **Light CHF 290** ist ca. 50% günstiger als companymarket Standard (CHF 550)
- **Pro CHF 890** entspricht Unlimitiert-Niveau (CHF 900) — inhaltlich deutlich mehr
- **Premium CHF 1'890** kein direktes Äquivalent — USP durch Mehrsprachigkeit + Homepage-Feature

---

## 📊 Daten-Schema (relevant für unsere DB)

### Kategorien (4 Top-Level)
- Unternehmen (M&A) — Hauptkategorie
- Kapital / Investition
- Beteiligung / Franchise / Vertrieb
- Share Sales

### Branchen (18) — **1:1 übernehmen**
1. Landwirtschaft
2. Autoindustrie
3. Handel / Industrie
4. Bauwesen
5. Beratung
6. Energie / Umwelt
7. Ausbildung
8. Finanz / Versicherung
9. Lebensmittel
10. Grafik / Design
11. Gesundheit
12. Gastgewerbe
13. IT / Einzelhandel
14. Logistik
15. Immobilien
16. Kleinhandel
17. Grosshandel
18. Andere Dienstleistungen

### Regionen
- **5 CH-Grossregionen:** Genfersee, Mittelland, Nordwest, Ost, Zentral
- **26 Kantone** (Standard)
- + DE/AT-Regionen für Grenzgebiete
- + "Standortunabhängig" (für Digital-Firmen)

### Preis-Buckets (CHF) — **Schweizer Standard**
- 0 – 250'000
- 250'000 – 500'000
- 500'000 – 1'000'000
- 1 Mio – 5 Mio
- 5 Mio – 10 Mio
- 10 Mio – 20 Mio
- > 20 Mio

### Umsatz-Buckets (CHF) — identisch zu Preis

### Mitarbeiter-Buckets
- 0 – 10
- 10 – 20
- 20 – 50
- 50 – 100
- > 100

### Listing-Pflichtfelder (unser Datenmodell)
- Titel (anonymisiert)
- Ad-ID (Format: `DOSS-####`)
- Kategorie-Tag
- Branche
- Region / Kanton
- Kaufpreis (exakt oder "VHB")
- Monatsmiete (optional)
- Benötigtes Eigenkapital (für Käufer-Filter)
- Jahresumsatz (Bucket oder exakt)
- Mitarbeiter (exakt)
- Rechtsform (AG, GmbH, EG, KG, Genossenschaft...)
- Übergabe-Zeitpunkt (sofort / 3M / 6M / 12M+)
- Sprache (DE/FR/EN/IT)
- Freitext-Beschreibung
- Verkäufer anonym (Default) / genannt (nach NDA)
- Optional: Bilder
- **Unser USP:** EBITDA-Marge (Pflicht bei Pro+), Cashflow (optional)

---

## ✅ Features die companymarket.ch HAT

### Public
- Listen- / Raster- / Detailansicht
- Sortierung: Neueste, Älteste, Titel A–Z/Z–A
- **Käufer-Gesuche (reverse listings)** — Käufer publiziert Wunschkriterien
- **CompanyMap / "KI-Suche"**: Interaktive CH-Karte mit Nachfolge-Potenzial-Firmen (Lead-Listen, keine echten Inserate)
- CSV-Download aller Inserate (sic! — Datenschutz-Frage)
- Pagination über ~27 Seiten

### Verkäufer
- Anonymes Listing
- 6 Monate Laufzeit + 12 Monate Suche
- Verlängerung über Re-Listing

### Käufer
- Suchprofile / Alerts (beworben: 1'000+ aktive Abos)
- Käufer-Gesuch publizieren (reverse posting)
- **Finanzierungsrechner** (EK/FK-Split) direkt im Inserat
- Kontaktformular pro Inserat (Name, Email, Message, reCAPTCHA)

### Content / SEO
- News / Blog ("Nachfolge News")
- Ratgeber, Podcasts, 7-Step-Workshop-Videos
- Nachfolge-Magazin (jährlich, CHF 25)
- Partnerschaften (Swiss Life für Pensionierungsrechner)

### Trust
- **Expertenverzeichnis (46 Einträge)** — Branchen, Expertise, CHDU-Badge
- **Hypothekarbank Lenzburg** als Finanzierungspartner sichtbar
- Social: Facebook, LinkedIn, X

---

## ❌ Features die companymarket.ch NICHT hat

1. **Kein echter Datenraum** — NDA/LoI nur als PDF-Download
2. **Kein In-App Messaging** — nur Kontaktformular, keine Thread-Historie
3. **Keine NDA-Gating im UI** — NDA nur als CHF 50 Template im Shop
4. **Keine Käufer-Verifizierung** (Identität, Finanzierung, KYC)
5. **Keine strukturierten Finanzdaten als Filter** (EBITDA, Cashflow, Margen)
6. **Keine Branche × Kanton SEO-Landingpages** im Menü erkennbar
7. **CompanyMap liefert kalte Leads**, nicht verifizierte Verkäufer — verwässert Qualität
8. **Pricing intransparent für Käufer** (keine sichtbaren Käufer-Abos)
9. **Experten-Verzeichnis ohne Rating** / Zertifizierung

---

## 🎯 10 konkrete Empfehlungen für passare.ch

### 1. Taxonomie übernehmen (einmalig, dann Ruhe)
18 Branchen + 26 Kantone + 5 Grossregionen + Preis/Umsatz/MA-Buckets **1:1** als Enums in Supabase. Cross-Platform-Konsistenz für spätere Datenmigrationen.

### 2. EBITDA als Pflichtfeld ab Pro — klarer USP
companymarket hat das nicht. Käufer wollen Margenkennzahlen. Macht uns sofort seriöser.

### 3. Echter Datenraum mit NDA-Gating
PDF-Wasserzeichen, Audit-Trail, Per-User-Access. Massiver Qualitätsunterschied.

### 4. In-App Messaging mit Thread-Historie
Keine Kontaktformulare. Alle Konversationen in einem Dashboard. Conversion-Treiber.

### 5. Käufer-Verifizierung (KYC light + Finanzierungsnachweis)
Optional, aber mit "Verified"-Badge. Signalisiert Seriosität, erhöht NDA-Freigabe-Rate durch Verkäufer.

### 6. Reverse-Listings (Käufer-Gesuche)
companymarket hat das — wir brauchen das auch. "Ich suche eine Bäckerei in der Deutschschweiz, CHF 1–3M Budget."

### 7. Bewertungs-Tool öffentlich (Multiples-Rechner)
companymarket versteckt das hinter CHF 750 Assessment. **Wir machen es kostenlos** als Lead-Magnet. Huge SEO-Potential.

### 8. Branche × Kanton SEO-Landingpages (18 × 26 = 468 Seiten)
companymarket hat das nicht sauber. Auto-generiert mit lokalem Content. Massive SEO-Chance ("Bäckerei kaufen Bern", "IT-Firma kaufen Zürich").

### 9. Broker-Jahresabos einplanen (Etappe 2)
CHF 3'000–5'000/Jahr Broker-Pauschale ist laut companymarket wo das grosse Geld liegt. **Aktuell out-of-scope**, aber als Phase-2-Feature planen.

### 10. Finanzierungsrechner im Inserat
Jedes Detail-Inserat sollte einen EK/FK-Split-Rechner haben. Interaktion + Lead-Capture.

---

## 🛑 Was wir NICHT kopieren

- **CSV-Download aller Inserate** — Datenschutz-GAU
- **"CompanyMap" mit kalten Zefix-Leads** — verwässert Qualität, täuscht Interessenten
- **Shop für Templates** (NDA CHF 50, DD CHF 150) — billig, passt nicht zu unserer Positionierung

---

## 📐 Preis-Positionierung im CH-Markt

| Angebot | companymarket | passare |
|---|---|---|
| Basis-Inserat | CHF 550 / 6M | **CHF 290 / 3M** |
| Premium-Inserat | CHF 900 / unlim | **CHF 890 / 6M** (deutlich mehr Features) |
| Käufer-Abo | — | **CHF 199/M** (USP!) |
| Broker-Pauschale | CHF 3'000–5'000/Jahr | **Phase 2** |

**Interpretation:** Wir unterbieten den Einstiegspreis (-50%) und etablieren ein
Käufer-Abo als zweite Revenue-Säule (companymarket hat das nicht).
Broker-Bereich kommt Phase 2, wenn Volumen da ist.
