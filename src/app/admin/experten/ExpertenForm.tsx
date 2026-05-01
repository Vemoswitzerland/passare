'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { upsertExperteAction, deleteExperteAction } from './actions';
import { cn } from '@/lib/utils';

type FormState = {
  name: string;
  funktion: string;
  bio: string;
  email: string;
  foto_url: string;
  expertise: string[];
  honorar_chf_pro_stunde: number;
  slot_dauer_min: number;
  available_weekdays: number[];
  available_hours_start: string;
  available_hours_end: string;
  slot_intervall_min: number;
  is_active: boolean;
  sort_order: number;
};

const WEEKDAY_LABELS: { id: number; short: string; label: string }[] = [
  { id: 1, short: 'Mo', label: 'Montag' },
  { id: 2, short: 'Di', label: 'Dienstag' },
  { id: 3, short: 'Mi', label: 'Mittwoch' },
  { id: 4, short: 'Do', label: 'Donnerstag' },
  { id: 5, short: 'Fr', label: 'Freitag' },
  { id: 6, short: 'Sa', label: 'Samstag' },
  { id: 7, short: 'So', label: 'Sonntag' },
];

export function ExpertenForm({
  initial,
  experteId,
}: {
  initial?: Partial<FormState>;
  experteId?: string;
}) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expertiseInput, setExpertiseInput] = useState('');

  const [state, setState] = useState<FormState>({
    name: initial?.name ?? '',
    funktion: initial?.funktion ?? '',
    bio: initial?.bio ?? '',
    email: initial?.email ?? '',
    foto_url: initial?.foto_url ?? '',
    expertise: initial?.expertise ?? [],
    honorar_chf_pro_stunde: initial?.honorar_chf_pro_stunde ?? 250,
    slot_dauer_min: initial?.slot_dauer_min ?? 60,
    available_weekdays: initial?.available_weekdays ?? [1, 2, 3, 4, 5],
    available_hours_start: initial?.available_hours_start ?? '09:00',
    available_hours_end: initial?.available_hours_end ?? '17:00',
    slot_intervall_min: initial?.slot_intervall_min ?? 30,
    is_active: initial?.is_active ?? true,
    sort_order: initial?.sort_order ?? 100,
  });

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setState((s) => ({ ...s, [key]: val }));
  };

  const addExpertise = () => {
    const t = expertiseInput.trim();
    if (t && !state.expertise.includes(t)) {
      update('expertise', [...state.expertise, t]);
      setExpertiseInput('');
    }
  };
  const removeExpertise = (t: string) => {
    update('expertise', state.expertise.filter((x) => x !== t));
  };

  const toggleWeekday = (id: number) => {
    if (state.available_weekdays.includes(id)) {
      update('available_weekdays', state.available_weekdays.filter((w) => w !== id));
    } else {
      update('available_weekdays', [...state.available_weekdays, id].sort((a, b) => a - b));
    }
  };

  const save = () => {
    setError(null);
    startTx(async () => {
      const res = await upsertExperteAction({
        id: experteId,
        ...state,
      });
      if (res.ok) {
        router.push('/admin/experten');
      } else {
        setError(res.error);
      }
    });
  };

  const remove = () => {
    if (!experteId) return;
    if (!confirm('Diesen Experten deaktivieren? Bestehende Termine bleiben erhalten.')) return;
    startTx(async () => {
      const res = await deleteExperteAction(experteId);
      if (res.ok) router.push('/admin/experten');
      else setError(res.error);
    });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href="/admin/experten"
        className="inline-flex items-center gap-1 text-caption text-bronze-ink hover:text-bronze"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur Übersicht
      </Link>

      <div>
        <p className="overline text-bronze-ink mb-1">Experte</p>
        <h1 className="font-serif text-head-md text-navy font-light">
          {experteId ? 'Profil bearbeiten' : 'Neuer Experte'}
        </h1>
      </div>

      {/* Profil */}
      <Section title="Profil">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name *" value={state.name} onChange={(v) => update('name', v)} placeholder="z.B. Diego Berchtold" />
          <Field label="Funktion" value={state.funktion} onChange={(v) => update('funktion', v)} placeholder="z.B. M&A-Berater" />
          <Field label="E-Mail (intern)" type="email" value={state.email} onChange={(v) => update('email', v)} placeholder="diego@…" />
          <Field label="Profilbild-URL" value={state.foto_url} onChange={(v) => update('foto_url', v)} placeholder="https://…" />
        </div>
        <div className="mt-3">
          <label className="text-caption text-quiet block mb-1">Bio</label>
          <textarea
            value={state.bio}
            onChange={(e) => update('bio', e.target.value)}
            rows={3}
            placeholder="Kurze Beschreibung (1-3 Sätze) — wird auf der Buchungs-Seite angezeigt."
            className="w-full px-3 py-2 bg-cream/40 border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze focus:bg-paper transition-colors"
          />
        </div>
        <div className="mt-3">
          <label className="text-caption text-quiet block mb-1">Expertise-Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {state.expertise.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-soft bg-bronze-soft text-bronze-ink text-caption font-medium"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeExpertise(t)}
                  className="text-bronze-ink hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExpertise(); } }}
              placeholder="z.B. M&A, Steuern …"
              className="flex-1 px-3 py-1.5 bg-cream/40 border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze focus:bg-paper"
            />
            <button
              type="button"
              onClick={addExpertise}
              className="px-3 py-1.5 border border-stone rounded-soft text-caption hover:bg-stone/40"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </Section>

      {/* Honorar + Slot */}
      <Section title="Honorar & Slot">
        <div className="grid sm:grid-cols-3 gap-3">
          <NumberField
            label="Honorar pro Stunde (CHF) *"
            value={state.honorar_chf_pro_stunde}
            onChange={(v) => update('honorar_chf_pro_stunde', v)}
            min={50}
            step={10}
          />
          <NumberField
            label="Slot-Dauer (min)"
            value={state.slot_dauer_min}
            onChange={(v) => update('slot_dauer_min', v)}
            min={15}
            step={15}
          />
          <NumberField
            label="Slot-Intervall (min)"
            value={state.slot_intervall_min}
            onChange={(v) => update('slot_intervall_min', v)}
            min={15}
            step={15}
          />
        </div>
      </Section>

      {/* Verfügbarkeit */}
      <Section title="Verfügbarkeit">
        <div className="mb-3">
          <label className="text-caption text-quiet block mb-1">Wochentage</label>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_LABELS.map((wd) => (
              <button
                key={wd.id}
                type="button"
                onClick={() => toggleWeekday(wd.id)}
                className={cn(
                  'px-3 py-1.5 rounded-soft border text-caption font-medium transition-colors',
                  state.available_weekdays.includes(wd.id)
                    ? 'bg-navy text-cream border-navy'
                    : 'border-stone text-quiet hover:bg-stone/40',
                )}
              >
                {wd.short}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Start (Uhrzeit)" value={state.available_hours_start} onChange={(v) => update('available_hours_start', v)} placeholder="09:00" />
          <Field label="Ende (Uhrzeit)" value={state.available_hours_end} onChange={(v) => update('available_hours_end', v)} placeholder="17:00" />
        </div>
      </Section>

      {/* Sichtbarkeit */}
      <Section title="Sichtbarkeit">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="w-4 h-4 accent-bronze"
            />
            <span className="text-body-sm text-navy">Aktiv (für Verkäufer sichtbar)</span>
          </label>
          <NumberField
            label="Sortierung (kleiner = oben)"
            value={state.sort_order}
            onChange={(v) => update('sort_order', v)}
            min={0}
            step={10}
          />
        </div>
      </Section>

      {/* Footer */}
      {error && (
        <p className="text-caption text-danger flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone">
        {experteId ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-caption text-quiet hover:text-danger transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Deaktivieren
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2} />
          {pending ? 'Speichert …' : experteId ? 'Speichern' : 'Anlegen'}
        </button>
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-paper border border-stone p-4 md:p-5">
      <p className="overline text-bronze-ink mb-3">{title}</p>
      {children}
    </section>
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

function NumberField({
  label, value, onChange, min, step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-caption text-quiet block mb-1">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        min={min}
        step={step}
        className="w-full px-3 py-2 bg-cream/40 border border-stone rounded-soft text-body-sm font-mono focus:outline-none focus:border-bronze focus:bg-paper transition-colors"
      />
    </label>
  );
}
