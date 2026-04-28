'use client';

import { useState, useTransition } from 'react';
import { Save, X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  setAdminNotesAction,
  setQualitaetsScoreAction,
  setTagsAction,
  setVerificationAction,
} from '@/app/admin/actions';

type Props = {
  userId: string;
  initialScore: number | null;
  initialNotes: string | null;
  initialTags: string[];
  verifiedPhone: boolean;
  verifiedKyc: boolean;
};

type Status = { kind: 'idle' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string };

function StatusBox({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const isOk = status.kind === 'ok';
  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-soft text-caption border ${
        isOk
          ? 'text-success bg-success/10 border-success/30'
          : 'text-danger bg-danger/10 border-danger/30'
      }`}
    >
      {isOk ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> : <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />}
      {status.msg}
    </div>
  );
}

export function UserDetailForm({
  userId,
  initialScore,
  initialNotes,
  initialTags,
  verifiedPhone,
  verifiedKyc,
}: Props) {
  const [score, setScore] = useState<string>(initialScore?.toString() ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [phone, setPhone] = useState(verifiedPhone);
  const [kyc, setKyc] = useState(verifiedKyc);

  const [scoreStatus, setScoreStatus] = useState<Status>({ kind: 'idle' });
  const [notesStatus, setNotesStatus] = useState<Status>({ kind: 'idle' });
  const [tagsStatus, setTagsStatus] = useState<Status>({ kind: 'idle' });
  const [verifyStatus, setVerifyStatus] = useState<Status>({ kind: 'idle' });

  const [pendingScore, startScoreTx] = useTransition();
  const [pendingNotes, startNotesTx] = useTransition();
  const [pendingTags, startTagsTx] = useTransition();
  const [pendingVerify, startVerifyTx] = useTransition();

  const saveScore = () => {
    setScoreStatus({ kind: 'idle' });
    const parsed = score === '' ? null : Number(score);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      setScoreStatus({ kind: 'err', msg: 'Score 0–100 oder leer.' });
      return;
    }
    startScoreTx(async () => {
      const res = await setQualitaetsScoreAction({ user_id: userId, score: parsed });
      setScoreStatus(res.ok ? { kind: 'ok', msg: 'Gespeichert.' } : { kind: 'err', msg: res.error ?? 'Fehler.' });
    });
  };

  const saveNotes = () => {
    setNotesStatus({ kind: 'idle' });
    startNotesTx(async () => {
      const res = await setAdminNotesAction({ user_id: userId, notes });
      setNotesStatus(res.ok ? { kind: 'ok', msg: 'Gespeichert.' } : { kind: 'err', msg: res.error ?? 'Fehler.' });
    });
  };

  const addTag = () => {
    const t = newTag.trim();
    if (!t || tags.includes(t) || tags.length >= 20) return;
    const next = [...tags, t];
    setTags(next);
    setNewTag('');
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const saveTags = () => {
    setTagsStatus({ kind: 'idle' });
    startTagsTx(async () => {
      const res = await setTagsAction({ user_id: userId, tags });
      setTagsStatus(res.ok ? { kind: 'ok', msg: 'Gespeichert.' } : { kind: 'err', msg: res.error ?? 'Fehler.' });
    });
  };

  const toggleVerify = (field: 'verified_phone' | 'verified_kyc', value: boolean) => {
    setVerifyStatus({ kind: 'idle' });
    if (field === 'verified_phone') setPhone(value);
    else setKyc(value);

    startVerifyTx(async () => {
      const res = await setVerificationAction({ user_id: userId, field, value });
      if (!res.ok) {
        setVerifyStatus({ kind: 'err', msg: res.error ?? 'Fehler.' });
        if (field === 'verified_phone') setPhone(!value);
        else setKyc(!value);
      } else {
        setVerifyStatus({ kind: 'ok', msg: 'Aktualisiert.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Verifizierung</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow
            label="Telefon verifiziert"
            checked={phone}
            disabled={pendingVerify}
            onChange={(v) => toggleVerify('verified_phone', v)}
          />
          <ToggleRow
            label="KYC abgeschlossen"
            checked={kyc}
            disabled={pendingVerify}
            onChange={(v) => toggleVerify('verified_kyc', v)}
          />
        </div>
        <StatusBox status={verifyStatus} />
      </section>

      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-2">Qualitäts-Score</h3>
        <p className="text-caption text-quiet mb-4">
          Wert zwischen 0 und 100. Leer lassen = nicht bewertet.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="—"
            className="w-32 px-3 py-2 bg-cream border border-stone rounded-soft font-mono text-body-sm focus:outline-none focus:border-bronze"
          />
          <Button size="sm" variant="primary" onClick={saveScore} disabled={pendingScore}>
            <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
            {pendingScore ? 'Speichere …' : 'Speichern'}
          </Button>
        </div>
        <StatusBox status={scoreStatus} />
      </section>

      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-2">Tags</h3>
        <p className="text-caption text-quiet mb-4">
          Frei definierbare Tags zur Segmentierung (max. 20). Beispiel: «vip», «high-touch», «strategisch».
        </p>
        <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
          {tags.length === 0 && <span className="text-caption text-quiet italic">Keine Tags.</span>}
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-bronze-soft text-bronze-ink text-caption font-medium"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-danger transition-colors"
                aria-label={`Tag ${t} entfernen`}
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Neuer Tag …"
            className="flex-1 px-3 py-2 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-soft border border-stone bg-paper text-navy text-caption hover:border-navy/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Hinzufügen
          </button>
        </div>
        <Button size="sm" variant="primary" onClick={saveTags} disabled={pendingTags}>
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          {pendingTags ? 'Speichere …' : 'Tags speichern'}
        </Button>
        <StatusBox status={tagsStatus} />
      </section>

      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-2">Admin-Notizen</h3>
        <p className="text-caption text-quiet mb-4">
          Interne Notizen zu diesem User. Nur für Admins sichtbar.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="z. B. Kontaktverlauf, Hinweise, Eigenheiten …"
          className="w-full px-3 py-2 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze resize-y mb-3"
        />
        <Button size="sm" variant="primary" onClick={saveNotes} disabled={pendingNotes}>
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          {pendingNotes ? 'Speichere …' : 'Notizen speichern'}
        </Button>
        <StatusBox status={notesStatus} />
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-cream border border-stone rounded-soft cursor-pointer hover:border-bronze/40 transition-colors">
      <span className="text-body-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-success' : 'bg-stone'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-paper rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
