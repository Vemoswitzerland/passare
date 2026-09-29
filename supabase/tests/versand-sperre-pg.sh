#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# Wand: Versand-Sperre an echtem Postgres (Migration 20260929200000)
# ────────────────────────────────────────────────────────────────────
# Startet einen Wegwerf-Postgres in einem eigenen Ordner (nur Unix-Socket,
# kein Netz), spielt die ECHTEN Migrationen 20260427184000_email.sql und
# 20260929200000_email_versand_sperre.sql ein und prüft:
#   1. nur EIN Aufruf bekommt die Sperre, auch GLEICHZEITIG (zweite Sitzung
#      wartet auf die Zeilen-Sperre und bekommt danach nichts)
#   2. nach Freigabe (Fehlschlag) wieder frei; nach sent nie mehr
#   3. eine liegengebliebene Sperre ist nach 10 Minuten frei, vorher nicht
#   4. anon/authenticated dürfen die Funktion nicht rufen, service_role schon
# Aufruf:  supabase/tests/versand-sperre-pg.sh
#   PGBIN=<ordner mit initdb/pg_ctl/psql>  (Standard: Postgres.app)
#   SPERRE_MIG=<andere Migrationsdatei>    (nur für die Mutationsprobe)
# Rückgabe 0 = alle grün, 1 = rot.
# ════════════════════════════════════════════════════════════════════
set -euo pipefail
HIER="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-/Applications/Postgres.app/Contents/Versions/latest/bin}"
MIG_EMAIL="$HIER/migrations/20260427184000_email.sql"
MIG_SPERRE="${SPERRE_MIG:-$HIER/migrations/20260929200000_email_versand_sperre.sql}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/versand-sperre-pg.XXXXXX")"
# Unix-Socket in einem KURZEN Ordner (macOS: Pfad hoechstens 103 Zeichen, $TMPDIR ist oft laenger)
SOCK="$(mktemp -d /tmp/vsp.XXXXXX)"
PORT=54399
aufraeumen() { "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP" "$SOCK"; }
trap aufraeumen EXIT

"$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$TMP/data" -o "-k $SOCK -p $PORT -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null
q() { "$PGBIN/psql" -h "$SOCK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -qAt "$@"; }

# Supabase-Umgebung, soweit die Migrationen sie brauchen
q <<'SQL'
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table public.profiles (id uuid primary key, rolle text);
-- wie Supabase: neue Funktionen in public sind fuer anon/authenticated/service_role ausfuehrbar,
-- solange die Migration es nicht ausdruecklich entzieht
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
SQL
q -f "$MIG_EMAIL" >/dev/null
q -f "$MIG_SPERRE" >/dev/null

rot=0
pruefe() { # pruefe <name> <ist> <soll>
  if [ "$2" = "$3" ]; then echo "OK   $1"; else echo "ROT  $1: ist '$2', soll '$3'"; rot=1; fi
}
neu() { q -c "insert into public.email_log (template, to_email, status) values ('welcome', 'ok@lettermint.dev', 'queued') returning id"; }
sperre() { q -c "select coalesce(public.email_log_versand_beanspruchen('$1')::text, 'null')"; }

# 1. nacheinander
a="$(neu)"
pruefe "erste Sperre" "$(sperre "$a")" "true"
pruefe "zweite Sperre (gleich danach)" "$(sperre "$a")" "null"

# 1b. GLEICHZEITIG: Sitzung A hält die Zeile 2 s in einer offenen Transaktion, B fragt in der Zeit
b="$(neu)"
( q -c "begin; select public.email_log_versand_beanspruchen('$b'); select pg_sleep(2); commit;" >"$TMP/a.out" ) &
sleep 0.5
start=$(date +%s)
ergebnis_b="$(sperre "$b")"
dauer=$(( $(date +%s) - start ))
wait
pruefe "gleichzeitig: Sitzung A bekommt die Sperre" "$(head -1 "$TMP/a.out")" "t"
pruefe "gleichzeitig: Sitzung B bekommt sie nicht" "$ergebnis_b" "null"
pruefe "gleichzeitig: Sitzung B hat auf A gewartet (>= 1 s)" "$([ "$dauer" -ge 1 ] && echo ja || echo "nein ($dauer s)")" "ja"

# 2. Freigabe nach Fehlschlag, nie nach sent
q -c "update public.email_log set status = 'failed', versand_beansprucht_am = null where id = '$a'"
pruefe "nach Fehlschlag frei" "$(sperre "$a")" "true"
q -c "update public.email_log set status = 'sent', versand_beansprucht_am = null where id = '$a'"
pruefe "nach sent nie mehr" "$(sperre "$a")" "null"

# 3. liegengeblieben: 9 min -> noch gesperrt, 11 min -> frei
c="$(neu)"
q -c "update public.email_log set versand_beansprucht_am = now() - interval '9 minutes' where id = '$c'"
pruefe "Sperre 9 min alt: noch gesperrt" "$(sperre "$c")" "null"
q -c "update public.email_log set versand_beansprucht_am = now() - interval '11 minutes' where id = '$c'"
pruefe "Sperre 11 min alt: frei" "$(sperre "$c")" "true"
pruefe "unbekannte Zeile" "$(sperre 00000000-0000-0000-0000-000000000000)" "null"

# 4. Rechte
d="$(neu)"
for rolle in anon authenticated; do
  if q -c "set role $rolle; select public.email_log_versand_beanspruchen('$d')" >/dev/null 2>&1; then
    pruefe "$rolle darf nicht" "darf" "verweigert"
  else
    pruefe "$rolle darf nicht" "verweigert" "verweigert"
  fi
done
pruefe "service_role darf" "$(q -c "set role service_role; select public.email_log_versand_beanspruchen('$d')" | tail -1)" "t"

if [ "$rot" = 0 ]; then echo "GRUEN versand-sperre-pg"; else echo "ROT versand-sperre-pg"; fi
exit "$rot"
