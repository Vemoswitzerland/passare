# Umbau: Käufer / Verkäufer-Trennung + NDA-Klar­schiff + Inserieren-via-Bewerten

**Datum:** 2026-04-30
**Auslöser:** Sprachmemo Cyrill (30.04.2026 Abend)
**Ziel:** Klare Trennung der Marketing-Sicht für Käufer vs. Verkäufer auf der Public-Site, Beseitigung obsoleter NDA-Wording, vereinheitlichter Inserat-Einstieg via Bewertung.

---

## 1. Zustand vor dem Umbau (kurz)

| Bereich | Problem |
|---|---|
| `/preise` | Mischt Verkäufer-Pakete (Light/Pro/Premium) und Käufer-Tiers (Basic/MAX) auf einer Seite — verwirrend, kein klarer Adressat. |
| Hauptmenü "Preise" | Verlinkt auf gemischte Seite; Käufer landen auf Verkäufer-Inhalten und umgekehrt. |
| MAX-Upsell auf Marktplatz (Sidebar `/`) | Knopf "MAX ansehen" zeigt auf `/preise` — Käufer sieht erst Verkäufer-Pakete bevor er seine eigenen Vorteile findet. |
| Inserieren-Einstieg | Buttons "Inserat erstellen" / "Inserieren" führen direkt zu `/verkaufen/start`. Bewertung passiert teils dort, ist aber nicht als zwingender Schritt kommuniziert. |
| Wording NDA | Auf `/`, `/verkaufen`, `/preise`, `/onboarding`, Marketing-Metadata, FAQs — überall noch "NDA-Gate", "NDA signieren", "NDA-Fast-Track". Konzept ist im aktuellen Modell nicht mehr relevant. |
| FAQs | Auf `/verkaufen` und `/preise` enthalten Antworten zu Features (NDA, alte Pakete) die nicht mehr stimmen. |

---

## 2. Soll-Zustand

### 2.1 Klare URL-Trennung

| Pfad | Adressat | Inhalt |
|---|---|---|
| `/preise` | **Verkäufer** | Light · Pro · Premium + Verlängerung + Klein-Inserat-Rabatt + Powerups + Verkäufer-FAQ |
| `/max` (neu) | **Käufer** | Basic vs. MAX-Vorteile-Tabelle + Käufer-Argumente + Käufer-FAQ |
| `/verkaufen` | Verkäufer-Marketing | Bleibt — Hero, Pakete, Prozess, BewertungsKarte, FAQ, CTA |
| `/` (Marktplatz) | Käufer (Browse) | Bleibt — Listings, Filter, Sidebar |
| `/bewerten` | Verkäufer-Lead-Magnet | Bleibt — Wizard mit Übergabe in Inserat-Funnel |
| `/verkaufen/start` | Verkäufer-Funnel | Bleibt — FirmaOnboarding mit eingebauter Bewertung |

### 2.2 Navigations-Logik

- **Hauptmenü-Links** (öffentlich, top-bar):
  - "Firma inserieren" → `/verkaufen` (unverändert)
  - "Preise" → `/preise` (jetzt: Verkäufer-only)
  - **Optional:** "Käufer MAX" → `/max` (neu) — nur wenn Cyrill das später will. Vorerst nicht im Hauptmenü, da der Standard-Flow für Käufer das Browsen auf `/` ist.
- **Marktplatz-Sidebar MAX-Upsell** (`/`): "MAX ansehen" → `/max` (statt `/preise`)
- **Footer-Spalte "Plattform"**: bekommt Käufer-MAX als eigenen Link, Inserieren + Preise getrennt aufgeführt
- **Käufer-Dashboard (`/dashboard/kaeufer`)**: Upsell-Banner und Abo-Page verlinken auf `/max` für externe MAX-Erklärung; interne Buchungs-Page bleibt `/dashboard/kaeufer/abo`

### 2.3 Inserieren = Bewerten + Inserat in einem Flow

- Alle CTAs "Inserat erstellen" / "Firma inserieren" / "Inserieren" zeigen auf `/verkaufen/start`.
- Das `FirmaOnboarding` (in `/verkaufen/start`) führt durch:
  1. Zefix-Firmensuche
  2. Branche / Kanton / Mitarbeitende / Umsatz / EBITDA (Bewertungs-Inputs)
  3. `SmartPriceEstimate` zeigt Marktwert-Range
  4. Übergabe in Paket-Wahl → Auth/Register → Inserat-Wizard
- Lead-Magnet-Flow `/bewerten` bleibt eigenständig (Lead-Form ohne Inserat-Pflicht), aber CTA am Ende führt ebenfalls in `/verkaufen/start` mit übernommenen Werten.
- **Cyrill-Wunsch erfüllt:** "wenn ich auf Inserieren klicke, kommt erst die Bewertung" — bestehender `/verkaufen/start` macht das, wir verstärken nur die Kommunikation:
  - Button-Beschriftung: "Bewerten & Inserat erstellen" (statt nur "Inserat erstellen") wo Platz ist
  - Subtext unter Buttons macht klar dass Bewertung Teil des Flows ist

### 2.4 NDA-Klar­schiff

**Regel:** In allen sichtbaren öffentlichen + Login-Marketing-Texten wird "NDA" durch passendes neues Wording ersetzt:

| Alt | Neu |
|---|---|
| "NDA-Gate" | "Anfrage-Schutz" oder "Geheimhaltungs-Stufe" |
| "NDA signieren" | "Geheimhaltung bestätigen" |
| "nach NDA" | "nach Anfrage" oder "nach Datenraum-Freigabe" |
| "NDA-Fast-Track" | "Direkt-Anfrage" oder "Premium-Anfrage" |
| "unterzeichnetem NDA" | "bestätigter Geheimhaltung" oder einfach "Ihrer Freigabe" |

**Affected Files (Marketing/Texte):**
- `src/app/layout.tsx` (Site-weite Metadata)
- `src/app/page.tsx` (Hero + Metadata)
- `src/app/verkaufen/page.tsx` (Metadata, Hero, Signal-Dots, Benefits, Process, FAQ)
- `src/app/preise/page.tsx` (Käufer-Tabelle Features, FAQ — wird sowieso umgebaut)
- `src/app/onboarding/OnboardingWizard.tsx` (Feature-Liste)
- `src/app/onboarding/kaeufer/paket/page.tsx` (Feature-Rows)
- `src/app/dashboard/kaeufer/abo/page.tsx` (MAX-Features-Liste, Vorteils-Texte)
- `src/app/inserat/[id]/page.tsx` (Detail-Sätze)
- `src/app/ratgeber/page.tsx` (Metadata)

**NICHT angefasst** (Backend / DB / interne Verkäufer-Pipeline):
- `src/app/dashboard/verkaeufer/nda/page.tsx` — Sidebar-Eintrag schon entfernt, Page existiert noch im Routing aber ist nicht verlinkt. Bleibt vorerst, kann später entfernt werden.
- DB-Tabellen `nda_signaturen`, `nda_templates` etc. bleiben unangetastet.
- Admin-Anfrage-Detail-Page (`/admin/anfragen/[id]`) — interner Status, nicht öffentlich.

### 2.5 FAQ-Bereinigung

- **`/verkaufen` FAQ**: Frage zu "Wie funktioniert das NDA-Gate?" entfällt. Frage "Muss ich meinen Firmennamen öffentlich angeben?" bleibt, Antwort wird umformuliert ohne NDA-Begriff. Klein-Inserat-Rabatt-Frage bleibt mit aktuellen Werten. Nicht-mehr-passende Fragen werden gestrichen.
- **`/preise` FAQ**: Wird komplett auf Verkäufer-Sicht reduziert und die alten Fragen die Käufer-Bezüge hatten werden entfernt.
- **`/max` FAQ** (neu): Käufer-spezifische Fragen (Basic vs MAX, Frühzugang, Kündigung, MWST, Talent-Tier-Hinweis).

---

## 3. Umsetzungs-Reihenfolge

1. ✅ Dieses Dokument schreiben (Plan-Anker)
2. Neue Datei `src/app/max/page.tsx` anlegen — Käufer-MAX-Vorteile-Page
3. `src/app/preise/page.tsx` umbauen — nur Verkäufer-Inhalt + neue passende FAQ
4. Marktplatz-Sidebar MAX-Upsell umlinken (`/preise` → `/max`)
5. Footer (in `page.tsx`, `verkaufen/page.tsx`, `preise/page.tsx`): "Käufer MAX" als eigener Link
6. Onboarding-Käufer-Paket-Page: NDA-Wording ersetzen
7. Käufer-Dashboard Abo-Page + Upsell-Banner: NDA-Wording ersetzen
8. `/verkaufen` FAQ + Texte: NDA-Wording ersetzen
9. `/inserat/[id]`, `layout.tsx`, `ratgeber`, Onboarding-Wizard: Marketing-Metadata + Texte
10. Inserieren-Buttons: Beschriftung verstärken um zu zeigen dass Bewertung Teil des Flows ist
11. Build (`npm run build`) prüfen
12. Kontroll-Agent (Code + Live-Site)
13. Deploy (`git push origin main` + `vercel --prod --yes` + Alias)
14. `src/data/updates.ts` updaten (`/status` Pflicht-Workflow)

---

## 4. Nicht-Ziele (bewusst aussen vor)

- Backend-NDA-Funktionalität: Bleibt operational (Admin-Workflows, DB).
- `/dashboard/verkaeufer/nda` Page: Wird nicht jetzt entfernt — Sidebar-Eintrag ist schon weg, kein Link mehr. Saubere Entfernung in einem späteren PR mit DB-Migration.
- i18n: Texte bleiben DE — Übersetzung kommt in Phase 1 P1.7.
- Talent-Tier auf `/max`: Phase-2-Item, hier nur als Hinweis ("kommt bald") wenn passend.

---

## 5. Klare Trennlinien (Cyrill-Zitate)

> «Man muss das ganz klar trennen. Dass überall, wo der Käufer drauf kommt, er seine Preise [bzw. Vorteile] sieht und überall, wo der Verkäufer drauf kommt, dass er seine Preise und Vorteile sieht.»

> «Wenn man auf der Börse beim Max unten klickt, dann soll man seine Vorteile sehen. Da soll man nicht auf die Preisseite, wo man auch die Inseratpreise sieht.»

> «Wenn man dort ins inserieren klickt, kommt diese [Bewertung] ... soll alles abfragen ... intensive Einwertung machen ... dann weiter zum Funnel mit dem Inserieren.»

> «In Login-Bereichen, öffentlichen Bereichen steht überall noch Dinge von NDA Signal — es gibt keine. Alles durch, das gibt's nicht mehr.»

---

## 6. Done-Definition

- Käufer auf `/` klickt MAX-Upsell → landet auf `/max`, sieht NUR Käufer-Vorteile
- Verkäufer-Hauptmenü "Preise" → `/preise`, sieht NUR Verkäufer-Pakete
- Keine NDA-Begriffe in öffentlichen + Login-Marketing-Texten
- Build geht durch, keine Type-Errors, keine Broken Links
- Live auf passare-ch.vercel.app verifiziert (Beta-Code `passare2026`)
- `/status` updated mit dem neuen Update-Eintrag
