# CLAUDE.md — passare.ch Projekt-Anweisungen

> Diese Datei wird bei JEDEM Chat automatisch in den Kontext geladen.
> Sie beschreibt: **was passare.ch ist, wie wir arbeiten, was zu tun ist.**

---

## 🚨 ABSOLUTE REGEL — NIEMALS VEMO ANFASSEN

**passare.ch ist ein VÖLLIG eigenständiges Projekt** — unabhängig von Vemo Academy:

- ❌ **NIEMALS** an `/Users/cyrill/Desktop/vemo-academy/` arbeiten
- ❌ **NIEMALS** das Supabase-Projekt `ndhqrwvvxzkjpfeobpsf` (= Vemo) verwenden
- ❌ **NIEMALS** in das Repo `Vemoswitzerland/vemo-academy` pushen
- ❌ **NIEMALS** die Vemo-Vercel-Deployments anfassen
- ✅ Gemeinsamer GitHub-Account `Vemoswitzerland` ist OK (nur als Owner, passare hat eigenes Repo)
- ✅ Gleicher Vercel-Login ist OK (aber eigenes passare-Projekt)

**Alle passare.ch Assets:**
- **Repo:** `Vemoswitzerland/passare` (https://github.com/Vemoswitzerland/passare)
- **Lokales Verzeichnis:** `/Users/cyrill/Desktop/passare-new/`
- **Live-URL stabil:** https://passare-ch.vercel.app (auto-alias auf neuesten Prod-Deploy)
- **Beta-Code:** `passare2026`
- **Vercel-Projekt:** `passare` (NICHT vemo-academy!)
- **Supabase-Projekt:** Noch zu erstellen (Etappe 2), separater DB-Host

---

## 🎯 GESCHÄFTSMODELL — DAS ZENTRALE KONZEPT

> **passare ist eine Self-Service-Plattform, KEIN Broker.**
>
> Wir verbinden Verkäufer und Käufer direkt. Wir verdienen an der
> **Plattform-Gebühr**, nicht am Deal. Keine Erfolgsprovision.

### Zwei Benutzergruppen, zwei Einnahmequellen:

#### 🟤 VERKÄUFER — einmalige Paketgebühr pro Inserat
| Paket | Preis | Laufzeit | Kernmerkmal |
|---|---|---|---|
| **Inserat Light** | CHF 290 | 3 Monate | 5 Bilder, 2 PDFs, NDA-Gate, KI-Teaser |
| **Inserat Pro** | CHF 890 | 6 Monate | 20 Bilder, unbegrenzter Datenraum, Matching |
| **Inserat Premium** | CHF 1'890 | 12 Monate | Homepage-Feature, 4-sprachig, Beratung |

**Regeln:**
- Verkäufer bezahlt einmal → Inserat läuft X Monate
- Keine automatische Verlängerung
- Verlängerung möglich (Light +CHF 190/3M · Pro +CHF 490/6M · Premium +CHF 990/12M)
- Keine Provision auf Verkaufspreis — passare verdient nur am Paket

#### 🟢 KÄUFER — Gratis oder MAX-Abo
| Tier | Preis | Kernmerkmal |
|---|---|---|
| **Käufer Basic** | CHF 0 / unbefristet | Öffentliche Inserate, 5 Basis-Filter, wöchentliche Alerts, 5 Anfragen/M |
| **Käufer MAX** | CHF 199/Monat oder CHF 1'990/Jahr | 7 Tage Frühzugang, alle Filter, unbegrenzte Anfragen, Echtzeit-Alerts + WhatsApp, Featured-Käuferprofil, NDA-Fast-Track, KMU-Multiples-DB, persönlicher Ansprechpartner |

**Regeln:**
- Basic = unbegrenzt gratis — Funnel-Einstieg
- MAX = monatlich oder jährlich kündbar
- Jahres-Abo mit 2 Monaten Rabatt

### 🛑 BROKER-Angebot — aktuell NICHT im Scope
Broker können sich als Käufer registrieren (MAX-Abo).
Dediziertes Broker-Produkt: spätere Etappe, nicht V1.

### 💰 Upsells (beide Gruppen)
- **Verkäufer:** Top-Platzierung 1W CHF 190 · Homepage-Feature 3T CHF 290 · Foto-Session CHF 490
- **Käufer:** Branchen-Deal-Alert CHF 29/M · KMU-Experten-Gutachten CHF 890

---

## 📄 Seitenstruktur

```
/                    Homepage (Hero mit Dashboard-Mockup rechts, Pricing)
/verkaufen           Landingpage für Verkäufer + 3 Pakete
/kaufen              Landingpage für Käufer + Basic/MAX
/entdecken           Marktplatz-Grid mit Filter-Sidebar
/preise              Alle Pakete übersichtlich (Verkäufer+Käufer Tab)
/ratgeber            Blog / Redaktion (Content-Marketing)
/bewerten            Gratis Firmenbewertungstool (Lead-Magnet)
/atlas               CH-Firmen-Atlas mit Karte
/design              Living Style Guide (internal)
/beta                Beta-Gate Code-Eingabe
/auth/login          Login
/auth/register       Register
/dashboard/verkaeufer Verkäufer-Dashboard (Meine Inserate, Anfragen, Statistiken)
/dashboard/kaeufer    Käufer-Dashboard (Favoriten, Alerts, Anfragen, NDAs)
/admin               Admin-Panel
/api/*               Backend
```

---

## 🛠️ Tech-Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind + custom Passare-Palette |
| Fonts | Fraunces (Variable Serif) + Geist Sans + Geist Mono |
| UI | Custom-Komponenten (shadcn-kompatibel) |
| DB + Auth | Supabase (kommt Etappe 2) |
| Payments | Stripe — Checkout für Verkäufer-Pakete + MAX-Abo (Subscription) |
| Email | Resend + React Email |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) für Teaser-Generator |
| Maps | MapLibre GL JS |
| Zefix | Schweizer Handelsregister API |
| i18n | next-intl (DE/FR/IT/EN) |
| Forms | react-hook-form + Zod |
| Motion | Framer Motion |
| Hosting | Vercel (Edge + Serverless) |
| Analytics | Plausible (+ Sentry für Errors) |

---

## 🎨 Design-System (v1.0)

Siehe [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Kurzfassung:

- **Farben:** `ink` #0A0F12 · `navy` #0B1F3A · `bronze` #B8935A · `cream` #FAF8F3 · `stone` #E8E6E0
- **Serif:** Fraunces (Variable, opsz+SOFT) für Headlines
- **Sans:** Geist Sans für UI + Body
- **Mono:** Geist Mono für Deal-Zahlen, Timestamps, UIDs
- **Icons:** Lucide 1.5px stroke, 16–24px
- **Motion:** Framer Motion mit `cubic-bezier(0.16, 1, 0.3, 1)`, 200–700ms
- **Swiss-Details:** Guillemets «…», CHF mit Hochkomma (CHF 1'250'000), Kanton-Kürzel

**Design-Regeln (harte Linien):**
1. Kein Blau als Primary (Navy OK, Royal nicht)
2. Kein reines Weiss im Body (`cream` Hintergrund)
3. Kein Pill-Button (rounded-soft = 6px)
4. Hairlines (0.5–1px `stone`) statt Material-Shadows
5. Keine Stock-Fotos (dokumentarisch oder gar keine)

---

## 🗺️ DER MASTER PLAN

Die vollständige Roadmap liegt in [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md).

**Grundregel: 1 Chat = 1 Etappe.** Keine zwei Etappen pro Chat.
Jede Etappe wird **enorm tief** implementiert, niemals oberflächlich.

---

## ✅ Arbeitsablauf pro Chat

### 1. Git-Config setzen (immer zuerst!)
```bash
cd /Users/cyrill/Desktop/passare-new
git config user.email "info@vemo.ch"
git config user.name "Vemoswitzerland"
```

### 2. Im MASTER_PLAN.md schauen welche Etappe dran ist
```bash
grep -E "^###.*⏳" docs/MASTER_PLAN.md
```

### 3. Etappe implementieren (tief + vollständig)
- Code schreiben
- DB-Migrations wenn nötig (`supabase/migrations/NNN_xxx.sql`)
- MASTER_PLAN.md aktualisieren (✓ hinter die Etappe)

### 4. Commit + Push
```bash
git add .
git commit -m "Etappe N: <Titel>"
git push origin main
```

### 5. Vercel-Deploy verifizieren
- `vercel --prod --yes` auf CLI
- Dann: `vercel alias set <neue-url> passare-ch.vercel.app`
- Stabile URL: https://passare-ch.vercel.app

### 6. Live-Verifikation auf Chrome
- Via Chrome-Extension auf https://passare-ch.vercel.app
- Beta-Code `passare2026`
- Funktionalität der neuen Etappe manuell durchklicken
- Screenshot zur Bestätigung

### 7. Im Chat berichten
- Welche Etappe abgeschlossen
- Was implementiert
- Deploy-Link
- Nächste Etappe benennen

---

## 🛑 KRITISCHE REGELN

1. **NIEMALS Preview-Tools** verwenden (`preview_start`, `preview_screenshot` etc.) — immer Chrome auf Live-URL
2. **NIEMALS Vemo-Repo anfassen** (siehe oben)
3. **NIEMALS "kuratierte Redaktion" oder Broker-Sprache** — passare ist **Self-Service-Plattform**
4. **Pricing muss IMMER stimmen (2 Käufer-Tiers, keinen Pro-Mittelweg!):**
   - Verkäufer: CHF 290 / 890 / 1'890 einmalig
   - Käufer: CHF 0 (Basic) / CHF 199/M oder CHF 1'990/Jahr (MAX)
5. **0% Erfolgsprovision** ist das zentrale USP
6. **Viersprachigkeit** (DE/FR/IT/EN) Pflicht ab Etappe 7
7. **ADMIN-DASHBOARD ist Pflicht-Feature** — wird parallel zu jeder neuen Etappe mit-befüllt. Admin muss:
   - Alle Inserate moderieren/approven/rejecten können (inkl. Anonymitäts-Audit-Check)
   - Alle User verwalten (Rollen, Sperren, KYC-Status, interne Notes, Tags)
   - Alle Stripe-Zahlungen + MAX-Abos einsehen, Refunds auslösen, Dunning-Status sehen
   - Feature-Flags togglen
   - Alle Content-Seiten editieren (Blog, NDA-Templates, AGB — mit Versionierung!)
   - Newsletter-Kampagnen versenden (segmentiert)
   - Support-Tickets beantworten
   - Preise & Pakete konfigurieren
   - Reference-Daten pflegen (Branchen, Kantone, Gründe)
   - **User impersonieren** für Support (mit Audit-Trail)
   - **4-Eyes-Prinzip** für kritische Aktionen (permanent-sperren, Inserat-Löschung, Refund >CHF 500)
   - **Gesamte Plattform-Aktivität live sehen** (Activity-Feed: Anmeldungen, Inserate-Publikationen, NDAs, Zahlungen, Messaging, Logins, Datenraum-Zugriffe, Fehler) — gefiltert nach User/Zeitraum/Typ, exportierbar
8. **Rechtssicherheit ist Launch-Blocker:**
   - CH-MwSt 8.1 % auf allen Rechnungen, fortlaufende Rechnungsnummern, UID-Nummer
   - AGB-Versionierung mit expliziter User-Zustimmung (Tabelle `terms_acceptances`)
   - Consent-Records für Newsletter/Analytics/Marketing (CH-FADP + DSGVO)
   - DSGVO-Self-Service (Export, Löschung, Auskunft) in Käufer+Verkäufer-Dashboard
9. **Anonymitäts-Garantie** — Verkäufer bleibt anonym bis NDA. Jedes Inserat durchläuft Anonymitäts-Audit (Admin-Moderation + optional LLM-Check auf Firmenname im Teaser/Beschreibung/Bild-Metadaten).
10. **Sicherheit ist nicht optional:**
    - Rate-Limiting (Upstash) auf allen Forms + Auth
    - hCaptcha/Turnstile auf Registrierung, Kontakt, NDA
    - Virus-Scan (ClamAV) auf allen Uploads (Datenraum + Messaging-Attachments)
    - MFA/TOTP Pflicht für Admin-Rolle ab Tag 1
    - Rollen-Naming im Code durchgängig: `verkaeufer` + `kaeufer` (beide transliteriert, nie mischen!)
11. **Testing ist nicht „später"** — Playwright-E2E für Critical Paths + Migration-Smoke-Tests in CI als harte Gates.

---

## 🗣️ Sprache

Kommunikation mit Cyrill: **immer auf Deutsch** (Schweizerdeutsch verstehen, Hochdeutsch antworten).
Code & Kommentare auch DE.

---

## 🚀 Aktueller Stand

- ✅ **Etappe 1 LIVE** — Repo, Scaffold, Beta-Gate, Deploy
- ✅ **Etappe 1.5 LIVE** — Design-System v1.0 (Fraunces + Geist, Navy/Bronze/Cream, Lucide, Framer Motion)
- ✅ **Etappe 1.7 LIVE** — Self-Service-Modell + Pricing 3+2 + Einzelseiten (/verkaufen, /kaufen, /entdecken, /preise)
- ✅ **Etappe 1.8 LIVE** — Live-Status-Seite `/status` (Code `2827`)
- 📋 **Etappe 1.9** — Gap-Analyse abgeschlossen, 15 neue Pflicht-Etappen in MASTER_PLAN integriert (siehe `docs/GAP_ANALYSIS.md`)
- ⏳ **Etappe 2 NEXT** — Supabase-Setup + Core Migrations (inkl. `terms_acceptances`, `consent_records`, `notifications`)

Siehe [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) für alle Etappen, [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) für die Lückenanalyse.

---

## 📡 LIVE-STATUS-SEITE — Pflicht-Workflow

**Die Seite `/status` (Code `2827`) zeigt Cyrill in nicht-technischer Sprache was bisher gemacht wurde und was als Nächstes ansteht.**

Nach JEDER abgeschlossenen Aufgabe (jedem Deploy, jedem Fix, jedem neuen Feature):

### Schritt 1 — `src/data/updates.ts` aktualisieren
Füge **oben in der `UPDATES`-Liste** (= neueste zuerst) eine neue Entry hinzu:

```ts
{
  date: '2026-04-XX',                // ISO-Format
  type: 'feature' | 'design' | 'fix' | 'content' | 'milestone' | 'infrastruktur',
  titel: 'Kurzer Titel, max 60 Zeichen',
  beschreibung: 'Ein bis zwei Sätze. Klar verständlich für Nicht-Techniker. Keine Tech-Begriffe wie API, RLS, Webhook, Schema, Migration. Lieber: «Datenbank», «Login funktioniert jetzt», «Seite lädt schneller».',
},
```

### Schritt 2 — Wenn neue Etappe dran ist: `CURRENT_STEP` updaten
Wenn die aktuelle Etappe abgeschlossen ist, ersetze in `src/data/updates.ts` den `CURRENT_STEP`-Block:

```ts
export const CURRENT_STEP = {
  etappe: 'Etappe N',
  titel: 'Kurzer Untertitel',
  beschreibung: 'Was passiert jetzt — laienverständlich, 2-3 Sätze, nutzt keine Fachbegriffe.',
  geplant: '~ Monat YYYY',
};
```

### Schritt 3 — Deploy + Alias
```bash
git add -A && git commit -m "..." && git push
vercel --prod --yes
vercel alias set <neue-url> passare-ch.vercel.app
```

### Schritt 4 — Verifizieren auf `/status`
- https://passare-ch.vercel.app/status mit Code `2827` aufrufen
- Prüfen ob die neue Entry oben erscheint
- Aktueller Schritt korrekt?

### Sprach-Regeln für Updates
- ❌ NICHT: «RLS-Policy auf `inserate` Tabelle eingerichtet»
- ✅ JA: «Inserate sind jetzt geschützt — niemand sieht fremde Daten»
- ❌ NICHT: «Stripe Webhook integriert»
- ✅ JA: «Bezahlung mit Kreditkarte funktioniert — wir bekommen Bescheid wenn jemand zahlt»
- ❌ NICHT: «Next.js 16 Server Actions verwendet»
- ✅ JA: «Formulare auf der Webseite funktionieren jetzt schneller»

**Mobile-First:** Die `/status`-Seite ist primär für Cyrills Handy gebaut.
