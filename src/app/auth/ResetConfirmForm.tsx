'use client';

import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { updatePasswordAction } from './actions';
import type { ActionResult } from './constants';

export function ResetConfirmForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updatePasswordAction,
    null,
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="password">Neues Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          disabled={pending}
          placeholder="Mindestens 8 Zeichen"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="confirm">Passwort bestätigen</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          disabled={pending}
        />
      </div>

      {state && !state.ok && (
        <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Speichere…' : (
          <>
            Passwort speichern <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </Button>
    </form>
  );
}
