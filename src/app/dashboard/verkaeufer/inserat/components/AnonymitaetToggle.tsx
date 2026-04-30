'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, User, ShieldCheck, Mail, Phone, Briefcase, ChevronDown, Check,
} from 'lucide-react';
import { setAnonymitaetLevel, updateKontaktFelder } from '../actions';
import { cn } from '@/lib/utils';

/**
 * 3-Stufen-Toggle für Anonymität + Inline-Edit für Kontakt-Daten.
 *
 * Cyrill 30.04.2026:
 *  «Geile Funktion bei Mein Inserat — aber wenn die Daten noch nicht
 *   drin sind, soll unten ein Fenster aufgehen wo man die Daten noch
 *   eingeben/ändern kann.»
 *
 * Logik:
 *  - voll_anonym → keine Kontakt-Daten nötig, Panel zu
 *  - vorname_funktion → Vorname + Funktion brauchen — Panel auf wenn fehlend
 *  - voll_offen → zusätzlich Nachname + Mail + WhatsApp + Foto-URL —
 *    Panel auf wenn fehlend, kann jederzeit aufgeklappt werden
 *
 * Kontakt-Felder sind als IRRELEVANT klassifiziert → Inserat bleibt live.
 */

type Level = 'voll_anonym' | 'vorname_funktion' | 'voll_offen';

type KontaktDaten = {
  kontakt_vorname: string | null;
  kontakt_nachname: string | null;
  kontakt_funktion: string | null;
  kontakt_email_public: string | null;
  kontakt_whatsapp_nr: string | null;
  kontakt_foto_url: string | null;
};

const OPTIONS: Array<{
  value: Level;
  label: string;
  sub: string;
  icon: typeof EyeOff;
}> = [
  {
    value: 'voll_anonym',
    label: 'Anonym',
    sub: 'Nur Branche, Kanton, Eckdaten',
    icon: EyeOff,
  },
  {
    value: 'vorname_funktion',
    label: 'Halb-anonym',
    sub: 'Plus Vorname & Funktion',
    icon: User,
  },
  {
    value: 'voll_offen',
    label: 'Voll-offen',
    sub: 'Plus Foto, Mail, Firma',
    icon: Eye,
  },
];

export function AnonymitaetToggle({
  inseratId,
  current,
  kontakt,
}: {
  inseratId: string;
  current: Level;
  kontakt: KontaktDaten;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Level>(current);
  const [pending, startTx] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Was fehlt je nach gewähltem Level?
  const missing = computeMissing(active, kontakt);
  // Panel automatisch öffnen wenn Felder fehlen (oder via Click)
  const [panelOpen, setPanelOpen] = useState<boolean>(missing.length > 0 && active !== 'voll_anonym');

  const select = (level: Level) => {
    if (level === active || pending) return;
    const previous = active;
    setActive(level); // optimistic
    setFeedback(null);

    // Panel-State automatisch je nach Level
    const newMissing = computeMissing(level, kontakt);
    setPanelOpen(newMissing.length > 0 && level !== 'voll_anonym');

    startTx(async () => {
      const res = await setAnonymitaetLevel(inseratId, level);
      if (res.ok) {
        setFeedback('Übernommen — Inserat bleibt live.');
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setActive(previous); // rollback
        setFeedback(`Fehler: ${res.error}`);
      }
    });
  };

  return (
    <section className="mb-6 rounded-card bg-paper border border-stone p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-bronze/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-head-sm text-navy font-light mb-0.5">
            Anonymität
          </h2>
          <p className="text-caption text-muted">
            Wieviel Käufer sehen sollen — kannst du jederzeit umstellen, Inserat bleibt live.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = active === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              disabled={pending}
              className={cn(
                'text-left rounded-soft border p-3 transition-all',
                isActive
                  ? 'border-bronze bg-bronze/5 shadow-subtle'
                  : 'border-stone hover:border-navy/30 hover:bg-stone/30',
                pending && 'opacity-60 cursor-wait',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={cn('w-4 h-4', isActive ? 'text-bronze-ink' : 'text-quiet')}
                  strokeWidth={1.5}
                />
                <p
                  className={cn(
                    'text-body-sm font-medium',
                    isActive ? 'text-navy' : 'text-ink',
                  )}
                >
                  {opt.label}
                </p>
                {isActive && (
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-pill bg-bronze text-cream text-[10px] uppercase tracking-wider font-medium">
                    aktiv
                  </span>
                )}
              </div>
              <p className="text-caption text-quiet leading-snug">{opt.sub}</p>
            </button>
          );
        })}
      </div>

      {feedback && (
        <p className={cn(
          'text-caption mt-3',
          feedback.startsWith('Fehler') ? 'text-danger' : 'text-success',
        )}>
          {feedback}
        </p>
      )}

      {/* ── Inline-Kontakt-Edit-Panel ──────────────────────────────
          Cyrill: «Wenn Daten noch nicht drin sind, unten ein Fenster
          mit den Eingabe-Feldern.» Auch manuell aufklappbar wenn schon
          gefüllt — User kann seine Kontakt-Daten jederzeit ändern. */}
      {active !== 'voll_anonym' && (
        <KontaktPanel
          inseratId={inseratId}
          level={active}
          initial={kontakt}
          missing={missing}
          open={panelOpen}
          onToggle={() => setPanelOpen((v) => !v)}
        />
      )}
    </section>
  );
}

// ─── Helper: Was fehlt für das gewählte Level? ────────────────────
function computeMissing(level: Level, k: KontaktDaten): string[] {
  const missing: string[] = [];
  if (level === 'voll_anonym') return missing;
  if (!k.kontakt_vorname) missing.push('Vorname');
  if (!k.kontakt_funktion) missing.push('Funktion');
  if (level === 'voll_offen') {
    if (!k.kontakt_nachname) missing.push('Nachname');
    if (!k.kontakt_email_public) missing.push('E-Mail');
  }
  return missing;
}

// ─── KontaktPanel ─────────────────────────────────────────────────

function KontaktPanel({
  inseratId, level, initial, missing, open, onToggle,
}: {
  inseratId: string;
  level: Level;
  initial: KontaktDaten;
  missing: string[];
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [vorname, setVorname] = useState(initial.kontakt_vorname ?? '');
  const [nachname, setNachname] = useState(initial.kontakt_nachname ?? '');
  const [funktion, setFunktion] = useState(initial.kontakt_funktion ?? '');
  const [email, setEmail] = useState(initial.kontakt_email_public ?? '');
  const [whatsapp, setWhatsapp] = useState(initial.kontakt_whatsapp_nr ?? '');
  const [pending, startTx] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const save = () => {
    setFeedback(null);
    startTx(async () => {
      const res = await updateKontaktFelder(inseratId, {
        kontakt_vorname: vorname,
        kontakt_nachname: nachname,
        kontakt_funktion: funktion,
        kontakt_email_public: email,
        kontakt_whatsapp_nr: whatsapp,
      });
      if (res.ok) {
        setFeedback('Gespeichert.');
        router.refresh();
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Fehler: ${res.error}`);
      }
    });
  };

  return (
    <div className="mt-5 border-t border-stone pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 mb-3 text-left"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 text-quiet transition-transform',
            open ? 'rotate-180' : '',
          )}
          strokeWidth={1.5}
        />
        <p className="text-body-sm text-navy font-medium">
          Kontakt-Daten {level === 'vorname_funktion' ? '(Vorname & Funktion)' : '(Foto · Mail · WhatsApp)'}
        </p>
        {missing.length > 0 && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-pill bg-warn/15 text-warn text-[10px] font-medium">
            {missing.length} {missing.length === 1 ? 'Feld fehlt' : 'Felder fehlen'}
          </span>
        )}
        {missing.length === 0 && open && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-success/15 text-success text-[10px] font-medium">
            <Check className="w-3 h-3" strokeWidth={2} />
            vollständig
          </span>
        )}
      </button>

      {open && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            label="Vorname"
            icon={User}
            value={vorname}
            onChange={setVorname}
            placeholder="z.B. Max"
            required={level !== 'voll_anonym'}
          />
          {level === 'voll_offen' && (
            <Field
              label="Nachname"
              icon={User}
              value={nachname}
              onChange={setNachname}
              placeholder="z.B. Muster"
              required
            />
          )}
          <Field
            label="Funktion"
            icon={Briefcase}
            value={funktion}
            onChange={setFunktion}
            placeholder="z.B. Inhaber, CEO"
            required={level !== 'voll_anonym'}
          />
          {level === 'voll_offen' && (
            <>
              <Field
                label="E-Mail (öffentlich)"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="kontakt@…"
                required
              />
              <Field
                label="WhatsApp (optional)"
                icon={Phone}
                type="tel"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="+41 79 …"
              />
            </>
          )}
        </div>
      )}

      {open && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            {pending ? 'Speichert …' : 'Speichern'}
          </button>
          {feedback && (
            <p className={cn(
              'text-caption',
              feedback.startsWith('Fehler') ? 'text-danger' : 'text-success',
            )}>
              {feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label, icon: Icon, value, onChange, placeholder, required, type = 'text',
}: {
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
        <span className="text-caption text-quiet">
          {label}
          {required && <span className="text-bronze-ink"> ·</span>}
        </span>
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-cream/40 border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze focus:bg-paper transition-colors"
      />
    </label>
  );
}
