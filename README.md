# passare.ch

> **Die Schweizer Plattform für den Kauf und Verkauf von KMU.** Diskret. Professionell. Viersprachig.
> Aktuell im geschlossenen Beta.

---

## Status

🚧 **In aktiver Entwicklung** — siehe [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) für alle 196 Etappen (15 aus Gap-Analyse + 21 aus Persona-Walkthrough integriert).

- ✅ **Etappe 1** — Repo, Scaffold, Beta-Gate, Deploy
- ✅ **Etappe 1.5** — Design-System v1.0 (Fraunces + Geist, Navy/Bronze/Cream)
- ✅ **Etappe 1.7** — Self-Service-Modell + Einzelseiten (`/verkaufen`, `/kaufen`, `/preise`)
- ✅ **Etappe 1.8** — Live-Status-Seite `/status` (Build-Log + Tasks, Pin-Code-Gate `2827`)
- ✅ **Etappe 1.9** — Vercel SSO-Protection deaktiviert + `robots.txt` Disallow:/
- ⏳ **Etappe 2** — Persistenz-Layer + Authentifizierung (NEXT)

**Live:** https://passare-ch.vercel.app · Beta-Code: `passare2026`
**Status (intern):** https://passare-ch.vercel.app/status · Code: `2827`

---

## Tech-Stack

Next.js 15 · React 19 · TypeScript · Tailwind · Supabase · Stripe · Resend · Claude · MapLibre · next-intl

Mehr unter [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md).

---

## Development

```bash
# 1. Git-Config setzen (einmalig pro Chat-Session)
git config user.email "info@vemo.ch"
git config user.name "Vemoswitzerland"

# 2. Dependencies installieren
npm install

# 3. Env vars
cp .env.example .env.local
# fülle Supabase, Stripe, Resend, Claude keys ein

# 4. Dev-Server
npm run dev
```

Lokal: http://localhost:3000 — Beta-Gate: Code aus `.env.local`.

---

## Deployment

Push auf `main` → automatischer Vercel-Deploy auf `passare.ch`.

---

## Projekt-Struktur

```
src/
  app/                  # App Router (Next.js 15)
    api/                # API-Routes
    (public)/           # öffentliche Seiten
    (auth)/             # Auth-Flows
    dashboard/          # User-Dashboards
    admin/              # Admin-Panel
    [locale]/           # i18n-Routing (ab Etappe 7)
  components/
    ui/                 # Basiskomponenten (shadcn-style)
    layout/             # Nav, Footer, Sidebar
    sections/           # Landingpage-Blöcke
    dashboard/          # Dashboard-spezifisch
  lib/
    supabase/           # Supabase Client (browser + server)
    utils.ts            # Formatters, cn(), slugify
    zefix.ts            # Zefix-API-Wrapper
    stripe/             # Stripe helpers
  middleware.ts         # Beta-Gate + i18n

supabase/
  migrations/           # SQL-Migrations (versioniert)
  functions/            # Edge Functions (Deno)

messages/
  de.json fr.json it.json en.json     # i18n-Strings

docs/
  MASTER_PLAN.md        # Alle 160 Etappen
  INFRASTRUCTURE.md     # Architektur
  CHANGELOG.md          # Release-Notes (kommt)

public/
  ch-cantons.json       # GeoJSON Kantone
  images/               # statische Assets
```

---

## Dokumentation

- **[CLAUDE.md](CLAUDE.md)** — Globale Anweisungen für die KI-Entwicklung (Pflicht-Read pro neuem Chat)
- **[MASTER_PLAN.md](docs/MASTER_PLAN.md)** — Die 196-Etappen-Roadmap
- **[INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)** — Architektur & Datenmodell
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** — Farben, Fonts, Komponenten, Motion
- **[COMPETITOR_RESEARCH.md](docs/COMPETITOR_RESEARCH.md)** — Markt-Analyse (companymarket.ch)
- **[GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md)** — Gap-Analyse mit zusätzlichen Pflicht-Etappen
- **[PERSONA_WALKTHROUGH.md](docs/PERSONA_WALKTHROUGH.md)** — Walkthrough aus User-Sicht

---

## Lizenz

© 2026 passare.ch — Alle Rechte vorbehalten.
