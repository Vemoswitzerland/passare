'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Pause,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { respondToRevisionAction } from '@/app/dashboard/verkaeufer/inserat/actions';
import { cn } from '@/lib/utils';

type Status =
  | 'entwurf'
  | 'pending'
  | 'zur_pruefung'
  | 'rueckfrage'
  | 'live'
  | 'pausiert'
  | 'verkauft'
  | 'abgelaufen'
  | 'abgelehnt';

/**
 * Status-Banner für Verkäufer-Inserat.
 * - entwurf: Hinweis «Noch nicht eingereicht»
 * - pending/zur_pruefung: gelb «In Prüfung — Admin schaut sich das an»
 * - rueckfrage: bronze «Admin hat eine Rückfrage» + Antwort-Form
 * - live: grün «Live im Marktplatz»
 * - pausiert: grau «Pausiert»
 * - abgelehnt: rot «Abgelehnt» + Begründung (read-only)
 * - abgelaufen: grau «Abgelaufen»
 */
export function InseratStatusBanner({
  inseratId,
  status,
  rejectionReason,
}: {
  inseratId: string;
  status: Status;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, startTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const submit = () => {
    setMsg(null);
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setMsg({ kind: 'err', text: 'Antwort zu kurz (mind. 3 Zeichen).' });
      return;
    }
    startTx(async () => {
      const res = await respondToRevisionAction(inseratId, trimmed);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Antwort gesendet — Inserat geht zurück zur Prüfung.' });
        setText('');
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  if (status === 'entwurf') {
    return (
      <Banner
        tone="neutral"
        icon={Clock}
        title="Inserat ist noch ein Entwurf"
        body="Wenn du fertig bist, klick auf «Zur Prüfung einreichen». Das passare-Team prüft das Inserat und gibt es frei."
      />
    );
  }

  if (status === 'pending' || status === 'zur_pruefung') {
    return (
      <Banner
        tone="warn"
        icon={Clock}
        title="In Prüfung"
        body="Das passare-Team schaut sich dein Inserat an. Du bekommst Bescheid, sobald es freigegeben ist — oder eine Rückfrage."
      />
    );
  }

  if (status === 'rueckfrage') {
    return (
      <div className="rounded-soft border border-bronze/40 bg-bronze/10 p-4">
        <div className="flex items-start gap-2.5 mb-3">
          <MessageCircle className="w-4 h-4 text-bronze-ink mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-navy font-semibold">
              Rückfrage vom passare-Team
            </p>
            <p className="text-[12px] text-muted mt-0.5">
              Schau dir die Nachricht unten an, passe das Inserat ggf. an und antworte hier. Nach
              dem Senden geht das Inserat zurück zur Prüfung.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Deine Antwort an das passare-Team …"
          className="w-full px-2.5 py-2 bg-paper border border-stone rounded-soft text-[13px] focus:outline-none focus:border-bronze resize-y mb-2"
        />

        <div className="flex items-center justify-between gap-3">
          {msg ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px]',
                msg.kind === 'ok' ? 'text-success' : 'text-danger',
              )}
            >
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {msg.text}
            </span>
          ) : (
            <span className="text-[11px] text-quiet">
              Mind. 3 Zeichen, max. 4000.
            </span>
          )}
          <Button size="sm" variant="primary" onClick={submit} disabled={pending}>
            <Send className="w-3 h-3" strokeWidth={1.5} />
            {pending ? 'Sendet …' : 'Antwort senden'}
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'live') {
    return (
      <Banner
        tone="success"
        icon={CheckCircle2}
        title="Live im Marktplatz"
        body="Käufer können dein Inserat sehen und Anfragen stellen. Anfragen findest du im Tab «Anfragen»."
      />
    );
  }

  if (status === 'pausiert') {
    return (
      <Banner
        tone="muted"
        icon={Pause}
        title="Pausiert"
        body="Inserat ist aktuell nicht im Marktplatz sichtbar. Das passare-Team kann es jederzeit wieder freigeben."
      />
    );
  }

  if (status === 'abgelaufen') {
    return (
      <Banner
        tone="muted"
        icon={Clock}
        title="Abgelaufen"
        body="Die Laufzeit ist vorbei. Verlängere das Inserat im Tab «Paket» um es wieder live zu schalten."
      />
    );
  }

  if (status === 'verkauft') {
    return (
      <Banner
        tone="success"
        icon={CheckCircle2}
        title="Verkauft 🎉"
        body="Glückwunsch — der Deal ist abgeschlossen. Das Inserat ist nicht mehr öffentlich sichtbar."
      />
    );
  }

  if (status === 'abgelehnt') {
    return (
      <div className="rounded-soft border border-danger/30 bg-danger/5 p-4">
        <div className="flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-navy font-semibold">Inserat wurde abgelehnt</p>
            {rejectionReason ? (
              <p className="text-[12px] text-muted mt-1 whitespace-pre-wrap">
                <span className="font-medium text-ink">Begründung: </span>
                {rejectionReason}
              </p>
            ) : (
              <p className="text-[12px] text-muted mt-0.5">
                Bei Fragen wende dich an das passare-Team.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Banner({
  tone,
  icon: Icon,
  title,
  body,
}: {
  tone: 'neutral' | 'warn' | 'success' | 'muted';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  const tones = {
    neutral: 'border-stone bg-stone/30 text-ink',
    warn: 'border-warn/30 bg-warn/10 text-navy',
    success: 'border-success/30 bg-success/10 text-navy',
    muted: 'border-stone bg-paper text-ink',
  };
  const iconTones = {
    neutral: 'text-quiet',
    warn: 'text-warn',
    success: 'text-success',
    muted: 'text-quiet',
  };
  return (
    <div className={cn('rounded-soft border p-4 flex items-start gap-2.5', tones[tone])}>
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconTones[tone])} strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="text-[12px] text-muted mt-0.5">{body}</p>
      </div>
    </div>
  );
}
