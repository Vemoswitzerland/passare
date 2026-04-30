'use client';

import { useState, useTransition } from 'react';
import { Bell, Mail, ShieldCheck } from 'lucide-react';
import { setNotificationPref } from '@/app/dashboard/settings-actions';
import {
  NOTIFICATION_KEYS,
  GROUP_LABELS,
  GROUP_DESCRIPTIONS,
  type NotificationGroup,
  type NotificationDef,
} from '@/lib/notification-keys';
import { cn } from '@/lib/utils';

type Props = {
  initialPrefs: Record<string, boolean>;
  /** Welche Gruppen anzeigen (Käufer-Settings: nur kaeufer + plattform). */
  showGroups?: NotificationGroup[];
};

/**
 * Benachrichtigungszentrum — Toggle-Liste pro Mail-Typ.
 * Cyrill: «Wann er in welchem Fall ein Mail bekommen möchte».
 *
 * Defensive: Default-Wert ist `true` (alles aktiv). Pref wird beim
 * ersten Toggle persistiert. Kein Save-Button — Toggle = Save.
 */
export function NotificationCenter({
  initialPrefs,
  showGroups = ['verkaeufer', 'kaeufer', 'plattform'],
}: Props) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(initialPrefs);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTx] = useTransition();
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    const newValue = !(prefs[key] ?? true);
    setPrefs((p) => ({ ...p, [key]: newValue }));
    setPendingKey(key);
    setErrorKey(null);
    startTx(async () => {
      const res = await setNotificationPref(key, newValue);
      setPendingKey(null);
      if (!res.ok) {
        // Rollback bei Fehler
        setPrefs((p) => ({ ...p, [key]: !newValue }));
        setErrorKey(key);
      }
    });
  };

  const grouped: Record<NotificationGroup, NotificationDef[]> = {
    verkaeufer: NOTIFICATION_KEYS.filter((k) => k.group === 'verkaeufer'),
    kaeufer: NOTIFICATION_KEYS.filter((k) => k.group === 'kaeufer'),
    plattform: NOTIFICATION_KEYS.filter((k) => k.group === 'plattform'),
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
        </span>
        <div>
          <h2 className="font-serif text-head-md text-navy font-light leading-tight">
            Benachrichtigungen
          </h2>
          <p className="text-body-sm text-muted mt-1">
            Wähle, wann passare dich per E-Mail informieren soll. Änderungen werden sofort
            gespeichert.
          </p>
        </div>
      </header>

      {showGroups.map((group) => {
        const items = grouped[group];
        if (items.length === 0) return null;
        const Icon = group === 'plattform' ? ShieldCheck : Mail;
        return (
          <section key={group} className="bg-paper border border-stone rounded-card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone bg-cream/40">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                <p className="overline text-bronze-ink">{GROUP_LABELS[group]}</p>
              </div>
              <p className="text-caption text-quiet mt-1.5 ml-[26px]">{GROUP_DESCRIPTIONS[group]}</p>
            </div>
            <ul>
              {items.map((item, i) => {
                const enabled = prefs[item.key] ?? true;
                const isPending = pendingKey === item.key;
                const hasError = errorKey === item.key;
                return (
                  <li
                    key={item.key}
                    className={cn(
                      'flex items-start justify-between gap-4 px-5 py-3.5',
                      i !== items.length - 1 && 'border-b border-stone/40',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm text-navy font-medium">{item.label}</p>
                      <p className="text-caption text-quiet leading-snug mt-0.5">{item.description}</p>
                      {hasError && (
                        <p className="text-caption text-danger mt-1">
                          Speichern fehlgeschlagen — versuch es nochmal.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${item.label} ${enabled ? 'deaktivieren' : 'aktivieren'}`}
                      onClick={() => toggle(item.key)}
                      disabled={isPending}
                      className={cn(
                        // 44 × 24 Track mit 2 px Innen-Padding → 20 × 20 Knopf
                        // bewegt sich exakt zwischen 0 und 20 px (Track-Breite −
                        // Knopf-Breite − 2× Padding). Flexbox-Layout statt absolut
                        // positionierten Span — der Bug «Kugel ausserhalb» kam von
                        // translate-x-[18px] mit JIT-Tailwind das den arbitrary
                        // value nicht kompilierte.
                        'flex-shrink-0 inline-flex items-center w-11 h-6 rounded-full p-0.5 transition-colors',
                        enabled ? 'bg-bronze' : 'bg-stone',
                        isPending && 'opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'block w-5 h-5 bg-cream rounded-full shadow-subtle transition-transform',
                          enabled ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="text-caption text-quiet">
        Sicherheits-relevante Mails (Login-Bestätigung, Passwort-Reset, Rechnungen) gehen unabhängig
        von dieser Auswahl raus — gesetzlich oder vertraglich vorgeschrieben.
      </p>
    </div>
  );
}
