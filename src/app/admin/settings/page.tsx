import { Info, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata = {
  title: 'Admin · Settings — passare',
  robots: { index: false, follow: false },
};

const VERKAEUFER_PAKETE = [
  { name: 'Inserat Light', preis: 'CHF 290', laufzeit: '3 Monate', verlaengerung: '+CHF 190 / 3M' },
  { name: 'Inserat Pro', preis: 'CHF 890', laufzeit: '6 Monate', verlaengerung: '+CHF 490 / 6M' },
  { name: 'Inserat Premium', preis: "CHF 1'890", laufzeit: '12 Monate', verlaengerung: '+CHF 990 / 12M' },
];

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BETA_GATE_ENABLED',
  'BETA_GATE_CODE',
  'ANTHROPIC_API_KEY',
];

export default function AdminSettingsPage() {
  const env = ENV_KEYS.map((key) => ({
    key,
    set: !!process.env[key],
  }));

  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'lokal';
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? 'main';

  return (
    <div className="max-w-5xl">
      <PageHeader overline="System" title="Einstellungen" />

      <div className="bg-stone/30 border border-stone rounded-soft px-3 py-2 mb-6 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-quiet flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-muted">
          Read-Only. Konfiguration läuft via Code-Repo + Deploy. Editierbare Settings folgen.
        </p>
      </div>

      <Section title="Plattform-Status">
        <div className="bg-paper border border-stone rounded-soft divide-y divide-stone/60">
          <Row label="Phase" value="Beta (Public-Launch ausstehend)" />
          <Row label="Beta-Code" value={<code className="font-mono text-bronze-ink">passare2026</code>} />
          <Row label="Branch" value={<code className="font-mono">{branch}</code>} />
          <Row label="Commit" value={<code className="font-mono">{commit}</code>} />
          <Row label="robots.txt" value="Disallow: / (kein Indexing)" />
        </div>
      </Section>

      <Section title="ENV-Variablen">
        <div className="bg-paper border border-stone rounded-soft divide-y divide-stone/60">
          {env.map((e) => (
            <div
              key={e.key}
              className="px-3 py-2 flex items-center justify-between gap-4 text-body-sm"
            >
              <code className="font-mono text-ink truncate">{e.key}</code>
              {e.set ? (
                <span className="inline-flex items-center gap-1 text-success text-caption flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Gesetzt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-danger text-caption flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  Fehlt
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pricing — Verkäufer">
        <div className="grid sm:grid-cols-3 gap-2">
          {VERKAEUFER_PAKETE.map((p) => (
            <div key={p.name} className="bg-paper border border-stone rounded-soft p-3">
              <p className="text-caption text-quiet uppercase tracking-wide font-medium mb-1">
                {p.name}
              </p>
              <p className="text-base text-navy font-semibold tabular-nums">{p.preis}</p>
              <p className="text-caption text-quiet">{p.laufzeit}</p>
              <p className="text-caption text-quiet mt-2 pt-2 border-t border-stone">
                Verl.: <span className="font-mono">{p.verlaengerung}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-caption text-quiet mt-2">Alle Preise zzgl. 8.1 % CH-MwSt.</p>
      </Section>

      <Section title="Pricing — Käufer">
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="bg-paper border border-stone rounded-soft p-3">
            <p className="text-caption text-quiet uppercase tracking-wide font-medium mb-1">
              Käufer Basic
            </p>
            <p className="text-base text-navy font-semibold tabular-nums">CHF 0</p>
            <p className="text-caption text-quiet">unbefristet</p>
            <p className="text-caption text-muted mt-2 pt-2 border-t border-stone">
              Öffentliche Inserate, 5 Basis-Filter, 5 Anfragen/Monat
            </p>
          </div>
          <div className="bg-paper border border-stone rounded-soft p-3">
            <p className="text-caption text-quiet uppercase tracking-wide font-medium mb-1">
              Käufer+
            </p>
            <p className="text-base text-navy font-semibold tabular-nums">CHF 199 / Monat</p>
            <p className="text-caption text-quiet">oder CHF 1&apos;990 / Jahr</p>
            <p className="text-caption text-muted mt-2 pt-2 border-t border-stone">
              7 Tage Frühzugang, alle Filter, unbegrenzte Anfragen, WhatsApp-Alerts
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-caption uppercase tracking-wide font-medium text-quiet mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-3 py-2 flex items-center justify-between gap-4">
      <p className="text-caption uppercase tracking-wide font-medium text-quiet">{label}</p>
      <p className="text-body-sm text-ink text-right">{value}</p>
    </div>
  );
}
