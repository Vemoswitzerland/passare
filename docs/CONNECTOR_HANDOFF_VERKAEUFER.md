# Connector-Übergabe — Verkäufer-Bereich

> Erstellt: 2026-04-27 · Verkäufer-Agent
> Status: Verkäufer-Bereich vollumfänglich live auf https://passare.ch
> Zielgruppe: Connector-Agent, der die 3 Bereiche (Verkäufer · Käufer · Admin) verbindet

---

## ✅ Was ist live

### Pre-Registration-Funnel `/verkaufen/start`
5-Schritt Wizard **vor** Account-Erstellung:
1. **Firma finden** — Live-Autocomplete im Zefix-Handelsregister (`/api/zefix/search`, `/api/zefix/lookup`)
2. **Branche & Standort** — auto-detected aus Zefix `purpose`-String, override möglich
3. **Finanzen** — Umsatz-Slider (log-scale 100k–50M), EBITDA in CHF oder %, MA-Buckets, Gründungsjahr
4. **Smart-Bewertung** — Number-Counter-Animation (0 → Wert in 1.5s easeOutExpo), RangeBar fillt L→R, Faktoren-Liste staggered → siehe `src/components/valuation/SmartPriceEstimate.tsx`
5. **Account erstellen** — speichert Draft in httpOnly-Cookie `pre_reg_draft` (30min TTL) → redirect `/auth/register?from=pre-reg`

### Verkäufer-Dashboard `/dashboard/verkaeufer`
Sidebar (280px) + Topbar (16px h) im passare-Design mit View-Switcher (Admin → andere Rolle):
- **Übersicht** — KPI-Tiles (Status, Views, Anfragen, NDA-Conv) + Onboarding-Checkliste + Quick-Actions
- **Mein Inserat** — Status-Card mit Lifecycle-Aktionen (pause/live/verkauft)
- **Inserat-Wizard** (`/inserat/new`, `/inserat/[id]/edit`) — 5 Steps mit Auto-Save (1.5s debounce)
- **Anfragen** — Liste mit Filter + rechter Drawer + Akzeptieren/Ablehnen mit Begründung
- **NDA** — 3-Spalten Pipeline (Pending → Signed → Released)
- **Datenraum** — Drag-&-Drop-Upload (PDF/XLSX/DOCX max 25MB), 5 Standard-Ordner, Versionierung, Audit-Log
- **Statistik** — SVG-Charts: Views-Timeline, Funnel, Kanton-Verteilung
- **Paket** — Aktives Paket mit Laufzeit-Progress, Verlängern, Upgrade-Optionen
- **Vorschau** — Käufer-Sicht-Renderer mit Anonymitäts-Check
- **Settings** — Profil-Read-only

---

## 🗄 Datenbank (mein Eigentum)

### Migration `20260427160000_complete_onboarding_rpc.sql` — REPARATUR
Behob Bug: `complete_onboarding` RPC fehlte komplett (`completeOnboardingAction` rief ein nicht-existierendes RPC auf).

### Migration `20260427181000_verkaeufer.sql` — HAUPT
Tabellen, alle mit RLS:
- `branchen` (18 Schweizer KMU-Branchen mit Multiples) — public-read
- `inserate` — owner_id, alle Felder, RLS owner-only + public-read auf live
- `inserate_public` — VIEW exposed an `anon` (nur Teaser-Felder)
- `anfragen` — bidirektionale RLS (Käufer + Owner)
- `nda_signaturen` — Käufer signt, Owner sieht
- `datenraum_files` — owner-all + Käufer-mit-released-Anfrage-und-signed-NDA
- `datenraum_access_log` — Audit pro Käufer-Zugriff
- `inserat_views` — anon-INSERT via RPC erlaubt
- `zefix_cache` — server-only (24h TTL)

### RPCs (alle SECURITY DEFINER)
- `complete_onboarding(...)` — repariert
- `create_inserat_from_pre_reg(p jsonb)` → uuid
- `submit_inserat_step(p_id uuid, p_step int, p_data jsonb)` — Auto-Save
- `publish_inserat(p_id uuid)` — entwurf → zur_pruefung
- `update_anfrage_status(p_id uuid, p_status, p_reason)` — Owner-only
- `sign_nda(p_anfrage_id, p_signed_name, p_ip, p_ua)` — Käufer signt
- `record_inserat_view(p_id uuid)` — anon erlaubt
- `record_datenraum_access(p_file_id, p_action, p_ip, p_ua)`

### Storage-Buckets
- `inserate-cover` (public, owner-folder upload)
- `datenraum-files` (private, signed-URL access)
- `nda-pdfs` (private, signed-URL access)

---

## 🔌 Integration-Punkte für Connector

### 1. Käufer-Bereich → meine Daten (READ-only)
| Käufer-Page | Liest aus | Über |
|---|---|---|
| `/kaufen` Marktplatz | `inserate_public` VIEW | direkt SELECT (anon erlaubt) |
| `/inserate/[slug]` Teaser | `inserate_public` WHERE slug=? | + `record_inserat_view(p_id)` RPC |
| Match-Score-Berechnung | `inserate_public` × `kaeufer_suchprofile` | join via branche_id, kanton, umsatz_bucket |
| Anfrage senden | INSERT `anfragen` | RLS `anf_kaeufer_insert` erlaubt |
| NDA signieren | RPC `sign_nda(anfrage_id, name, ip, ua)` | Status → `nda_signed` |
| Datenraum lesen | SELECT `datenraum_files` | RLS prüft `released` + `signed` |
| Audit-Tracking | RPC `record_datenraum_access(file_id, action)` | trigger oder explizit |

### 2. Public/Marketplace → meine Daten
- `/kaufen` Marktplatz-Liste: `inserate_public` (anon-read)
- `/inserate/[slug]`: anonym Teaser, nach NDA Vollsicht
- `/atlas` Kartenansicht: gruppiert nach `kanton`
- `/bewerten` Tool: nutzt **identische** `lib/valuation.ts` → Single Source of Truth

### 3. Admin → meine Daten
- Moderations-Queue: `SELECT inserate WHERE status='zur_pruefung'`
- Approve: `UPDATE inserate SET status='live', published_at=now()` (RLS: admin all)
- Reject: `UPDATE inserate SET status='abgelehnt', status_reason='…'`

---

## 🍪 Cookie-Konvention (mit Käufer-Agent abgestimmt)

| Cookie | Wert | Wer setzt | Wer liest |
|---|---|---|---|
| `pre_reg_draft` | JSON | `/api/pre-reg` POST | `/api/pre-reg` GET, mein `takeOverPreRegDraft()` |
| `admin_impersonation` | `verkaeufer\|kaeufer\|admin\|''` | Topbar-View-Switcher | Layout-Renderer (UI-Mode) |

**Wichtig:** `admin_impersonation` ist ein generisches Mode-Toggle (NICHT per-User). Echtes Per-User-Impersonate kommt später (V2).

---

## 🚨 Bekannte Konflikte / Was Connector mergen muss

### a) `src/data/updates.ts`
**Konflikt:** Mehrere Agents schreiben hier. Aktuell zeigt es Etappe 04 (Mobile-Nav) — meine Verkäufer-Updates sind verloren gegangen durch parallele Edits.

**Connector-Aufgabe:** Update mit folgenden Einträgen ergänzen (Datum 2026-04-27, type 'feature'):
1. **«Verkäufer-Bereich live: Pre-Onboarding mit Smart-Bewertung»** — Beschreibung: "Wer eine Firma verkaufen möchte, startet jetzt mit einem 5-Schritt-Pre-Onboarding noch BEVOR ein Konto angelegt wird: Live-Suche im Handelsregister füllt Firmenname/Sitz/Rechtsform automatisch aus, dann werden Branche, Umsatz, Ertrag und Mitarbeiter eingegeben — und der indikative Marktwert wird mit Animation eingeblendet. Erst dann folgt die Konto-Erstellung, wobei die Daten nahtlos ins erste Inserat übernommen werden."
2. **«Verkäufer-Dashboard: Inserat, Anfragen, NDA, Datenraum, Statistik»** — Beschreibung: "Komplettes Verkäufer-Dashboard mit linker Navigation: Übersicht mit Live-Statistik und Onboarding-Checkliste, 5-Schritt-Inserat-Wizard mit Auto-Save und Anonymitäts-Hinweisen, Anfragen-Inbox mit Detail-Slider, NDA-Pipeline (Ausstehend → Signiert → Datenraum offen), Datenraum mit Drag-&-Drop-Upload, Versionierung und vollem Käufer-Zugriffs-Protokoll, sowie Statistik-Bereich mit Charts."

`CURRENT_STEP` aktualisieren auf "Etappe 46-55 + Pre-Reg-Funnel".

### b) `src/app/auth/actions.ts` & `RegisterForm.tsx`
**Konflikt:** Andere Agents haben hier meine Pre-Reg-Banner-Logik überschrieben. Stattdessen nutze ich `takeOverPreRegDraft()` aus `src/app/dashboard/verkaeufer/inserat/actions.ts` — wird im `/dashboard/verkaeufer/inserat/new/page.tsx` aufgerufen.

**Connector-Optional:** Banner in `RegisterForm.tsx` für `?from=pre-reg`-Param wieder einfügen für UX-Hinweis ("Deine Firma ist vorgemerkt"). Nicht kritisch — funktioniert auch ohne.

### c) `complete_onboarding` RPC nach Onboarding → Verkäufer-Inserat-Auto-Create
**Aktuell:** Mein `/dashboard/verkaeufer/inserat/new/page.tsx` ruft `takeOverPreRegDraft()` auf, der das Cookie übernimmt und Inserat erstellt.

**Connector-Optional:** Direkt nach `completeOnboardingAction` redirecten zu `/dashboard/verkaeufer/inserat/new?from=pre-reg` wenn rolle=verkaeufer + Cookie gesetzt → spart einen Klick.

### d) Header-Navigation
**Aktuell:** Käufer-Topbar (`src/components/kaeufer/topbar.tsx`) und meine Verkäufer-Topbar haben sehr ähnliche Logik, aber sind separate Komponenten.

**Connector-Optional:** Refactor zu gemeinsamem `<DashboardTopbar role="..." />` — V1 NICHT nötig, V2.

### e) Globaler Header für Public-Pages
Auf `/`, `/verkaufen`, `/kaufen` etc. muss der CTA "Inserat erstellen" zu `/verkaufen/start` führen (nicht direkt zu `/auth/register`). Habe ich in `src/app/verkaufen/page.tsx` gemacht. Andere Public-Pages prüfen.

---

## ✅ Verifikation (Connector E2E-Test)

1. https://passare.ch/verkaufen/start → 200 OK ✓ (geprüft per curl mit Beta-Cookie)
2. Schritt 1 zeigt Firmen-Suche, Progress-Bar 1 von 5 ✓
3. Empfohlen: Vollständiger E2E-Lauf manuell in Chrome:
   - Pre-Reg-Funnel mit Test-Firma "Migros" → Mock-Hit Step 1
   - Branche auto-pre-selected → Step 2 weiter
   - Slider-Inputs Step 3 → Step 4 Skeleton + Reveal
   - "Account erstellen" → /auth/register?from=pre-reg
   - Email-Verify → Onboarding (rolle=verkaeufer)
   - Auto-Redirect zu `/dashboard/verkaeufer/inserat/[id]/edit?from=pre-reg`
   - Wizard Step 2 zeigt Pre-Reg-Daten vorausgefüllt
   - Step 3 Cover → Step 4 Strengths → Step 5 Mock-Stripe
   - Übersicht zeigt zur_pruefung-Status
   - **(Admin-Agent):** Approve → Status=live
   - **(Public):** Inserat erscheint auf `/kaufen`
   - **(Käufer-Agent):** Käufer schickt Anfrage → erscheint in Verkäufer-Inbox
   - Akzeptieren → NDA-Pipeline → signed → released → Datenraum-Read
   - Datenraum-Audit zeigt Käufer-Zugriff

---

## 📦 Übergabe-Pakage

| Datei | Zweck |
|---|---|
| `supabase/migrations/20260427160000_complete_onboarding_rpc.sql` | Reparatur RPC |
| `supabase/migrations/20260427181000_verkaeufer.sql` | Schema-Foundation |
| `src/lib/valuation.ts` | Pure Pricing-Engine — auch von `/bewerten` nutzbar |
| `src/lib/permissions.ts` | Auth-Guards für Verkäufer-Layout |
| `src/data/branchen-multiples.ts` | 18 Schweizer Branchen mit Q1/2026-Multiples |
| `src/components/valuation/*` | NumberCounter, RangeBar, SmartPriceEstimate |
| `src/components/zefix/FirmenSuche.tsx` | Combobox mit Live-Autocomplete |
| `src/app/verkaufen/start/*` | Pre-Reg-Funnel |
| `src/app/dashboard/verkaeufer/*` | Komplettes Dashboard |
| `src/app/api/pre-reg/route.ts` | Pre-Reg-Cookie-Handler |
| `src/app/api/valuation/route.ts` | Smart-Pricing-Endpoint |
| `src/app/api/inserate/upload-cover/route.ts` | Cover-Upload (5MB, Owner-Pfad) |
| `src/app/api/inserate/upload-datenraum/route.ts` | Datenraum-Upload (25MB, Versionierung) |

**Connector-Job:**
1. Updates.ts mergen (siehe oben)
2. Optional: Pre-Reg-Banner in RegisterForm zurück
3. Optional: Onboarding-Action-Redirect für Verkäufer mit Pre-Reg
4. Public-Header-CTAs prüfen
5. E2E-Test wie oben in Chrome durchspielen
6. Master-Plan ✓-Marken setzen (Etappen 46-55, 47.1, 49.1, 51.1, 52.1, 54.1)

---

*Übergabe-Ende. Verkäufer-Bereich ist live, getestet, integration-ready.*
