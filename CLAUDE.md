# Globale Claude Code Anweisungen — passare.ch

## ⚡ AGENT-PROTOKOLL — PFLICHT-LEKTÜRE

**Bevor du irgendetwas tust:** [docs/AGENT_PROTOCOL.md](docs/AGENT_PROTOCOL.md) lesen.

Es regelt:
- Token-Tracking (jeder Chat trägt sich in `src/data/agent-tokens.ts` ein → live auf `/status` sichtbar)
- Konflikt-Vermeidung beim parallelen Arbeiten (Migration-Slots, Routes, geteilte Files)
- Status-Update-Pflicht nach jedem Deploy
- Token-Report-Block am Session-Ende

---

## 🎯 Standard-Projekt: passare.ch
Jeder neue Chat dreht sich um die **passare.ch** Plattform (https://passare-ch.vercel.app, später https://passare.ch), ausser ich sage explizit etwas anderes.

### Projekt-Standort
Das Repo liegt unter: `/Users/cyrill/Desktop/passare-new`
Falls es nicht existiert, sofort klonen:
```bash
git clone git@github.com:Vemoswitzerland/passare.git /Users/cyrill/Desktop/passare-new
```

### Infrastruktur
| Service | URL / Zugang |
|---------|-------------|
| **Live App** | https://passare.ch (Hauptdomain) bzw. https://passare-ch.vercel.app (Test-Alias) |
| **Beta-Code** (Public-Site) | `passare2026` |
| **Live-Status (intern)** | https://passare-ch.vercel.app/status — Code `2827` |
| **GitHub Repo** | https://github.com/Vemoswitzerland/passare |
| **Vercel Dashboard** | https://vercel.com/vemoswitzerlands-projects/passare |
| **Vercel Project ID** | `prj_fCXvbUF1QFbi83UCr5Zne8bf2rNf` |
| **Vercel Org ID** | `team_OdtAjz6EziCjymsXOBUaEfGB` |
| **Supabase Dashboard** | _(kommt in Etappe 2 — separater Host, NICHT Vemo-Projekt!)_ |
| **Supabase API URL** | _(kommt in Etappe 2)_ |
| **Supabase Anon Key** | _(kommt in Etappe 2)_ |
| **Stripe Dashboard** | _(kommt in Etappe H/76)_ |
| **Resend Dashboard** | _(kommt in Etappe 9 für E-Mails)_ |
| **Domain** | `passare.ch` (DNS-Setup nach Public-Launch) |

### Deploy-Pflicht
**JEDE Code-Änderung MUSS deployed werden!**

### ⚠️ KRITISCH: Git-Config IMMER zuerst setzen!
**Ohne korrekte Email funktioniert der Vercel-Deploy NICHT!**
Bei JEDEM neuen Chat als ALLERERSTES ausführen:
```bash
cd /Users/cyrill/Desktop/passare-new
git config user.email "info@vemo.ch"
git config user.name "Vemoswitzerland"
```
**GRUND:** Ohne diese Config wird die lokale Mac-Email benutzt — die ist NICHT mit GitHub/Vercel verknüpft und der Deploy schlägt fehl.
**Das muss in JEDEM neuen Chat gemacht werden, da die Shell-Session frisch startet.**

### Deploy-Ablauf
```bash
cd /Users/cyrill/Desktop/passare-new
git add <geänderte-dateien>
git commit -m "Beschreibung der Änderung"
git push origin main
vercel --prod --yes
vercel alias set <neue-deploy-url> passare-ch.vercel.app
```
Push auf `main` triggert automatisches Vercel-Deploy. CLI-Push bleibt aber Pflicht für Alias-Update auf die stabile URL.

---

## 🚨 ABSOLUTE REGEL — NIEMALS VEMO ANFASSEN

passare.ch ist ein **VÖLLIG eigenständiges Projekt** — unabhängig von Vemo Academy:

- ❌ **NIEMALS** an `/Users/cyrill/Desktop/vemo-academy/` arbeiten
- ❌ **NIEMALS** das Supabase-Projekt `ndhqrwvvxzkjpfeobpsf` (= Vemo) verwenden
- ❌ **NIEMALS** in das Repo `Vemoswitzerland/vemo-academy` pushen
- ❌ **NIEMALS** die Vemo-Vercel-Deployments anfassen
- ✅ Gemeinsamer GitHub-Account `Vemoswitzerland` ist OK (passare hat eigenes Repo)
- ✅ Gleicher Vercel-Login ist OK (eigenes passare-Projekt)

---

## 🎯 GESCHÄFTSMODELL — DAS ZENTRALE KONZEPT

> **passare ist eine Self-Service-Plattform — KEIN Broker.**
>
> Wir verbinden Verkäufer und Käufer direkt. Wir verdienen an der **Plattform-Gebühr**, nicht am Deal. **0% Erfolgsprovision.**

### 🟤 Verkäufer — einmalige Paketgebühr pro Inserat
| Paket | Preis | Laufzeit | Verlängerung |
|---|---|---|---|
| **Inserat Light** | CHF 290 | 3 Monate | +CHF 190 / 3M |
| **Inserat Pro** | CHF 890 | 6 Monate | +CHF 490 / 6M |
| **Inserat Premium** | CHF 1'890 | 12 Monate | +CHF 990 / 12M |

Alle Preise zzgl. **8.1% CH-MwSt**. Keine automatische Verlängerung.

### 🟢 Käufer — Gratis oder MAX-Abo
| Tier | Preis | Kernmerkmale |
|---|---|---|
| **Käufer Basic** | CHF 0 unbefristet | Öffentliche Inserate, 5 Basis-Filter, 5 Anfragen/Monat |
| **Käufer MAX** | CHF 199/M oder CHF 1'990/Jahr | 7 Tage Frühzugang, alle Filter, unbegrenzte Anfragen, WhatsApp-Alerts, Featured-Käuferprofil, NDA-Fast-Track, KMU-Multiples-DB |

**Keine Pro-Zwischenstufe!** Nur Basic + MAX.

### 🛑 Broker-Angebot — Phase 2, NICHT V1
Broker können sich als Käufer registrieren (MAX-Abo). Dediziertes Broker-Produkt: spätere Etappe.

### Rollen-Naming (harte Regel)
Im Code IMMER `verkaeufer` + `kaeufer` (beide transliteriert). Nie mischen!

---

## 📄 Seitenstruktur

```
/                       Homepage (Hero mit Dashboard-Mockup rechts, Pricing)
/verkaufen              Landingpage Verkäufer + 3 Pakete + FAQ
/kaufen                 Direkter Marktplatz mit Filter-Sidebar (statt Landing)
/preise                 Komplette Vergleichstabellen Verkäufer + Käufer
/ratgeber               Blog / Redaktion (kommt später)
/bewerten               Gratis Firmenbewertungstool (kommt — Lead-Magnet!)
/atlas                  CH-Firmen-Atlas mit Karte (kommt später)
/design                 Living Style Guide (intern)
/beta                   Beta-Gate Code-Eingabe (passare2026)
/status                 Live-Entwicklungsstatus (intern, Code 2827)
/auth/login             Login (kommt Etappe 3)
/auth/register          Register (kommt Etappe 3)
/dashboard/verkaeufer   Verkäufer-Dashboard (kommt Etappe 46+)
/dashboard/kaeufer      Käufer-Dashboard (kommt Etappe 56+)
/admin                  Admin-Panel (kommt Etappe 81+)
/api/*                  Backend
```

---

## 🛠️ Tech-Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind 3.4 + Custom Passare-Palette |
| Fonts | Fraunces (Variable Serif) + Geist Sans + Geist Mono |
| UI | Custom-Komponenten (shadcn-kompatibel) |
| DB + Auth | Supabase (kommt Etappe 2) |
| Payments | Stripe — Checkout (Verkäufer) + Subscription (Käufer MAX) |
| Email | Resend + React Email |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) für Teaser-Generator |
| Maps | MapLibre GL JS |
| Zefix | Schweizer Handelsregister API |
| i18n | next-intl (DE/FR/IT/EN) — Pflicht ab Etappe 7 |
| Forms | react-hook-form + Zod |
| Motion | Framer Motion |
| Hosting | Vercel (Edge + Serverless) |
| Analytics | Plausible + Sentry |

---

## 🎨 Design-System (v1.0 — siehe `docs/DESIGN_SYSTEM.md`)

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

Die vollständige Roadmap liegt in [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) — **196 Etappen in 16 Blöcken** (15 aus Gap-Analyse + 21 aus Persona-Walkthrough integriert).

**Grundregel: 1 Chat = 1 Etappe.** Keine zwei Etappen pro Chat.
Jede Etappe wird **enorm tief** implementiert, niemals oberflächlich.

---

## 📡 LIVE-STATUS-SEITE — Pflicht-Workflow

**Die Seite `/status` (Code `2827`) zeigt mir in nicht-technischer Sprache was bisher gemacht wurde + aktueller Schritt mit Task-Liste.**

Nach JEDER abgeschlossenen Aufgabe (Deploy, Fix, Feature):

### 1. `src/data/updates.ts` aktualisieren
Füge **oben in `UPDATES`** (= neueste zuerst) eine neue Entry hinzu:

```ts
{
  date: '2026-04-XX',                // ISO-Format
  type: 'feature' | 'design' | 'fix' | 'content' | 'milestone' | 'infrastruktur',
  titel: 'Kurzer Titel, max 60 Zeichen',
  beschreibung: 'Ein bis zwei Sätze. Klar verständlich für Nicht-Techniker. KEINE Software-Namen (Supabase, Vercel, GitHub, Stripe, Fraunces, Geist).',
},
```

### 2. Bei neuer Etappe: `CURRENT_STEP` updaten
```ts
const CURRENT_TASKS: Task[] = [
  { label: 'subtask · name', status: 'pending' },
  ...
];
export const CURRENT_STEP = {
  etappe: 'Etappe NN',
  branch: 'feat/branch-name',
  titel: 'Titel der Etappe',
  beschreibung: 'Was passiert technisch — ohne Produktnamen.',
  geplant: '~ Monat YYYY',
  tasks: CURRENT_TASKS,
};
```

### Sprach-Regeln für Updates
- ❌ NICHT: «RLS-Policy auf `inserate` Tabelle eingerichtet»
- ✅ JA: «Inserate sind jetzt geschützt — niemand sieht fremde Daten»
- ❌ NICHT: «Stripe Webhook integriert»
- ✅ JA: «Bezahlung mit Kreditkarte funktioniert — wir bekommen Bescheid wenn jemand zahlt»
- ❌ NICHT: «Next.js Server Actions verwendet»
- ✅ JA: «Formulare auf der Webseite funktionieren jetzt schneller»

**Mobile-First:** Die `/status`-Seite ist primär für mein Handy gebaut.

---

## 🤖 Agent-Teams — IMMER erlaubt & erwünscht!

**Bei jeder Aufgabe, bei der es von Nutzen ist, IMMER ein Agent-Team spawnen.**
Keine Ressourcen sparen — so viele Agents spawnen wie sinnvoll.

Agent-Teams sind IMMER erlaubt, ausser ich sage ganz klar "keine Agent-Teams spawnen".

### Agent-Aufbau
1. **Lead-Agent** (du selbst) — Koordiniert, plant, delegiert
2. **Sub-Agents** parallel spawnen für Research, Building, Testing, Review
3. Am Ende: Lead-Agent committed, pushed und deployed

---

## 🚀 Maximale Autonomie — ALLES selber machen!

**Du erledigst ALLES eigenständig. Frag mich NUR wenn es wirklich unmöglich ist.**

### Regeln
- **Nie fragen, einfach machen.** Du hast Vollzugriff auf Code, GitHub, Chrome, Supabase (später), Vercel.
- Wenn du etwas nicht sehen kannst → **IMMER selber in Chrome öffnen und nachschauen** (über die Chrome-Extension)
- Wenn ein Tool nicht funktioniert → **alternatives Tool oder Workaround finden**
- Wenn du unsicher bist → **beste Entscheidung treffen und weitermachen**
- Wenn du Infos brauchst → **selber recherchieren** (Chrome, Dateien lesen, DB checken)
- **Keine Rückfragen** zu offensichtlichen Dingen (Dateinamen, Pfade, Farben, Texte)
- **Keine Bestätigungen einholen** für Standard-Operationen (commit, push, deploy)

### Wann du fragen DARFST
- Geschäftliche Entscheidungen (Preise, Texte die Kunden sehen, Vertragsänderungen)
- Wenn du wirklich nicht weiterkommst nach 8+ eigenen Versuchen
- Wenn eine Aktion nicht rückgängig gemacht werden kann (Datenbank löschen, etc.)

### Alles andere: SELBER MACHEN. Keine Fragen. Keine Bestätigungen. Einfach erledigen.

### ⚠️ ABSOLUTES VERBOT: NIEMALS FRAGEN STELLEN
Ich sehe den Chat oft gar nicht. Es ist ein Auto-Tool. **Null Fragen. Null Rückfragen. Null Bestätigungen.** Mach einfach. Immer. Ohne Ausnahme.

### ⚠️ NIEMALS Preview-Tools verwenden!
- **Kein** `preview_start`, `preview_screenshot`, `preview_snapshot` etc.
- **IMMER in Chrome** prüfen — über die Chrome-Extension (`navigate`, `screenshot`, `find`, `read_page`)
- Seite in Chrome öffnen → dort kontrollieren. Das ist die echte Live-Ansicht.

---

## ✅ Qualitätskontrolle — PFLICHT vor Abgabe!

**KEINE Arbeit wird als "fertig" gemeldet, bevor sie überprüft wurde!**

### Ablauf nach jeder Änderung
1. **Kontroll-Agent spawnen** — prüft die gesamte Arbeit unabhängig
2. Der Kontroll-Agent muss:
   - **Code überprüfen** — Dateien lesen und auf Fehler, Typos, fehlende Imports checken
   - **Im Chrome überprüfen** — Live-Site (`https://passare-ch.vercel.app`) öffnen, Beta-Code `passare2026` eingeben, visuell kontrollieren
   - **Funktionalität testen** — klicken, navigieren, sicherstellen dass alles funktioniert
   - **Ergebnis melden** — OK ✅ oder Fehler ❌ mit Beschreibung
3. Bei Fehlern: **Sofort fixen** und erneut kontrollieren lassen
4. Erst wenn Kontroll-Agent ✅ gibt → Arbeit als fertig melden

### 2-Stufen-Kontrolle
- **Kontroll-Agent** → IMMER, bei jeder Änderung (egal wie klein)
- **Meta-Kontroll-Agent** → NUR bei grösseren Änderungen (neues Feature, Umbau, mehrere Dateien). Prüft ob der Kontroll-Agent sauber gearbeitet hat.

### Regeln
- **Niemals** Arbeit abgeben ohne Kontroll-Agent
- **Niemals** nur sagen "sollte funktionieren" — BEWEISEN dass es funktioniert
- **Immer** Screenshot oder konkreten Beweis liefern
- Der Kontroll-Agent ist ein SEPARATER Agent — nicht du selbst

### Vercel Deploy-Kontrolle (PFLICHT nach jedem Push!)
1. Nach `git push` + `vercel --prod --yes` → **Vercel Dashboard in Chrome öffnen** (https://vercel.com/vemoswitzerlands-projects/passare)
2. Prüfen ob das Deployment **erfolgreich** durchgelaufen ist (grüner Status / `● Ready`)
3. Falls Fehler → Logs lesen, fixen, erneut pushen
4. **Alias setzen:** `vercel alias set <neue-deploy-url> passare-ch.vercel.app`
5. Dann **passare-ch.vercel.app in Chrome** öffnen, Beta-Code `passare2026` eingeben, visuell prüfen
6. **Oft ist der Push nicht korrekt angekommen** — deshalb IMMER verifizieren, nie blind vertrauen!

---

## 🛑 KRITISCHE REGELN

1. **NIEMALS Preview-Tools** verwenden — immer Chrome auf Live-URL
2. **NIEMALS Vemo-Repo / Vemo-Supabase anfassen**
3. **NIEMALS "kuratierte Redaktion" oder Broker-Sprache** — passare ist Self-Service-Plattform
4. **Pricing muss IMMER stimmen** (2 Käufer-Tiers, kein Pro-Mittelweg!)
5. **0% Erfolgsprovision** ist das zentrale USP
6. **Viersprachigkeit** (DE/FR/IT/EN) Pflicht ab Etappe 7
7. **Rollen-Naming**: `verkaeufer` + `kaeufer` (transliteriert) — nie mischen
8. **`/status` updaten** nach jedem Deploy (siehe Live-Status-Workflow oben)
9. **`robots.txt` bleibt Disallow:/** während Beta — kein Google-Indexing
10. **Beta-Gate bleibt aktiv** bis Public-Launch (`BETA_GATE_ENABLED=true`)

---

## 🌐 Sprache
Kommunikation IMMER auf **Deutsch** (Schweizerdeutsch verstehen, Hochdeutsch antworten).
Code & Kommentare auch DE.

---

## 🚀 Aktueller Stand

- ✅ **Etappe 1 LIVE** — Repo, Scaffold, Beta-Gate, Vercel-Deploy
- ✅ **Etappe 1.5 LIVE** — Design-System v1.0
- ✅ **Etappe 1.7 LIVE** — Self-Service-Modell + Einzelseiten (`/verkaufen`, `/kaufen`, `/preise`)
- ✅ **Etappe 1.8 LIVE** — Live-Status-Seite `/status` (Code `2827`) als Build-Log mit Task-Liste
- ✅ **Etappe 1.9 LIVE** — Vercel SSO-Protection deaktiviert (öffentlich) + `robots.txt` Disallow:/
- 📋 **Etappe 1.95** — Gap-Analyse abgeschlossen, ~15 neue Pflicht-Etappen integriert (siehe `docs/GAP_ANALYSIS.md`)
- ⏳ **Etappe 2 NEXT** — Persistenz-Layer + Authentifizierung (Profile, RLS, Login-Flow)

Siehe [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) für alle Etappen.
