'use client';

import { useState, useTransition } from 'react';
import { Save, X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  setAdminNotesAction,
  setTagsAction,
} from '@/app/admin/actions';

type Props = {
  userId: string;
  initialNotes: string | null;
  initialTags: string[];
};

type Status = { kind: 'idle' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string };

function StatusBox({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const isOk = status.kind === 'ok';
  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-soft text-[11px] border ${
        isOk
          ? 'text-success bg-success/10 border-success/30'
          : 'text-danger bg-danger/10 border-danger/30'
      }`}
    >
      {isOk ? <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> : <AlertCircle className="w-3 h-3" strokeWidth={2} />}
      {status.msg}
    </div>
  );
}

export function UserDetailForm({
  userId,
  initialNotes,
  initialTags,
}: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');

  const [notesStatus, setNotesStatus] = useState<Status>({ kind: 'idle' });
  const [tagsStatus, setTagsStatus] = useState<Status>({ kind: 'idle' });

  const [pendingNotes, startNotesTx] = useTransition();
  const [pendingTags, startTagsTx] = useTransition();

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

  return (
    <div className="space-y-4">
      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-2">Tags</h3>
        <p className="text-[12px] text-quiet mb-3">
          Frei definierbare Tags zur Segmentierung (max. 20).
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[1.5rem]">
          {tags.length === 0 && (
            <span className="text-[12px] text-quiet italic">Keine Tags.</span>
          )}
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-soft bg-bronze-soft text-bronze-ink text-[11px] font-medium"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-danger transition-colors"
                aria-label={`Tag ${t} entfernen`}
              >
                <X className="w-2.5 h-2.5" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-2">
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
            className="flex-1 px-2.5 py-1.5 bg-cream border border-stone rounded-soft text-[13px] focus:outline-none focus:border-bronze"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-soft border border-stone bg-paper text-navy text-[12px] hover:border-navy/40 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={1.5} />
            Add
          </button>
        </div>
        <Button size="sm" variant="primary" onClick={saveTags} disabled={pendingTags}>
          <Save className="w-3 h-3" strokeWidth={1.5} />
          {pendingTags ? 'Speichere …' : 'Tags speichern'}
        </Button>
        <StatusBox status={tagsStatus} />
      </section>

      <section className="bg-paper border border-stone rounded-soft p-4">
        <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-2">
          Admin-Notizen
        </h3>
        <p className="text-[12px] text-quiet mb-3">
          Interne Notizen. Nur für Admins sichtbar.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="z. B. Kontaktverlauf, Hinweise …"
          className="w-full px-2.5 py-2 bg-cream border border-stone rounded-soft text-[13px] focus:outline-none focus:border-bronze resize-y mb-2"
        />
        <Button size="sm" variant="primary" onClick={saveNotes} disabled={pendingNotes}>
          <Save className="w-3 h-3" strokeWidth={1.5} />
          {pendingNotes ? 'Speichere …' : 'Notizen speichern'}
        </Button>
        <StatusBox status={notesStatus} />
      </section>
    </div>
  );
}
