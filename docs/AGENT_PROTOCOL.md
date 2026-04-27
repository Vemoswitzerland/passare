# 🤖 Agent-Protokoll — Pflicht für jeden passare-Chat

> **Diese Datei MUSS jeder Chat lesen, bevor er irgendwas tut.**
> Sie ergänzt CLAUDE.md um harte Regeln für Tracking, Status-Updates und Konflikt-Vermeidung beim parallelen Arbeiten.

---

## ✅ Vor dem Start (jede Session, nicht verhandelbar)

```bash
cd /Users/cyrill/Desktop/passare-new
git config user.email "info@vemo.ch"
git config user.name "Vemoswitzerland"
git pull --rebase origin main      # Parallele Agents im Repo!
```

Wenn das Repo nicht existiert:
```bash
gh repo clone Vemoswitzerland/passare /Users/cyrill/Desktop/passare-new
```

---

## 💰 Token-Tracking (Pflicht)

**Jeder Chat trägt seinen eigenen Verbrauch in `src/data/agent-tokens.ts` ein.**
Wird live auf `/status` (Code 2827) für Cyrill angezeigt.

### Wann eintragen
- **Beginn der Session:** Entry oben in `SESSIONS` mit `status: 'live'` + initialen Schätzwerten (z.B. `inputTokens: 50_000` als Start)
- **Während der Arbeit:** Werte hochzählen (alle ~10 grössere Tool-Calls neu schätzen)
- **Ende der Session:** Status auf `'done'` + finale Tokens

### Schätzungs-Faustregel (Opus 4.7)
| Aktion | Input-Tokens (ca.) |
|---|---|
| Read kleines File (<100 Zeilen) | 1k |
| Read grosses File (1000+ Zeilen) | 12k |
| Bash-Command (kurz) | 0.5k |
| Bash-Command (mit grossem Output) | 5–20k |
| Grep / Glob (Standard) | 1–3k |
| Chrome-Screenshot | 8k |
| User-Message lesen | je 0.5k pro 100 Wörter |
| **Output-Tokens:** | **chars / 3.5** |

### Pricing (Stand 2026-04-27)
- **Input:** $15 / 1M Tok
- **Output:** $75 / 1M Tok
- **Cache Read:** $1.50 / 1M Tok
- **Cache Write:** $18.75 / 1M Tok
- **USD → CHF:** × 0.91

### Beispiel-Entry für `src/data/agent-tokens.ts`
```ts
{
  date: '2026-04-27',
  bereich: 'admin',                // siehe AgentBereich-Type
  titel: 'Admin-Tabellen + UI + RLS',
  inputTokens: 800_000,
  outputTokens: 250_000,
  status: 'done',                  // 'live' während der Arbeit
},
```

### Token-Report-Block (am Ende jeder Session ins Chat-Output)
Nach Abschluss eines Tasks gib Cyrill diesen Block aus:
```
┌─────────────── TOKEN-REPORT ───────────────┐
│ Diese Session (Bereich: <NAME>):            │
│   Input:        XXX'XXX Tokens              │
│   Output:        XX'XXX Tokens              │
│   Cache Read:   XXX'XXX Tokens              │
│   ─────────────────────────────────         │
│   Kosten:       $XX.XX  (≈ CHF YY.YY)       │
│                                              │
│ Gesamt passare (alle Sessions):             │
│   Tokens:       ~X.X Mio                    │
│   Kosten:       ~$XXX  (≈ CHF YYY)          │
└──────────────────────────────────────────────┘
```

---

## 📡 Status-Update (Pflicht nach jedem Deploy)

Siehe CLAUDE.md → "LIVE-STATUS-SEITE". Kurz:
1. `src/data/updates.ts` → oben neue Entry in `UPDATES` einfügen
2. Bei neuer Etappe: `CURRENT_STEP` aktualisieren
3. Sprache: für Nicht-Techniker. Keine Software-Namen (Supabase/Vercel/Stripe/Fraunces).

---

## 🚧 Konflikt-Vermeidung beim parallelen Arbeiten

Mehrere Chats arbeiten gleichzeitig im selben Repo. Damit nichts kollidiert:

### 1. Migration-Timestamps sind reserviert pro Bereich
| Bereich | Timestamp-Slot |
|---|---|
| Admin | `20260427180000_*` |
| Verkäufer | `20260427181000_*` |
| Käufer | `20260427182000_*` |
| Lead-Magnete | `20260427183000_*` |
| Email | `20260427184000_*` |
| Stripe | `20260427185000_*` |
| Zefix + AI | `20260427186000_*` |
| SEO + Inserat-Detail | (keine Migration) |

Wenn dein Bereich nicht in der Liste ist, wähle einen Timestamp `>= 20260427187000`.

### 2. Routes sind disjunkt
| Bereich | Routes |
|---|---|
| Admin | `/admin/*` |
| Verkäufer | `/dashboard/verkaeufer/*` |
| Käufer | `/dashboard/kaeufer/*` |
| Lead-Magnete | `/atlas`, `/bewerten`, `/ratgeber/*` |
| Stripe | `/api/stripe/*` |
| Zefix + AI | `/api/zefix/*`, `/api/ai/*` |
| SEO | `/inserat/[id]`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx` |
| Email | nur `emails/*` + `supabase/functions/send-email/*` |

**Niemals** Files in einem Bereich anfassen, der nicht deiner ist.

### 3. Geteilte Files — Append-only oben
- `src/data/updates.ts` → neue Entry oben in `UPDATES`
- `src/data/agent-tokens.ts` → neue Entry oben in `SESSIONS`

Diese Dateien dürfen alle Chats anfassen, **aber nur oben einfügen** — nie alte Entries verändern. So mergt git rebase sauber.

### 4. Vor jedem `git push`
```bash
git pull --rebase origin main
```
Bei Konflikten: solve, dann nochmal push.

---

## 🛡️ Defensive DB-Reads

Wenn dein Bereich Tabellen aus anderen Bereichen liest (z.B. Käufer liest `inserate` aus Verkäufer-Bereich):

```sql
-- Erst prüfen ob Tabelle existiert
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'inserate'
);
```

Im Code: bei `null`/Fehler → Fallback zu `LISTINGS` Demo-Array aus `src/app/page.tsx`.

---

## 🚀 Deploy-Pflicht

Nach JEDER Änderung:
```bash
git pull --rebase origin main
git add <konkrete-files>          # NIE git add -A bei parallelen Chats!
git commit -m "..."
git push origin main
vercel --prod --yes
```

Verify in Chrome (NIE Preview-Tools):
- https://passare.ch — visueller Check
- https://passare.ch/<deine-route> — Funktionalität

---

## ⚠️ Verbote

- ❌ Niemals `git add -A` oder `git add .` (kann fremde uncommitted Files mitnehmen)
- ❌ Niemals Migrations löschen oder umbenennen
- ❌ Niemals `src/app/page.tsx` oder `src/app/layout.tsx` anfassen (es sei denn dein Bereich ist explizit dort)
- ❌ Niemals Vemo-Repo (`/Users/cyrill/Desktop/vemo-academy/`) berühren
- ❌ Niemals fragen — siehe CLAUDE.md "ABSOLUTES VERBOT: NIEMALS FRAGEN STELLEN"
- ❌ Niemals Preview-Tools (`preview_start` etc.) — immer Chrome auf Live-URL

---

## 📋 Checkliste vor Session-Ende

- [ ] Alle Code-Änderungen committed?
- [ ] `git push origin main` durch?
- [ ] `vercel --prod --yes` durch?
- [ ] Live-Verify in Chrome OK?
- [ ] `src/data/updates.ts` neue Entry oben?
- [ ] `src/data/agent-tokens.ts` Entry auf `status: 'done'` + finale Tokens?
- [ ] Token-Report-Block im Chat ausgegeben?

Erst wenn alle ✅ → Session-Ende.
