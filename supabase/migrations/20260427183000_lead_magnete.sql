-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Public Lead-Magnete (/atlas, /bewerten, /ratgeber)
-- ════════════════════════════════════════════════════════════════════
-- Drei öffentliche Top-of-Funnel-Tabellen:
--   · kmu_multiples       — Public READ, Branchen-Multiples für /bewerten
--   · bewertungs_anfragen — Public INSERT, Admin-only READ (Lead-Capture)
--   · artikel             — Public READ (nur published), für /ratgeber-Blog
--
-- Diese Migration LÄUFT UNABHÄNGIG von verkaeufer/kaeufer/email/zefix.
-- Sie fasst keine Inserate-/Anfrage-/NDA-Tabellen an.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. KMU_MULTIPLES ────────────────────────────────────────────
-- Branchen-Multiples-DB. Public READ, damit /bewerten-Tool ohne Auth lesen kann.
-- Schreibrechte nur via Service-Role (Admin/Migration).

create table if not exists public.kmu_multiples (
  branche               text primary key,
  ebitda_multiple_min   numeric(4,2) not null,
  ebitda_multiple_max   numeric(4,2) not null,
  umsatz_multiple_min   numeric(4,2),
  umsatz_multiple_max   numeric(4,2),
  quelle                text,
  updated_at            timestamptz not null default now(),
  check (ebitda_multiple_min > 0 and ebitda_multiple_max >= ebitda_multiple_min),
  check (umsatz_multiple_min is null or umsatz_multiple_max is null
         or umsatz_multiple_max >= umsatz_multiple_min)
);

comment on table public.kmu_multiples is
  'Branchen-Multiples für die öffentliche Firmenbewertung. Public READ, Admin-Write.';

alter table public.kmu_multiples enable row level security;

drop policy if exists kmu_multiples_public_read on public.kmu_multiples;
create policy kmu_multiples_public_read on public.kmu_multiples
  for select to anon, authenticated using (true);

revoke all on public.kmu_multiples from anon, authenticated;
grant select on public.kmu_multiples to anon, authenticated;

-- Seed: 9 Branchen aus User-Vorgabe (Quellen Q1/2026)
insert into public.kmu_multiples (branche, ebitda_multiple_min, ebitda_multiple_max,
  umsatz_multiple_min, umsatz_multiple_max, quelle) values
  ('Maschinenbau',          4.5, 6.5, 0.6, 1.0, 'KPMG/Deloitte CH-Mittelstand 2025'),
  ('Lebensmittel',          3.5, 5.0, 0.4, 0.8, 'BDO Branchen-Multiples 2025'),
  ('IT & Technologie',      6.0, 9.0, 1.2, 2.5, 'PwC Tech-M&A CH 2025'),
  ('Finanz / Versicherung', 5.0, 7.0, 1.5, 3.0, 'Deloitte Financial Services 2025'),
  ('Gastgewerbe',           3.0, 4.5, 0.3, 0.6, 'GastroSuisse Branchenreport 2025'),
  ('Handel / Industrie',    4.0, 6.0, 0.5, 0.9, 'BDO Branchen-Multiples 2025'),
  ('Logistik',              3.5, 5.0, 0.4, 0.7, 'KPMG Logistik-Studie 2025'),
  ('Kleinhandel',           3.0, 4.5, 0.3, 0.6, 'KMU-Studie HSG 2025'),
  ('Gesundheit',            5.0, 7.5, 0.8, 1.5, 'PwC Health-M&A CH 2025')
on conflict (branche) do update set
  ebitda_multiple_min = excluded.ebitda_multiple_min,
  ebitda_multiple_max = excluded.ebitda_multiple_max,
  umsatz_multiple_min = excluded.umsatz_multiple_min,
  umsatz_multiple_max = excluded.umsatz_multiple_max,
  quelle = excluded.quelle,
  updated_at = now();

-- ─── 2. BEWERTUNGS_ANFRAGEN ───────────────────────────────────────
-- Lead-Capture aus dem öffentlichen /bewerten-Tool.
-- Anonyme INSERTs erlaubt (kein Auth nötig). READ nur für Admins.

create table if not exists public.bewertungs_anfragen (
  id           uuid primary key default gen_random_uuid(),
  email        text check (email is null or (length(email) between 5 and 200
                          and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  branche      text not null,
  kennzahlen   jsonb not null,
  ergebnis     jsonb not null,
  pdf_sent_at  timestamptz,
  user_agent   text,
  ip_hash      text,
  created_at   timestamptz not null default now()
);

comment on table public.bewertungs_anfragen is
  'Eingaben aus /bewerten Tool. Anon INSERT, Admin SELECT.';

create index if not exists bewertungs_anfragen_created_idx
  on public.bewertungs_anfragen (created_at desc);

create index if not exists bewertungs_anfragen_email_idx
  on public.bewertungs_anfragen (email)
  where email is not null;

alter table public.bewertungs_anfragen enable row level security;

-- Anon darf eigene Anfrage einlegen, nicht lesen
drop policy if exists bewertungs_insert_public on public.bewertungs_anfragen;
create policy bewertungs_insert_public on public.bewertungs_anfragen
  for insert to anon, authenticated with check (true);

-- Admins (rolle = 'admin' im profiles) lesen alles
drop policy if exists bewertungs_select_admin on public.bewertungs_anfragen;
create policy bewertungs_select_admin on public.bewertungs_anfragen
  for select to authenticated using (
    exists (select 1 from public.profiles
            where id = (select auth.uid()) and rolle = 'admin')
  );

revoke all on public.bewertungs_anfragen from anon, authenticated;
grant insert on public.bewertungs_anfragen to anon, authenticated;
grant select on public.bewertungs_anfragen to authenticated;

-- ─── 3. ARTIKEL ──────────────────────────────────────────────────
-- Ratgeber-Blog. Public READ nur für published Artikel, Admin-Write.

create table if not exists public.artikel (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                check (slug ~ '^[a-z0-9-]+$' and length(slug) between 3 and 100),
  titel         text not null check (length(titel) between 5 and 200),
  lead          text not null check (length(lead) between 20 and 400),
  body_mdx      text not null,
  autor         text not null default 'passare-Redaktion',
  kategorie     text,
  cover_url     text,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.artikel is
  'Ratgeber-Blog-Artikel. Public READ wenn published_at <= now().';

create index if not exists artikel_published_idx
  on public.artikel (published_at desc) where published_at is not null;

alter table public.artikel enable row level security;

drop policy if exists artikel_public_read on public.artikel;
create policy artikel_public_read on public.artikel
  for select to anon, authenticated
  using (published_at is not null and published_at <= now());

drop policy if exists artikel_admin_all on public.artikel;
create policy artikel_admin_all on public.artikel
  for all to authenticated
  using (
    exists (select 1 from public.profiles
            where id = (select auth.uid()) and rolle = 'admin')
  ) with check (
    exists (select 1 from public.profiles
            where id = (select auth.uid()) and rolle = 'admin')
  );

revoke all on public.artikel from anon, authenticated;
grant select on public.artikel to anon, authenticated;
grant all on public.artikel to authenticated;

-- Seed: 3 Demo-Artikel
insert into public.artikel (slug, titel, lead, kategorie, cover_url, autor, published_at, body_mdx)
values
  ('wann-ist-die-richtige-zeit-zu-verkaufen',
   'Wann ist die richtige Zeit zu verkaufen?',
   'Drei Signale aus der Praxis, die zeigen: Jetzt ist der Moment für die Nachfolgeregelung — und drei, die zum Aufschieben raten.',
   'Strategie',
   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=70&auto=format&fit=crop',
   'passare-Redaktion',
   now(),
   E'## Der richtige Zeitpunkt ist selten ein Zufall\n\nViele Inhaberinnen und Inhaber stellen sich die Frage zu spät — meist erst dann, wenn die Energie für das tägliche Geschäft nachlässt. Doch der ideale Verkaufszeitpunkt ist eine Mischung aus persönlicher, betrieblicher und marktseitiger Reife.\n\n## Drei Signale: jetzt verkaufen\n\n**1. Drei aufeinanderfolgende Wachstumsjahre.** Käufer zahlen für eine Trendlinie nach oben, nicht für vergangene Spitzenwerte. Wer drei Jahre in Folge wächst, signalisiert Stabilität — und verhandelt aus der Stärke.\n\n**2. Eine zweite Führungsebene ist etabliert.** Hängt das Geschäft am Inhaber, sinkt der Multiple um bis zu 30 Prozent. Ein funktionierendes Mid-Management dagegen ist bares Geld wert.\n\n**3. Die Branche konsolidiert.** Wenn Mitbewerber zugekauft werden, ist die Marktbewertung am höchsten. Wer als Erster handelt, hat die Auswahl unter strategischen Käufern.\n\n## Drei Signale: warten\n\n**1. Ein Schlüsselkunde steht auf der Kippe.** Verlust eines Kunden, der mehr als 15 Prozent Umsatz macht, drückt den Preis erheblich. Erst diversifizieren, dann verkaufen.\n\n**2. Die letzte Investition liegt unter zwei Jahren zurück.** Käufer goutieren keine Capex-Spitze direkt vor dem Verkauf — sie wirken wie Kosmetik.\n\n**3. Der persönliche Lebensplan ist unklar.** Wer "vielleicht" verkaufen will, verliert in Verhandlungen. Klarheit über das Danach ist die beste Verhandlungsposition.\n\n## Praxis-Tipp\n\nMachen Sie alle 24 Monate eine **Verkäuflich-Analyse**: Multiple, Käuferprofil, Bewertungs-Range. Auch wenn Sie nicht verkaufen wollen — Sie wissen jederzeit, was Ihre Firma wert ist und welche Hebel den Preis steigern.\n\n> "Der schlechteste Zeitpunkt zu verkaufen ist, wenn Sie verkaufen müssen."\n\n— Mit dem **Gratis-Bewertungstool** bekommen Sie in 60 Sekunden eine Indikation. Wer es ernst meint, geht den nächsten Schritt: ein anonymes Inserat auf passare.\n'),
  ('was-ist-meine-firma-wert',
   'Was ist meine Firma wert?',
   'Die wichtigsten Bewertungsmethoden für Schweizer KMU — pragmatisch erklärt, mit Beispielrechnung und typischen Branchen-Multiples.',
   'Bewertung',
   'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=70&auto=format&fit=crop',
   'passare-Redaktion',
   now(),
   E'## EBITDA-Multiple: der Standard im KMU-Bereich\n\nIm Schweizer Mittelstand wird in über 80 Prozent der Transaktionen das **EBITDA-Multiple-Verfahren** verwendet. Die Logik: Käufer zahlen ein Vielfaches des bereinigten operativen Ergebnisses.\n\n**Formel:**\n\n```\nUnternehmenswert = EBITDA × Branchen-Multiple\n```\n\n## Typische Branchen-Multiples Schweiz 2025\n\n| Branche | Range |\n| --- | --- |\n| IT & Technologie | 6.0× – 9.0× |\n| Gesundheit | 5.0× – 7.5× |\n| Finanz / Versicherung | 5.0× – 7.0× |\n| Maschinenbau | 4.5× – 6.5× |\n| Handel / Industrie | 4.0× – 6.0× |\n| Lebensmittel | 3.5× – 5.0× |\n| Logistik | 3.5× – 5.0× |\n| Gastgewerbe | 3.0× – 4.5× |\n| Kleinhandel | 3.0× – 4.5× |\n\n## Beispiel-Rechnung\n\nEine Maschinenbau-Firma mit CHF 8 Mio. Umsatz und 18 Prozent EBITDA-Marge:\n\n- EBITDA = 8 Mio. × 18 % = **CHF 1.44 Mio.**\n- Bewertung = 1.44 Mio. × 4.5 bis 6.5 = **CHF 6.5 Mio. bis 9.4 Mio.**\n\n## Was das Multiple verschiebt\n\n**+** Stabile Wachstumsraten, wiederkehrende Umsätze, geringe Inhaber-Abhängigkeit, Marktführerschaft im Segment, dokumentierte Prozesse.\n\n**–** Klumpenrisiken (1 Kunde > 20 % Umsatz), Inhaber-zentrierte Organisation, fehlende zweite Führungsebene, alte Maschinen mit anstehender Investition, ungelöste Nachfolge in Schlüsselfunktionen.\n\n## Cross-Check: Umsatz-Multiple\n\nFür Firmen mit untypischer EBITDA-Marge (z.B. SaaS in Wachstumsphase) wird parallel das Umsatz-Multiple geprüft. Range: 0.3× bis 2.5× je nach Branche.\n\n## Substanz-Wert als Floor\n\nBei kapitalintensiven Geschäften bildet das Eigenkapital plus Anlagevermögen den Mindestwert — auch wenn das EBITDA-Multiple tiefer liegt.\n\n## Nächster Schritt\n\nUnser **Gratis-Bewertungstool** rechnet in 60 Sekunden Ihre Range — basierend auf der Datenbank oben, plus Wachstums-Korrektur.\n'),
  ('nda-schutz-vor-indiskretion',
   'NDA — Schutz vor Indiskretion',
   'Warum eine Geheimhaltungsvereinbarung beim Firmenverkauf nicht verhandelbar ist — und welche Klauseln in jedem Schweizer NDA stehen müssen.',
   'Recht',
   'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=70&auto=format&fit=crop',
   'passare-Redaktion',
   now(),
   E'## Was ein NDA leistet — und was nicht\n\nEin **Non-Disclosure Agreement** (NDA, auch CDA — Confidentiality Disclosure Agreement) ist die rechtliche Grundlage für jede Due Diligence. Es verpflichtet den Interessenten, die offengelegten Informationen vertraulich zu behandeln und ausschliesslich zur Prüfung der Transaktion zu verwenden.\n\nWas das NDA **nicht** leistet: Es verhindert nicht, dass ein Wettbewerber die Information nutzt — es ermöglicht aber Schadenersatz bei nachweisbarer Verletzung.\n\n## Pflicht-Klauseln in jedem Schweizer NDA\n\n**1. Sachlicher Geltungsbereich.** Was genau ist vertraulich? Definition als "alle nicht-öffentlich zugänglichen Informationen, die im Zuge der Transaktionsprüfung offengelegt werden" — inklusive Datenraum-Zugang, mündliche Auskünfte, Site-Visits.\n\n**2. Zeitliche Geltung.** Üblich: 3 bis 5 Jahre nach Beendigung der Verhandlungen. Bei sensitiven Branchen (Pharma, Technologie) bis 10 Jahre.\n\n**3. Personeller Geltungsbereich.** Wer darf die Info sehen? Klausel: "Need-to-know-Basis", inklusive Berater (Anwalt, Treuhänder) — diese müssen ihrerseits NDAs unterzeichnen.\n\n**4. Verwendungszweck.** Ausschliesslich zur Prüfung dieser konkreten Transaktion. Keine Nutzung für Wettbewerbszwecke, kein Reverse Engineering.\n\n**5. Rückgabepflicht.** Bei Nicht-Abschluss: alle Unterlagen zurück oder vernichten, schriftliche Bestätigung.\n\n**6. Konventionalstrafe.** Pauschal CHF 50\'000 bis 250\'000 pro Verletzung — das senkt die Hürde für gerichtliche Durchsetzung.\n\n**7. Anwendbares Recht und Gerichtsstand.** Schweizer Recht, Gerichtsstand Sitz der Verkäufergesellschaft.\n\n**8. Non-Solicitation.** Mitarbeitende, Kunden und Lieferanten dürfen 24 Monate nicht aktiv abgeworben werden.\n\n## Digitales NDA — die neue Standard-Praxis\n\nAuf passare wird das NDA **digital signiert** (eSign QES-konform), in den Käufer-Account hinterlegt und automatisch archiviert. Verkäufer erhalten Bescheid, sobald die Signatur eingegangen ist, und können den Datenraum-Zugang freigeben — Schritt für Schritt.\n\n> Faustregel: Ohne unterzeichnetes NDA fliesst keine einzige Zahl, kein Firmenname, kein Mitarbeiterstand.\n\n## Häufige Fehler\n\n**Zu enge NDAs.** Wer nur "Finanzdaten" als vertraulich definiert, schliesst Strategie-Dokumente und Kundenlisten aus. Lieber breit definieren.\n\n**Keine Rückgabepflicht.** Ohne Klausel kann der Interessent Kopien behalten — auch nach Abbruch der Verhandlung.\n\n**Standard-Templates ohne Anpassung.** Branchen-Spezifika (z.B. Patente, Rezepturen, Kundendaten unter DSG) müssen explizit erwähnt werden.\n\n## Fazit\n\nEin sauberes NDA ist die billigste Versicherung im M&A-Prozess. Auf passare ist es Pflicht-Tor vor jedem Detail-Einblick — und für beide Seiten transparent dokumentiert.\n')
on conflict (slug) do nothing;
