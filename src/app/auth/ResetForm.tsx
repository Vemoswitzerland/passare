'use client';

import { useActionState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { requestResetAction } from './actions';
import type { ActionResult } from './constants';

export function ResetForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    requestResetAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="text-center space-y-4 py-4">
        <MailCheck className="w-10 h-10 text-bronze mx-auto" strokeWidth={1.25} />
        <p className="text-body text-ink leading-relaxed">
          Falls ein Konto existiert, haben wir dir soeben eine E-Mail mit einem
          Link zum Zurücksetzen geschickt.
        </p>
        <p className="text-caption text-quiet">
          Bitte auch den Spam-Ordner prüfen.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          autoFocus
        />
      </div>

      {state && !state.ok && (
        <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Sende Link…' : (
          <>
            Reset-Link senden <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </Button>
    </form>
  );
}
