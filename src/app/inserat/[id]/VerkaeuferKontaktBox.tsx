/**
 * VerkaeuferKontaktBox — zeigt Verkäufer-Kontaktdaten je nach `anonymitaet_level`.
 *
 * Drei Varianten:
 *   • voll_offen        → Profil-Card mit Foto/Name/Funktion + Direkt-Buttons
 *                         (WhatsApp / E-Mail / LinkedIn — falls vorhanden)
 *   • vorname_funktion  → Mini-Card «Vorname, Funktion · Firma» (kein Direktkontakt)
 *   • voll_anonym/null  → nichts (Anfrage-Form ist die einzige Option)
 *
 * Kommt OBERHALB des Anfrage-Formulars im ContactPanel.
 */

import { Linkedin, Mail, MessageCircle, Phone } from 'lucide-react';
import type { InseratDetail } from '@/lib/listings';

type Props = {
  listing: Pick<
    InseratDetail,
    | 'anonymitaet_level'
    | 'whatsapp_enabled'
    | 'kontakt_vorname'
    | 'kontakt_nachname'
    | 'kontakt_funktion'
    | 'kontakt_foto_url'
    | 'kontakt_email_public'
    | 'kontakt_whatsapp_nr'
    | 'linkedin_url'
    | 'firma_name'
  >;
};

export function VerkaeuferKontaktBox({ listing }: Props) {
  const level = listing.anonymitaet_level;
  if (!level || level === 'voll_anonym') return null;

  const vorname = listing.kontakt_vorname?.trim() || null;
  const nachname = listing.kontakt_nachname?.trim() || null;
  const funktion = listing.kontakt_funktion?.trim() || null;
  const firmaName = listing.firma_name?.trim() || null;

  // Halb-öffentlich: nur Vorname + Funktion zeigen, keine Direkt-Aktionen
  if (level === 'vorname_funktion') {
    if (!vorname && !funktion) return null;
    const label =
      vorname && funktion ? `${vorname}, ${funktion}` : (vorname ?? funktion ?? '—');
    return (
      <div className="flex items-center gap-3 bg-bronze/5 border border-bronze/20 rounded-card px-4 py-3">
        <Avatar initial={vorname?.[0] ?? funktion?.[0] ?? '?'} />
        <div className="min-w-0">
          <p className="font-serif text-body-sm text-navy leading-tight truncate">
            {label}
          </p>
          <p className="text-caption text-quiet leading-snug truncate">
            Anfrage geht direkt an diese Person
          </p>
        </div>
      </div>
    );
  }

  // Voll offen: Foto + voller Name + Funktion + Direkt-Aktions-Buttons
  const fullName = [vorname, nachname].filter(Boolean).join(' ').trim() || null;
  const email = listing.kontakt_email_public?.trim() || null;
  const whatsappRaw = listing.kontakt_whatsapp_nr?.trim() || null;
  const whatsappEnabled = Boolean(listing.whatsapp_enabled && whatsappRaw);
  const whatsappHref = whatsappEnabled ? buildWhatsAppHref(whatsappRaw) : null;
  const linkedin = listing.linkedin_url?.trim() || null;
  const linkedinHref = linkedin ? normalizeUrl(linkedin) : null;

  const hasAnyAction = Boolean(email || whatsappHref || linkedinHref);
  if (!fullName && !funktion && !listing.kontakt_foto_url && !hasAnyAction) {
    return null;
  }

  return (
    <div className="bg-bronze/5 border border-bronze/20 rounded-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        {listing.kontakt_foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.kontakt_foto_url}
            alt={fullName ?? 'Verkäufer'}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-bronze/30"
          />
        ) : (
          <Avatar initial={vorname?.[0] ?? '?'} large />
        )}
        <div className="min-w-0">
          <p className="font-serif text-body text-navy leading-tight truncate">
            {fullName ?? '—'}
          </p>
          <p className="text-caption text-quiet leading-snug truncate">
            {[funktion, firmaName].filter(Boolean).join(' · ') || 'Verkäufer'}
          </p>
        </div>
      </div>

      {hasAnyAction && (
        <div className="flex flex-wrap gap-1.5">
          {whatsappHref && (
            <ActionButton
              href={whatsappHref}
              icon={<MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />}
              label="WhatsApp"
              external
            />
          )}
          {email && (
            <ActionButton
              href={`mailto:${email}`}
              icon={<Mail className="w-3.5 h-3.5" strokeWidth={1.75} />}
              label="E-Mail"
            />
          )}
          {linkedinHref && (
            <ActionButton
              href={linkedinHref}
              icon={<Linkedin className="w-3.5 h-3.5" strokeWidth={1.75} />}
              label="LinkedIn"
              external
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ Sub-Components ════════════════════════ */

function Avatar({ initial, large = false }: { initial: string; large?: boolean }) {
  const size = large ? 'w-12 h-12' : 'w-10 h-10';
  const text = large ? 'text-base' : 'text-sm';
  return (
    <div
      className={`${size} rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center flex-shrink-0 font-serif ${text}`}
    >
      {initial.toUpperCase()}
    </div>
  );
}

function ActionButton({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center gap-1.5 bg-paper border border-stone hover:border-bronze hover:text-bronze rounded-soft px-2.5 py-1.5 text-caption font-mono uppercase tracking-widest text-navy transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

/* ════════════════════════ Helpers ════════════════════════ */

/** Akzeptiert «+41 79 123 45 67», «0791234567», «41791234567» — gibt wa.me-URL zurück oder null. */
function buildWhatsAppHref(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  // Schweizer Nummern ohne Ländervorwahl: 0XX XXX XX XX → +41 XX XXX XX XX
  let intl = digits;
  if (intl.startsWith('00')) intl = intl.slice(2);
  else if (intl.startsWith('0')) intl = `41${intl.slice(1)}`;
  if (intl.length < 8) return null;
  return `https://wa.me/${intl}`;
}

/** Sicheres Normalisieren von URLs (LinkedIn, etc.) — ergänzt https:// falls fehlt. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
