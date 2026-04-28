/**
 * Profil-Vollständigkeits-Ring (0-100).
 * Server-Component — keine Interaktivität, nur visuelle Darstellung.
 *
 * Berechnet aus tatsächlich ausgefüllten Profil-/Inserate-Feldern via
 * Postgres-RPC `profile_completeness(user_id)`. Ersetzt den alten manuellen
 * Qualitäts-Score (der für Cyrill keinen Sinn ergab).
 */

type Props = {
  value: number;
};

export function ProfileCompletenessRing({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Farbe je nach Score
  const color =
    clamped >= 80 ? 'text-success' : clamped >= 50 ? 'text-bronze-ink' : clamped >= 25 ? 'text-warn' : 'text-danger';
  const trackColor = 'text-stone';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="3" fill="none" className={trackColor} />
          <circle
            cx="28" cy="28" r={radius}
            stroke="currentColor" strokeWidth="3" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-[12px] font-medium ${color}`}>{clamped}</span>
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wide text-quiet">Profil</span>
    </div>
  );
}
