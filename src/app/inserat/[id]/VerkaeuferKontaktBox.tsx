/**
 * VerkaeuferKontaktBox — zeigt Verkäufer-Kontaktdaten je nach `anonymitaet_level`.
 *
 * Drei Varianten:
 *   • voll_offen        → Profil-Card zentriert: Name, Funktion, Foto/Avatar,
 *                         Telefon + E-Mail als Text, dann 3 Brand-Icon-Buttons
 *                         (WhatsApp, Mail, LinkedIn)
 *   • vorname_funktion  → Mini-Card «Vorname, Funktion · Firma» (kein Direktkontakt)
 *   • voll_anonym/null  → nichts (Anfrage-Form ist die einzige Option)
 *
 * WhatsApp + Mail nutzen Smartlinks: WhatsApp mit ?text=… vorgefüllt,
 * Mailto mit Subject + Body — Käufer kommt mit Kontext direkt rein.
 */

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
    | 'titel'
    | 'public_id'
    | 'id'
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

  // Voll offen: zentrierte Card
  // Reihenfolge nach Cyrill: Name → Funktion → Profilbild → Telefon/Mail → Brand-Buttons
  const fullName = [vorname, nachname].filter(Boolean).join(' ').trim() || null;
  const subtitle = [funktion, firmaName].filter(Boolean).join(' · ') || null;

  const email = listing.kontakt_email_public?.trim() || null;
  const whatsappRaw = listing.kontakt_whatsapp_nr?.trim() || null;
  const whatsappEnabled = Boolean(listing.whatsapp_enabled && whatsappRaw);
  const whatsappDisplay = whatsappEnabled ? formatPhone(whatsappRaw) : null;

  const inseratLink = `https://passare.ch/inserat/${listing.public_id ?? listing.id}`;
  const greeting = vorname ? `Guten Tag ${vorname}` : 'Guten Tag';
  const waText =
    `${greeting}, ich interessiere mich für Ihr Inserat «${listing.titel}» auf passare.ch.\n\n${inseratLink}`;
  const whatsappHref = whatsappEnabled ? buildWhatsAppHref(whatsappRaw, waText) : null;

  const linkedin = listing.linkedin_url?.trim() || null;
  const linkedinHref = linkedin ? normalizeUrl(linkedin) : null;

  const mailSubject = `Anfrage zu Ihrem Inserat «${listing.titel}»`;
  const mailBody = `${greeting},\n\nich habe Ihr Inserat «${listing.titel}» auf passare.ch gesehen und möchte gerne mehr erfahren.\n\nMit freundlichen Grüssen`;
  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
    : null;

  const hasAnyButton = Boolean(whatsappHref || mailtoHref || linkedinHref);
  if (!fullName && !subtitle && !listing.kontakt_foto_url && !hasAnyButton) {
    return null;
  }

  return (
    <div className="bg-bronze/5 border border-bronze/20 rounded-card p-5 space-y-4">
      {/* Oben: Profilbild links, Name + Funktion rechts */}
      <div className="flex items-center gap-4">
        {listing.kontakt_foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.kontakt_foto_url}
            alt=""
            className="w-16 h-16 rounded-full object-cover border-2 border-bronze/30 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center font-serif text-2xl flex-shrink-0">
            {(vorname?.[0] ?? funktion?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {fullName && (
            <p className="font-serif text-head-md text-navy font-normal leading-tight truncate">
              {fullName}
            </p>
          )}
          {subtitle && (
            <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink leading-snug mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Telefonnummer + E-Mail über volle Breite (eigene Zeilen) */}
      {(whatsappDisplay || email) && (
        <div className="flex flex-col gap-1 pt-1 border-t border-bronze/15">
          {whatsappDisplay && (
            <a
              href={`tel:${whatsappRaw?.replace(/\s/g, '')}`}
              className="block font-mono text-body-sm text-navy hover:text-bronze transition-colors pt-2"
            >
              {whatsappDisplay}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="block font-mono text-body-sm text-navy hover:text-bronze transition-colors break-all"
            >
              {email}
            </a>
          )}
        </div>
      )}

      {/* Brand-Icon-Buttons: WhatsApp · Mail · LinkedIn */}
      {hasAnyButton && (
        <div className="flex items-center gap-3 pt-1">
          {whatsappHref && (
            <BrandIconButton
              href={whatsappHref}
              label="WhatsApp"
              bgColor="bg-[#25D366] hover:bg-[#1FB358]"
              external
            >
              <WhatsAppIcon />
            </BrandIconButton>
          )}
          {mailtoHref && (
            <BrandIconButton
              href={mailtoHref}
              label="E-Mail schreiben"
              bgColor="bg-bronze hover:bg-bronze/90"
            >
              <MailIcon />
            </BrandIconButton>
          )}
          {linkedinHref && (
            <BrandIconButton
              href={linkedinHref}
              label="LinkedIn-Profil"
              bgColor="bg-[#0A66C2] hover:bg-[#084e95]"
              external
            >
              <LinkedInIcon />
            </BrandIconButton>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ Sub-Components ════════════════════════ */

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center flex-shrink-0 font-serif text-sm">
      {initial.toUpperCase()}
    </div>
  );
}

function BrandIconButton({
  href,
  label,
  bgColor,
  external = false,
  children,
}: {
  href: string;
  label: string;
  bgColor: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={label}
      title={label}
      className={`${bgColor} text-white w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors shadow-subtle hover:shadow-lift`}
    >
      {children}
    </a>
  );
}

/* ════════════════════════ Brand-Icons (echte SVGs) ════════════════════════ */

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

/* ════════════════════════ Helpers ════════════════════════ */

/** Formatiert eine CH-Nummer für die Anzeige: «+41 79 695 34 47». */
function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  let intl = digits;
  if (intl.startsWith('00')) intl = intl.slice(2);
  else if (intl.startsWith('0')) intl = `41${intl.slice(1)}`;
  if (intl.length < 8) return raw;
  // Schweiz: +41 79 695 34 47
  if (intl.startsWith('41') && intl.length === 11) {
    const c = intl.slice(0, 2);
    const a = intl.slice(2, 4);
    const b = intl.slice(4, 7);
    const d = intl.slice(7, 9);
    const e = intl.slice(9, 11);
    return `+${c} ${a} ${b} ${d} ${e}`;
  }
  return `+${intl}`;
}

/** Akzeptiert «+41 79 123 45 67», «0791234567», «41791234567» — gibt wa.me-URL zurück oder null.
 *  Optional: vorausgefüllter Text wird als ?text=… angehängt (Smartlink). */
function buildWhatsAppHref(raw: string | null, text?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  let intl = digits;
  if (intl.startsWith('00')) intl = intl.slice(2);
  else if (intl.startsWith('0')) intl = `41${intl.slice(1)}`;
  if (intl.length < 8) return null;
  const base = `https://wa.me/${intl}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Sicheres Normalisieren von URLs (LinkedIn, etc.) — ergänzt https:// falls fehlt.
 *  Schutz: lehnt `javascript:`/`data:`/`vbscript:`/`file:`-Schemas ab. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
