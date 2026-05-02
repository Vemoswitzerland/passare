import { Crown, MapPin, Banknote, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const INVESTOR_LABELS: Record<string, string> = {
  privatperson: 'Privatperson',
  family_office: 'Family Office',
  holding_strategisch: 'Strategischer Käufer',
  mbi_management: 'MBI-Manager',
  berater_broker: 'Berater / Broker',
};

const TIMING_LABELS: Record<string, string> = {
  sofort: 'Sofort (3 M)',
  '3_monate': '3–6 Monate',
  '6_monate': '6–12 Monate',
  '12_monate': 'Über 12 Monate',
  nur_browsing: 'Nur browsing',
};

const ERFAHRUNG_LABELS: Record<string, string> = {
  erstkaeufer: 'Erstkäufer',
  '1_3_deals': '1–3 Deals Erfahrung',
  '4_plus_deals': '4+ Deals Erfahrung',
};

type Props = {
  fullName: string | null;
  kanton: string | null;
  investorTyp: string | null;
  budget: string | null;
  branchen: string[];
  regionen: string[];
  erfahrung: string | null;
  timing: string | null;
  beschreibung: string | null;
  isPlus: boolean;
  logoUrl?: string | null;
  verified: { phone: boolean; kyc: boolean; finanzierung: boolean; linkedin?: boolean };
};

export function ProfilPreview(p: Props) {
  const initials = p.fullName?.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() ?? '??';
  const verifiedCount =
    Number(p.verified.phone) +
    Number(p.verified.kyc) +
    Number(p.verified.finanzierung) +
    Number(p.verified.linkedin ?? false);

  return (
    <div className="bg-paper border border-stone rounded-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-navy to-ink text-cream p-6 md:p-7">
        <div className="flex items-start gap-4">
          {p.logoUrl ? (
            <img
              src={p.logoUrl}
              alt={p.fullName ? `Logo ${p.fullName}` : 'Käufer-Logo'}
              width={56}
              height={56}
              loading="lazy"
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-bronze text-cream flex items-center justify-center font-mono text-body-sm font-medium flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-serif text-head-md text-cream font-normal">
                {p.fullName ?? 'Käufer'}<span className="text-bronze">.</span>
              </h3>
              {p.isPlus && (
                <span className="inline-flex items-center gap-1 text-caption font-medium px-2 py-0.5 rounded-pill bg-bronze text-cream">
                  <Crown className="w-3 h-3" strokeWidth={2} />
                  Käufer+
                </span>
              )}
            </div>
            <p className="text-caption text-cream/70 font-mono">
              {p.investorTyp ? INVESTOR_LABELS[p.investorTyp] : 'Profil unvollständig'}
              {p.kanton && ` · ${p.kanton}`}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className={cn(
              'text-caption font-medium px-2 py-0.5 rounded-pill',
              verifiedCount === 3 ? 'bg-success/30 text-cream' : verifiedCount >= 1 ? 'bg-bronze/30 text-cream' : 'bg-stone/20 text-cream/70',
            )}>
              <ShieldCheck className="inline w-3 h-3 mr-1" strokeWidth={2} />
              {verifiedCount}/4 verifiziert
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-7 space-y-5">
        {p.beschreibung && (
          <p className="text-body-sm text-muted leading-relaxed border-l-2 border-bronze pl-4 italic">
            «{p.beschreibung}»
          </p>
        )}

        <dl className="grid grid-cols-2 gap-4 text-body-sm">
          <PreviewItem icon={Banknote} label="Budget" value={p.budget ?? 'Nicht angegeben'} />
          <PreviewItem icon={MapPin} label="Region" value={p.regionen.length === 0 ? '—' : p.regionen.includes('CH') ? 'Schweizweit' : p.regionen.join(', ')} />
          <PreviewItem icon={Briefcase} label="Branchen" value={p.branchen.length === 0 ? '—' : p.branchen.slice(0, 3).join(', ') + (p.branchen.length > 3 ? ` +${p.branchen.length - 3}` : '')} />
          <PreviewItem icon={Calendar} label="Timing" value={p.timing ? TIMING_LABELS[p.timing] : '—'} />
        </dl>

        {p.erfahrung && (
          <div className="pt-4 border-t border-stone">
            <p className="text-caption text-quiet">Erfahrung</p>
            <p className="text-body-sm text-navy font-medium mt-1">{ERFAHRUNG_LABELS[p.erfahrung]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewItem({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="overline text-quiet text-[10px]">{label}</p>
        <p className="text-body-sm text-navy mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}
