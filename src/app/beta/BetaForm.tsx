'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function BetaForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.refresh();
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ungültiger Code');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-xs tracking-wider uppercase text-deep/60 mb-2">
          Zugangscode
        </label>
        <input
          id="code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          disabled={pending}
          className="w-full px-4 py-3 bg-cream border border-deep/15 rounded-lg text-deep placeholder:text-deep/30 focus:outline-none focus:border-terra transition-colors"
          placeholder="••••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-terra bg-terra/5 border border-terra/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-6 py-3 bg-deep text-cream rounded-lg font-medium hover:bg-terra transition-colors disabled:opacity-50"
      >
        {pending ? 'Prüfe…' : 'Zugang freischalten'}
      </button>
    </form>
  );
}
