# passare.ch — Email-Infrastruktur (Setup)

Komplette Anleitung zum Email-System mit **Lettermint** (Versand-API, EU) + **Supabase Edge Functions**.
Umzug von Resend: Bahn L7 des Vemo-Umzugs, gebaut 29.09.2026 (Plan
`_bau-berichte/mail-anbieter-2026-09-21/lettermint-umzug/UMZUGSPLAN.md`, Abschnitt C5).
Live ab dem Tag, an dem Schlüssel, Code und Edge Function zusammen umgestellt werden (Feuer-Zeile im Bericht der Bahn).

**Eine Datei kennt den Anbieter:** `supabase/functions/_shared/mail-anbieter.ts`. Beide Versand-Stellen
(Edge Function `send-email` und die Server-Action `src/app/verkaufen/start/actions.ts`) senden über sie.
Die Wand `supabase/functions/_shared/mail-anbieter.test.ts` hält das fest.

---

## 1. Lettermint-Projekt und Schlüssel

- Team «Vemo Group GmbH», Projekt **Passare** (Route `outgoing`, SMTP aus).
- Der Projekt-Schlüssel entsteht per Skript und geht direkt an seine zwei Orte, ohne dass ihn jemand sieht:
  `_bau-berichte/mail-anbieter-2026-09-21/lettermint-umzug/werkzeug/einrichten.sh --passare --freigabe-neuer-schluessel`
  (Vemo-Büro). Orte: Supabase-Secret `MAIL_API_TOKEN` (Projekt `ocbrjivpnsmxriyskgjx`) und Vercel-Env
  `MAIL_API_TOKEN` (Projekt passare, nur Production).

---

## 2. Domain `passare.ch` bestätigen (DKIM, Return-Path)

Die Einträge liefert Lettermint beim Anlegen der Domain (`einrichten.sh --passare-dns` druckt sie).
Bei **united-domains** (DNS-Provider von passare.ch) als CNAME eintragen:

| Type  | Name (Host)        | Wert (Value)                                   |
| ----- | ------------------ | ---------------------------------------------- |
| CNAME | `lm1._domainkey`   | `lm1.<kennung>.dkim.lmta.net` (von Lettermint) |
| CNAME | `lm2._domainkey`   | `lm2.<kennung>.dkim.lmta.net` (von Lettermint) |
| CNAME | `lm-bounces`       | `bounces.lmta.net`                             |

`_dmarc` (`v=DMARC1; p=none;`) und der SPF-Eintrag von passare.ch bleiben. Die alten Resend-Einträge
(`send`, `resend._domainkey`) bleiben bis nach der Resend-Kündigung stehen.

Status prüfen: `einrichten.sh --passare-pruefen` (Lettermint bestätigt jeden nötigen Eintrag).

---

## 3. Environment-Variablen

| Name | Supabase (Edge Functions) | Vercel (Server-Action) |
| ---- | ------------------------- | ---------------------- |
| `MAIL_API_TOKEN` | ja (per Skript) | ja (per Skript) |
| `EMAIL_FROM` | `passare <noreply@passare.ch>` (Standard im Code) | dito |
| `EMAIL_REPLY_TO` | `info@passare.ch` (Standard im Code) | – |

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind in Edge Functions automatisch gesetzt.
Das alte Secret (Name `RESEND_…`) wird erst gelöscht, wenn der neue Code live ist und der Code es nirgends mehr liest
(Wand `mail-anbieter.test.ts`, Regel b)
(erst Code, dann altes Geheimnis).

---

## 4. Migration einspielen

```bash
cd /Users/cyrill/Desktop/passare-new
supabase db push --project-ref ocbrjivpnsmxriyskgjx
```

Erstellt:
- `email_log` (Audit-Trail, RLS = nur Admin); ab `20260929200000_email_versand_sperre.sql` mit Versand-Sperre
  `versand_beansprucht_am` + Funktion `email_log_versand_beanspruchen(uuid)` (nur EIN Aufruf sendet eine Zeile)
- `email_settings` (key/value, RLS = nur Admin)
- Helper-Funktion `public.queue_email(...)` 
- Trigger auf `anfragen.INSERT` und `nda_signaturen.INSERT` (defensive — werden nur erstellt wenn Tabellen existieren)

---

## 5. Edge Functions deployen

```bash
cd /Users/cyrill/Desktop/passare-new
supabase functions deploy send-email      --project-ref ocbrjivpnsmxriyskgjx --no-verify-jwt
supabase functions deploy email-handler   --project-ref ocbrjivpnsmxriyskgjx --no-verify-jwt
supabase functions deploy auth-email-hook --project-ref ocbrjivpnsmxriyskgjx --no-verify-jwt
```

`--no-verify-jwt` ist nötig weil Supabase Auth Hooks (Welcome, Verify, Reset) anonym aufrufen.

### 5a. Auth-Email-Hook im Dashboard aktivieren (PFLICHT)

**Status 30.04.2026:** Edge-Function `auth-email-hook` ist deployed, aber der Hook ist im Auth-Dashboard noch NICHT aktiviert — deshalb kommen Bestätigungs-Mails noch mit dem Default-Supabase-Wording «Confirm your signup».

**Manueller Setup-Schritt:**
1. Supabase Dashboard → **Authentication → Hooks → Send Email Hook**
2. Type: **HTTPS**
3. URL: `https://ocbrjivpnsmxriyskgjx.supabase.co/functions/v1/auth-email-hook`
4. Secret generieren (UI gibt einen Wert mit Prefix `v1,whsec_…`)
5. Den Secret-Wert auch als Edge-Function-Secret hinterlegen:
   ```bash
   supabase secrets set \
     SEND_EMAIL_HOOK_SECRET="v1,whsec_…" \
     --project-ref ocbrjivpnsmxriyskgjx
   ```
6. Hook **enablen**

Danach gehen alle Auth-Mails (Signup-Verify, Password-Reset, Magic-Link) durch unsere `auth-email-hook` Edge-Function und werden mit dem passare-Branding über Lettermint verschickt.

---

## 6. Database Webhook einrichten (für Echtzeit-Versand)

Supabase Dashboard → **Database → Webhooks** → **Create webhook**:

- Name: `email-handler-on-insert`
- Table: `public.email_log`
- Events: ☑ Insert
- Type: **Supabase Edge Functions**
- Edge Function: `email-handler`
- HTTP Headers (optional): leer lassen — Service-Role wird intern genutzt

So wird bei jedem `queue_email(...)`-Insert sofort der Versand angeworfen. Latenz < 2 sec.

---

## 7. Cron-Fallback einrichten (für Reliability)

Falls der DB-Webhook ausfällt: Cron alle 5 min im Drain-Mode anstossen.

Supabase Dashboard → **Database → Cron** → **Create job**:

```sql
-- Job-Name: email-drain
-- Schedule: */5 * * * *   (alle 5 min)

select net.http_post(
  url     := 'https://ocbrjivpnsmxriyskgjx.supabase.co/functions/v1/email-handler',
  headers := jsonb_build_object(
    'Content-Type',  'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  ),
  body    := '{}'::jsonb
);
```

Hinweis: Service-Role-Key muss als DB-Setting hinterlegt sein (Project Settings → API → Custom secrets).

---

## 8. Auth-Mails (Stand 29.09.2026)

Supabase Auth (Sign-up, Password-Reset) versendet über den eingebauten Supabase-Mailer: kein Custom SMTP,
Send-Email-Hook nicht aktiviert (gemessen 29.09.2026). Wird der Hook (Schritt 5a) aktiviert, laufen die
Auth-Mails über `auth-email-hook` -> `send-email` -> Lettermint, ohne weitere Änderung.

---

## 9. Versand testen

### Manueller Test via curl

```bash
curl -X POST 'https://ocbrjivpnsmxriyskgjx.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{
    "template": "welcome",
    "to": "ok@lettermint.dev",
    "vars": { "name": "Cyrill" }
  }'
```

Erwartet: `200 { ok: true, log_id: "...", message_id: "..." }`; in `email_log` steht die Zeile auf `sent`,
die Lettermint-Kennung in `resend_id` (Spalte wird nach der Resend-Kündigung umbenannt).
`ok@lettermint.dev` ist die Test-Senke von Lettermint (keine echte Person).

### Templates lokal vorschauen (react-email)

```bash
npx react-email dev --dir emails
# öffnet http://localhost:3000 mit allen Templates
```

---

## 10. Logs / Debugging

- **Edge Function Logs:** Supabase Dashboard → Edge Functions → `send-email` → Logs
- **Email-Audit:** SQL `select * from public.email_log order by created_at desc limit 50;`
- **Lettermint:** Projekt «Passare» → Messages. Ausgang je Empfänger aus den Ereignissen lesen, nicht aus dem
  Status der Nachricht (Lettermint zeigt dort den schlechtesten Ausgang über alle Empfänger; passare sendet
  jede Mail an genau einen Empfänger).

---

## 11. Templates erweitern

1. Neue Datei `emails/EmailFoo.tsx` (für Design-Preview)
2. In `supabase/functions/_shared/render.ts` Template-Funktion `tplFoo()` ergänzen
3. In `KNOWN_TEMPLATES` und `renderEmail()`-Switch eintragen
4. Migration: `email_template`-Enum erweitern via `alter type … add value 'foo';`
5. Edge Functions neu deployen

---

## Troubleshooting

| Symptom | Ursache | Fix |
|---|---|---|
| `503 mail_token_missing` | Secret `MAIL_API_TOKEN` fehlt | `einrichten.sh --passare-pruefen` (zeigt, wo er fehlt) |
| `anbieter_422: …` | Domain bei Lettermint nicht bestätigt | DNS prüfen (Schritt 2), `einrichten.sh --passare-pruefen` |
| `anbieter_409: …` | derselbe Schlüssel (log_id) schon mit anderem Inhalt benutzt | Mail ging vermutlich schon hinaus; nicht blind erneut senden |
| `202 laeuft_schon` | ein anderer Aufruf sendet dieselbe Zeile gerade | nichts tun (Versand-Sperre wirkt) |
| Email landet im Spam | DMARC fehlt | TXT `_dmarc` setzen (siehe Schritt 2) |
| Webhook feuert nicht | DB-Webhook nicht aktiv | Dashboard → Webhooks → Status prüfen |
| `email_log.status` bleibt `queued` | Handler-Webhook fehlt | Schritt 6 nachholen ODER Cron (Schritt 7) aktivieren |

---

## Architektur (TL;DR)

```
Trigger-Quellen
├─ Supabase Auth (Verify / Reset)             → Supabase-Mailer (Hook aus)
├─ Smart-Bewertung (Server-Action)            → _shared/mail-anbieter.ts → Lettermint
├─ App-Code (z.B. /api/zahlung-ok)            → POST /functions/v1/send-email
└─ Postgres-Trigger (anfragen, nda)            → queue_email() → email_log INSERT
                                                                     ↓
                                                  DB-Webhook → email-handler
                                                                     ↓
                                                              send-email
                                                          (Versand-Sperre je Zeile)
                                                                     ↓
                                                  _shared/mail-anbieter.ts → Lettermint API
                                                          (Idempotency-Key = log_id)
                                                                     ↓
                                                              email_log.UPDATE
                                                              (status=sent|failed)
```
