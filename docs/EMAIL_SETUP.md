# passare.ch — Email-Infrastruktur (Setup)

Komplette Anleitung zum Aufsetzen des Email-Systems mit **Resend** + **Supabase Edge Functions**.

---

## 1. Resend-Account anlegen

1. Account erstellen: https://resend.com/signup
   - Empfehlung: mit `info@vemo.ch` registrieren (gleicher Eigentümer wie passare.ch)
   - Team: «Vemo Switzerland»
2. Im Dashboard → **API Keys** → **Create API Key**
   - Name: `passare-prod`
   - Permission: **Sending access**
   - Wert kopieren (beginnt mit `re_…`) — wird in Vercel + Supabase gespeichert

---

## 2. Domain `passare.ch` verifizieren (DKIM/SPF)

Domains → **Add Domain** → `passare.ch`

Resend zeigt vier DNS-Records an. Bei **united-domains** (DNS-Provider von passare.ch):

| Type  | Name (Host)              | Wert (Value)                                            |
| ----- | ------------------------ | ------------------------------------------------------- |
| MX    | `send` (Subdomain)        | `feedback-smtp.eu-west-1.amazonses.com` Prio 10        |
| TXT   | `send`                    | `v=spf1 include:amazonses.com ~all`                     |
| TXT   | `resend._domainkey`       | `p=MIGfMA0GCSqG…` (kompletter DKIM-Public-Key)          |
| TXT   | `_dmarc`                  | `v=DMARC1; p=none;`                                     |

**Wichtig:** united-domains-Panel akzeptiert keine TXT-Records mit Anführungszeichen — Wert ohne `"…"` einfügen.

DNS-Propagation kann 5–60 min dauern. Status prüfen:
- Resend → Domains → grüner Haken neben passare.ch
- CLI: `dig TXT resend._domainkey.passare.ch`

---

## 3. Environment-Variablen setzen

### 3a. Vercel (für Next.js-API-Routes, falls direkt verwendet)

Vercel Dashboard → Projekt **passare** → Settings → Environment Variables:

```
RESEND_API_KEY        = re_…
EMAIL_FROM            = passare <noreply@passare.ch>
EMAIL_REPLY_TO        = info@passare.ch
```

Auf alle drei Environments setzen: Production, Preview, Development.

### 3b. Supabase (für Edge Functions)

```bash
supabase secrets set \
  RESEND_API_KEY="re_…" \
  EMAIL_FROM="passare <noreply@passare.ch>" \
  EMAIL_REPLY_TO="info@passare.ch" \
  --project-ref ocbrjivpnsmxriyskgjx
```

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind in Edge Functions automatisch gesetzt — nicht manuell anlegen.

---

## 4. Migration einspielen

```bash
cd /Users/cyrill/Desktop/passare-new
supabase db push --project-ref ocbrjivpnsmxriyskgjx
```

Erstellt:
- `email_log` (Audit-Trail, RLS = nur Admin)
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

Danach gehen alle Auth-Mails (Signup-Verify, Password-Reset, Magic-Link) durch unsere `auth-email-hook` Edge-Function und werden mit dem passare-Branding über Resend verschickt.

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

## 8. Auth-Email-Templates auf Resend umstellen

Standardmässig versendet Supabase Auth (Sign-up, Password-Reset) über die eingebauten SMTP-Settings. Für einheitliches Branding über Resend:

Supabase Dashboard → **Project Settings → Authentication → SMTP Settings** → **Enable Custom SMTP**:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: `<RESEND_API_KEY>`
- Sender email: `noreply@passare.ch`
- Sender name: `passare`

Danach **Email Templates** → für jede Variante (Confirm signup, Reset password, Magic Link) den entsprechenden HTML-Body aus `emails/EmailVerifizierung.tsx` / `emails/EmailPasswortReset.tsx` einfügen — oder den `{{ .ConfirmationURL }}` Placeholder als `verifyUrl` an unsere `send-email`-Function durchreichen via Supabase Auth Hooks (saubere Variante, mehr Aufwand).

**Pragmatischer Start:** Custom SMTP einrichten + die mitgelieferten Supabase-Templates anpassen mit passare-Branding (Header-Bild + Farben).

---

## 9. Versand testen

### Manueller Test via curl

```bash
curl -X POST 'https://ocbrjivpnsmxriyskgjx.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{
    "template": "welcome",
    "to": "info@vemo.ch",
    "vars": { "name": "Cyrill" }
  }'
```

Erwartet: `200 { ok: true, log_id: "...", resend_id: "..." }`

### Templates lokal vorschauen (react-email)

```bash
npx react-email dev --dir emails
# öffnet http://localhost:3000 mit allen Templates
```

---

## 10. Logs / Debugging

- **Edge Function Logs:** Supabase Dashboard → Edge Functions → `send-email` → Logs
- **Email-Audit:** SQL `select * from public.email_log order by created_at desc limit 50;`
- **Resend-Dashboard:** https://resend.com/emails — Live-Status (Delivered / Bounced / Opened)

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
| `RESEND_API_KEY nicht konfiguriert` | Secret nicht gesetzt | `supabase secrets set RESEND_API_KEY=re_…` |
| `Resend 422: Domain not verified` | DKIM noch nicht propagiert | DNS prüfen, 30 min warten |
| Email landet im Spam | DMARC fehlt | TXT `_dmarc` setzen (siehe Schritt 2) |
| Webhook feuert nicht | DB-Webhook nicht aktiv | Dashboard → Webhooks → Status prüfen |
| `email_log.status` bleibt `queued` | Handler-Webhook fehlt | Schritt 6 nachholen ODER Cron (Schritt 7) aktivieren |

---

## Architektur (TL;DR)

```
Trigger-Quellen
├─ Supabase Auth (Welcome / Verify / Reset)  → Custom SMTP via Resend
├─ App-Code (z.B. /api/zahlung-ok)            → POST /functions/v1/send-email
└─ Postgres-Trigger (anfragen, nda)            → queue_email() → email_log INSERT
                                                                     ↓
                                                  DB-Webhook → email-handler
                                                                     ↓
                                                              send-email
                                                                     ↓
                                                                Resend API
                                                                     ↓
                                                              email_log.UPDATE
                                                              (status=sent|failed)
```
