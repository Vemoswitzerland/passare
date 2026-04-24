# passare.ch

> **Die Schweizer Plattform für den Kauf und Verkauf von KMU.** Diskret. Professionell. Vierprachig.
> Aktuell im geschlossenen Beta.

---

## Status

🚧 **In aktiver Entwicklung** — siehe [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) für alle 160 Etappen.

- ✅ **Etappe 1** — Repo, Scaffold, Beta-Gate, Deploy (LIVE)
- ⏳ **Etappe 2** — Supabase Setup (NEXT)

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

- **[MASTER_PLAN.md](docs/MASTER_PLAN.md)** — Die 160-Etappen-Roadmap
- **[INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)** — Architektur & Datenmodell
- **[CLAUDE.md](CLAUDE.md)** — Anweisungen für die KI-Entwicklung

---

## Lizenz

© 2026 passare.ch — Alle Rechte vorbehalten.
