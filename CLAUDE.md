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
- **Live-Domain:** https://passare.ch (später) / https://passare.vercel.app (sofort)
- **Vercel-Projekt:** `passare` (NICHT vemo-academy!)
- **Supabase-Projekt:** Noch zu erstellen, separater DB-Host

---

## 📖 Projekt-Kontext

**Was ist passare.ch?**
Die neue Schweizer Plattform für Firmen-Verkauf (KMU) — konkurriert mit
firmenzukaufen.ch, companymarket.ch, axial.net.

**Zielgruppen:**
- Verkäufer (KMU-Inhaber mit Nachfolge-Bedarf)
- Käufer (MBO / MBI / strategische Investoren)
- Broker (M&A-Berater, Treuhänder)
- Admin (intern passare)

**USP:**
1. Vierprachig (DE/FR/IT/EN) von Tag 1
2. Moderne Mobile-First UX
3. Öffentliches Bewertungstool als Lead-Magnet
4. Keine Erfolgsprovision (transparentes Pricing)
5. Schweizer Firmen-Atlas als Discovery-Tool

---

## 🛠️ Tech-Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS + custom Passare-Palette |
| UI | Custom Components (shadcn-kompatibel, eigenes Design System) |
| DB + Auth | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Payments | Stripe Checkout + Webhooks |
| Email | Resend + React Email |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Maps | MapLibre GL JS |
| Zefix | Schweizer Handelsregister API |
| i18n | next-intl (DE/FR/IT/EN) |
| Forms | react-hook-form + Zod |
| Hosting | Vercel (Edge + Serverless) |
| Analytics | Plausible (+ Sentry für Errors) |

---

## 🗺️ DER MASTER PLAN

**Die vollständige Roadmap** liegt in [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md).
Sie enthält **160 Etappen** in 16 Blöcken (A–P).

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
(Gleicher GitHub-Account wie Vemo, aber eigenes Repo — das ist OK.)

### 2. Im MASTER_PLAN.md schauen welche Etappe dran ist
```bash
grep -E "^###.*⏳" docs/MASTER_PLAN.md
```

### 3. Etappe implementieren (tief + vollständig)
- Code schreiben
- DB-Migrations wenn nötig (`supabase/migrations/NNN_xxx.sql`)
- Tests/Verifikation
- MASTER_PLAN.md aktualisieren (✓ hinter die Etappe)

### 4. Commit + Push
```bash
git add .
git commit -m "Etappe N: <Titel>"
git push origin main
```

### 5. Vercel-Deploy verifizieren
- Chrome → vercel.com/vemoswitzerlands-projects
- Prüfen: Deploy-Status grün?
- Falls rot: Logs lesen, fixen, neu pushen.

### 6. Live-Verifikation auf passare.ch
- Chrome → https://passare.ch (oder passare.vercel.app)
- Beta-Code eingeben (siehe Vercel Env Vars)
- Funktionalität der neuen Etappe manuell durchklicken
- Screenshot zur Bestätigung

### 7. Im Chat berichten
- Welche Etappe abgeschlossen
- Was genau implementiert
- Deploy-Link
- Nächste Etappe benennen

---

## 🎨 Design-Prinzipien

- **Farben:** Strikt aus der Passare-Palette (siehe `tailwind.config.ts`)
  - `deep` (#0E2A2B) = Primary dark
  - `terra` (#B54A2B) = Akzent warm
  - `cream` (#F7F2EA) = Hintergrund
  - `sand`, `lightmid`, `gold`, `forest`, `ink`, `paper` für weitere Tonsflächen
- **Fonts:** `Cormorant Garamond` (Serif für Headlines) + `Outfit` (Sans für Body)
- **Stil:** Edel, zurückhaltend, schweizerisch, vertrauensvoll — KEIN Bootstrap-Look
- **Abstände:** Grosszügig (py-16 bis py-24 für Sections)
- **Corners:** Meist `rounded-lg` oder `rounded-2xl`, keine scharfen Ecken
- **Schatten:** Sehr dezent (`shadow-sm` max), lieber Borders
- **Animationen:** Dezent, Fade+Slide (`animate-fade-in`, `animate-slide-up`)

---

## 🔐 Security-Regeln

1. **RLS zwingend** auf jeder neuen Tabelle
2. **Service-Role-Key** nur in Server-Code (`SUPABASE_SERVICE_ROLE_KEY`)
3. **Inputs validieren** mit Zod (Server + Client)
4. **Niemals secrets im Repo** — `.env.local` ist in `.gitignore`
5. **Beta-Gate bleibt aktiv** bis Public Launch (Flag `BETA_GATE_ENABLED`)
6. **Alle sensiblen Aktionen** ins `events_log` schreiben

---

## 🌐 i18n-Regeln (ab Etappe 7 verbindlich)

- Kein hardcoded Text in Komponenten
- Alle Strings via `t('key')` aus `messages/[locale].json`
- Preise in CHF mit `formatCHF()` aus `@/lib/utils`
- Datum mit `formatDate()` (nimmt Locale)

---

## 🧪 Verifikation — PFLICHT vor «fertig»-Meldung

1. **TypeScript check:** `npm run typecheck` muss grün sein
2. **Build local:** `npm run build` ohne Errors
3. **Git push:** auf `main`
4. **Vercel-Deploy:** Status grün (Chrome)
5. **Live-Test:** im Chrome auf passare.ch/vercel.app die neue Funktion durchklicken
6. **Screenshot:** als Beweis

Niemals «sollte funktionieren» — immer BEWEISEN dass es funktioniert.

---

## 🗣️ Sprache

Kommunikation mit Cyrill: **immer auf Deutsch** (er spricht Schweizerdeutsch,
versteht aber Hochdeutsch). Code & Kommentare auch DE.

---

## 🚀 Aktueller Stand

- ✅ **Etappe 1 LIVE** — Repo, Scaffold, Beta-Gate, Deploy
- ⏳ **Etappe 2 NEXT** — Supabase-Setup + Core Migrations (`profiles` Tabelle, RLS)

Siehe [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) für alle 160 Etappen.
