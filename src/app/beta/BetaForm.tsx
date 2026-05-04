'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// SECURITY: Whitelist für `from`-Param — sonst Open-Redirect via `//evil.com`.
function isSafeFrom(value: string | null): value is string {
  if (!value) return false;
  if (value.length === 0) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith('/\\')) return false;
  return true;
}

export function BetaForm() {
  const router = useRouter();
  const params = useSearchParams();
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
        const fromRaw = params.get('from');
        const target = isSafeFrom(fromRaw) ? fromRaw : '/';
        // Hard-Reload damit das frisch gesetzte httpOnly-Beta-Cookie
        // garantiert mitkommt (next/router refresh reicht teils nicht).
        window.location.assign(target);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ungültiger Code');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label htmlFor="code">Zugangscode</Label>
        <Input
          id="code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          disabled={pending}
          placeholder="••••••••••"
          autoFocus
        />
      </div>

      {error && (
        <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Prüfe…' : (
          <>
            Zugang freischalten <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </Button>
    </form>
  );
}
