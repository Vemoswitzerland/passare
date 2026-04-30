import {
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Pause,
} from 'lucide-react';
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
 * Status-Banner für Verkäufer-Inserat (server-component-kompatibel,
 * kein State mehr — die Antwort-Logik liegt jetzt im InseratChat).
 *
 * Cyrill: «Konversation im Chatfenster anzeigen, nicht darunter».
 */
export function InseratStatusBanner({
  status,
  rejectionReason,
}: {
  inseratId?: string;
  status: Status;
  rejectionReason?: string | null;
}) {

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
    // Cyrill: «Konversation im Chatfenster anzeigen, nicht darunter».
    // Banner zeigt nur den Status — die textarea ist im InseratChat
    // direkt im Konversations-Container.
    return (
      <Banner
        tone="warn"
        icon={MessageCircle}
        title="Rückfrage vom passare-Team"
        body="Antworte direkt im Chat-Fenster unten. Sobald du sendest, geht dein Inserat zurück zur Prüfung."
      />
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
