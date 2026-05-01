'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Check, ArrowRight, Loader2, AlertTriangle,
} from 'lucide-react';
import { bookExpertTermin, confirmExpertTerminMock } from '../actions';
import { cn } from '@/lib/utils';

/**
 * Calendly-ähnlicher Buchungs-Flow für Experten-Termine.
 *
 * Cyrill 01.05.2026: «Wie das Calendly-System bei app.vemo — Profilbild,
 * Kalender-Integration komplett.»
 *
 * 3-Schritt-Wizard:
 *   1. Datum + Slot wählen
 *   2. Kontakt-Daten + Thema
 *   3. Checkout (Mock-Stripe → später echtes Stripe)
 *
 * Verfügbarkeit basiert auf experte.available_weekdays + Hours +
 * blocked_dates + bereits belegte Slots.
 */

type ExpertenInfo = {
  id: string;
  name: string;
  funktion: string | null;
  foto_url: string | null;
  bio: string | null;
  expertise: string[];
  honorar: number;
  slot_dauer_min: number;
  available_weekdays: number[]; // 1=Mo..7=So
  available_hours_start: string; // "09:00"
  available_hours_end: string; // "17:00"
  slot_intervall_min: number;
  blocked_dates: string[]; // ["2026-05-15", ...]
};

type BelegterSlot = { start_at: string; dauer_min: number };

type Props = {
  experte: ExpertenInfo;
  belegteSlots: BelegterSlot[];
  initialName: string;
  initialEmail: string;
  initialTelefon: string;
};

type Step = 1 | 2 | 3;

export function ExpertenBookingClient({
  experte, belegteSlots, initialName, initialEmail, initialTelefon,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Wizard-State
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // ISO date "2026-05-15"
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // "HH:mm"
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [telefon, setTelefon] = useState(initialTelefon);
  const [thema, setThema] = useState('');
  const [notizen, setNotizen] = useState('');
  const [terminId, setTerminId] = useState<string | null>(null);

  // Monat-Navigation
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Tage des aktuellen Monats vorberechnen
  const days = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  // Slots für selectedDate berechnen
  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return buildSlotsForDate(selectedDate, experte, belegteSlots);
  }, [selectedDate, experte, belegteSlots]);

  const honorar = (experte.honorar * experte.slot_dauer_min) / 60;

  // Schritt 1 → 2
  const goToContact = () => {
    if (!selectedDate || !selectedSlot) return;
    setError(null);
    setStep(2);
  };

  // Schritt 2 → 3 (Termin anlegen + zum Checkout)
  const goToCheckout = () => {
    if (!selectedDate || !selectedSlot) return;
    if (!name.trim() || !email.trim()) {
      setError('Name und E-Mail sind erforderlich.');
      return;
    }
    setError(null);
    const startAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
    startTx(async () => {
      const res = await bookExpertTermin({
        experteId: experte.id,
        startAt,
        dauerMin: experte.slot_dauer_min,
        name: name.trim(),
        email: email.trim(),
        telefon: telefon.trim() || undefined,
        thema: thema.trim() || undefined,
        notizen: notizen.trim() || undefined,
      });
      if (res.ok) {
        setTerminId(res.id ?? null);
        setStep(3);
      } else {
        setError(res.error);
      }
    });
  };

  // Schritt 3: Mock-Pay (später echtes Stripe)
  const finishMockCheckout = () => {
    if (!terminId) return;
    startTx(async () => {
      const res = await confirmExpertTerminMock(terminId);
      if (res.ok) {
        router.push(`/dashboard/verkaeufer/experten?confirmed=${terminId}`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      {/* ── EXPERTEN-PROFIL LINKS ──────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-card bg-paper border border-stone p-5">
          {experte.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={experte.foto_url}
              alt={experte.name}
              className="w-20 h-20 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-bronze/15 flex items-center justify-center mb-3">
              <span className="text-bronze-ink font-medium text-head-sm">
                {experte.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </span>
            </div>
          )}
          <h1 className="font-serif text-head-md text-navy font-light leading-tight">
            {experte.name}
          </h1>
          {experte.funktion && (
            <p className="text-caption text-quiet mb-3">{experte.funktion}</p>
          )}
          {experte.bio && (
            <p className="text-body-sm text-muted leading-relaxed mb-4">{experte.bio}</p>
          )}
          {experte.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {experte.expertise.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-soft bg-bronze-soft text-bronze-ink text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="border-t border-stone pt-3 grid grid-cols-2 gap-3 text-caption">
            <div>
              <p className="text-quiet">Dauer</p>
              <p className="text-navy font-medium">{experte.slot_dauer_min} min</p>
            </div>
            <div>
              <p className="text-quiet">Honorar</p>
              <p className="text-navy font-mono font-medium">CHF {honorar.toLocaleString('de-CH')}</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <ol className="mt-4 space-y-1">
          <StepItem n={1} label="Datum & Uhrzeit" current={step} />
          <StepItem n={2} label="Kontakt-Daten" current={step} />
          <StepItem n={3} label="Bezahlen" current={step} />
        </ol>
      </aside>

      {/* ── HAUPTBEREICH RECHTS ────────────────────────────────── */}
      <section className="rounded-card bg-paper border border-stone p-5 md:p-6 min-h-[500px]">
        {step === 1 && (
          <>
            <h2 className="font-serif text-head-sm text-navy font-light mb-1">
              Datum wählen
            </h2>
            <p className="text-caption text-quiet mb-4">Wähle einen Tag mit verfügbaren Slots.</p>

            {/* Monat-Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(monthCursor);
                  d.setMonth(d.getMonth() - 1);
                  setMonthCursor(d);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                disabled={isCurrentMonth(monthCursor)}
                className="p-2 rounded-soft hover:bg-stone/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-navy" strokeWidth={1.5} />
              </button>
              <p className="font-medium text-navy">
                {monthCursor.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(monthCursor);
                  d.setMonth(d.getMonth() + 1);
                  setMonthCursor(d);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                className="p-2 rounded-soft hover:bg-stone/40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-navy" strokeWidth={1.5} />
              </button>
            </div>

            {/* Wochentag-Header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((wd) => (
                <p key={wd} className="text-caption text-quiet text-center font-medium py-1">{wd}</p>
              ))}
            </div>

            {/* Tage-Grid */}
            <div className="grid grid-cols-7 gap-1 mb-5">
              {days.map((day, i) => {
                const isAvailable = isDayAvailable(day, experte);
                const isSelected = selectedDate === day.iso;
                const isPast = day.isPast;
                if (!day.iso) {
                  return <div key={`empty-${i}`} />;
                }
                return (
                  <button
                    key={day.iso}
                    type="button"
                    disabled={!isAvailable || isPast}
                    onClick={() => {
                      setSelectedDate(day.iso);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      'aspect-square rounded-soft text-body-sm font-medium transition-colors',
                      isSelected && 'bg-navy text-cream',
                      !isSelected && isAvailable && !isPast && 'hover:bg-bronze/10 text-navy',
                      (!isAvailable || isPast) && 'text-quiet/40 cursor-not-allowed line-through',
                    )}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>

            {/* Slots des gewählten Tags */}
            {selectedDate && (
              <>
                <h3 className="font-medium text-navy text-body-sm mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
                  Verfügbare Slots am {formatDateShort(selectedDate)}
                </h3>
                {slots.length === 0 ? (
                  <p className="text-caption text-quiet">Keine Slots an diesem Tag verfügbar.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={s.taken}
                        onClick={() => setSelectedSlot(s.time)}
                        className={cn(
                          'px-3 py-2 rounded-soft border text-body-sm font-mono transition-colors',
                          selectedSlot === s.time
                            ? 'bg-navy text-cream border-navy'
                            : s.taken
                              ? 'bg-stone/30 text-quiet/50 border-stone cursor-not-allowed line-through'
                              : 'border-stone text-navy hover:border-bronze hover:bg-bronze/5',
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={goToContact}
                disabled={!selectedDate || !selectedSlot}
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Weiter
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-serif text-head-sm text-navy font-light mb-1">
              Deine Daten
            </h2>
            <p className="text-caption text-quiet mb-4">
              Termin: {formatDateLong(selectedDate ?? '')} um {selectedSlot} Uhr
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name *" value={name} onChange={setName} placeholder="Max Muster" />
              <Field label="E-Mail *" type="email" value={email} onChange={setEmail} placeholder="max@firma.ch" />
              <Field label="Telefon" type="tel" value={telefon} onChange={setTelefon} placeholder="+41 79 …" />
              <Field label="Thema (optional)" value={thema} onChange={setThema} placeholder="z.B. Bewertung 2. Meinung" />
            </div>
            <div className="mt-3">
              <label className="text-caption text-quiet block mb-1">Notizen (optional)</label>
              <textarea
                value={notizen}
                onChange={(e) => setNotizen(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-cream/40 border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze focus:bg-paper transition-colors"
                placeholder="Welche Fragen willst du besprechen?"
              />
            </div>

            {error && (
              <p className="text-caption text-danger mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-caption text-quiet hover:text-navy"
              >
                ← Zurück
              </button>
              <button
                type="button"
                onClick={goToCheckout}
                disabled={pending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    Buche …
                  </>
                ) : (
                  <>
                    Zur Bezahlung
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-serif text-head-sm text-navy font-light mb-1">
              Bezahlen & Termin bestätigen
            </h2>
            <p className="text-caption text-quiet mb-4">
              Termin: {formatDateLong(selectedDate ?? '')} um {selectedSlot} · {experte.slot_dauer_min} min mit {experte.name}
            </p>

            <div className="rounded-card bg-bronze/5 border border-bronze/30 p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-body text-navy font-medium">Beratungs-Honorar</p>
                <p className="font-mono text-head-sm text-navy">
                  CHF {honorar.toLocaleString('de-CH')}
                </p>
              </div>
              <p className="text-caption text-quiet">
                Für {experte.slot_dauer_min} min à CHF {experte.honorar.toLocaleString('de-CH')}/h.
                Inklusive 8.1% MwSt.
              </p>
            </div>

            <p className="text-caption text-muted mb-4 leading-relaxed">
              In Produktion: Stripe-Checkout mit Karten-Eingabe. Hier vorerst Mock —
              Klick «Termin bestätigen» fixt den Termin und du erhältst eine Bestätigungs-
              Mail mit Meeting-Link.
            </p>

            {error && (
              <p className="text-caption text-danger mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-caption text-quiet hover:text-navy"
              >
                ← Zurück
              </button>
              <button
                type="button"
                onClick={finishMockCheckout}
                disabled={pending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-white rounded-soft text-body-sm font-medium hover:bg-bronze-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    Bestätige …
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    Termin bestätigen (Mock-Pay)
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── HELPER COMPONENTS ─────────────────────────────────────────────

function StepItem({ n, label, current }: { n: number; label: string; current: number }) {
  const done = current > n;
  const active = current === n;
  return (
    <li className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-soft text-caption',
      active && 'bg-bronze/10 text-navy font-medium',
      done && 'text-success',
      !active && !done && 'text-quiet',
    )}>
      <span className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
        active ? 'bg-bronze text-cream' : done ? 'bg-success/20 text-success' : 'bg-stone text-quiet',
      )}>
        {done ? <Check className="w-3 h-3" strokeWidth={2} /> : n}
      </span>
      {label}
    </li>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-caption text-quiet block mb-1">{label}</span>
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

// ─── DATE/SLOT-LOGIK ───────────────────────────────────────────────

type DayCell = { day: number; iso: string; isPast: boolean };

/**
 * Baut ein Monats-Grid mit Pufferzellen am Anfang (für korrekte Wochentag-
 * Ausrichtung — Montag = 1).
 */
function buildMonthGrid(monthCursor: Date): Array<DayCell | { day: 0; iso: ''; isPast: false }> {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Wochentag von Montag aus: 0 = Mo, 6 = So
  const startWeekday = (firstDay.getDay() + 6) % 7;

  const cells: Array<DayCell | { day: 0; iso: ''; isPast: false }> = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: 0, iso: '', isPast: false });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso, isPast: dt < today });
  }
  return cells;
}

function isCurrentMonth(monthCursor: Date): boolean {
  const now = new Date();
  return monthCursor.getFullYear() === now.getFullYear() && monthCursor.getMonth() === now.getMonth();
}

function isDayAvailable(day: DayCell | { day: 0; iso: ''; isPast: false }, experte: ExpertenInfo): boolean {
  if (day.day === 0) return false;
  if (day.isPast) return false;
  // Wochentag-Check
  const dt = new Date(day.iso);
  const weekday = dt.getDay() === 0 ? 7 : dt.getDay(); // 1=Mo..7=So
  if (!experte.available_weekdays.includes(weekday)) return false;
  // Geblockte Daten
  if (experte.blocked_dates.includes(day.iso)) return false;
  return true;
}

type SlotInfo = { time: string; taken: boolean };

/**
 * Erzeugt alle möglichen Slots für ein Datum (z.B. 09:00, 09:30, 10:00, …)
 * basierend auf experte.available_hours_start..end + slot_intervall_min.
 * Markiert Slots als taken wenn sie in belegteSlots überschneiden.
 */
function buildSlotsForDate(
  isoDate: string,
  experte: ExpertenInfo,
  belegteSlots: BelegterSlot[],
): SlotInfo[] {
  const [startH, startM] = experte.available_hours_start.split(':').map(Number);
  const [endH, endM] = experte.available_hours_end.split(':').map(Number);
  const startMinute = startH * 60 + startM;
  const endMinute = endH * 60 + endM;
  const interval = experte.slot_intervall_min || 30;
  const dauer = experte.slot_dauer_min || 30;

  // Belegte Slot-Bereiche dieses Tages in Minutenform
  const belegtRanges = belegteSlots
    .filter((b) => b.start_at.startsWith(isoDate))
    .map((b) => {
      const d = new Date(b.start_at);
      const m = d.getHours() * 60 + d.getMinutes();
      return [m, m + b.dauer_min] as const;
    });

  const now = new Date();
  const isToday = isoDate === toIso(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const result: SlotInfo[] = [];
  for (let m = startMinute; m + dauer <= endMinute; m += interval) {
    // In der Vergangenheit?
    if (isToday && m <= nowMin + 60) continue; // mind. 1h Vorlauf für heute
    const taken = belegtRanges.some(([bs, be]) => m < be && m + dauer > bs);
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    result.push({ time: `${hh}:${mm}`, taken });
  }
  return result;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
