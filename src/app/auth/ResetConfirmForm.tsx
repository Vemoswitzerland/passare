'use client';

import { useActionState, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { updatePasswordAction } from './actions';
import type { ActionResult } from './constants';

export function ResetConfirmForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updatePasswordAction,
    null,
  );
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <form action={action} className="space-y-5">
      <PasswordField
        id="password"
        name="password"
        label="Neues Passwort"
        placeholder="Mindestens 8 Zeichen"
        autoComplete="new-password"
        required
        disabled={pending}
        showStrength
        value={pw}
        onChange={setPw}
      />

      <div>
        <PasswordField
          id="confirm"
          name="confirm"
          label="Passwort bestätigen"
          autoComplete="new-password"
          required
          disabled={pending}
          value={confirm}
          onChange={setConfirm}
        />
        {mismatch && (
          <p className="mt-1.5 text-caption text-danger">
            Passwörter stimmen nicht überein
          </p>
        )}
      </div>

      {state && !state.ok && (
        <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending || mismatch} className="w-full" size="lg">
        {pending ? 'Speichere…' : (
          <>
            Passwort speichern <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </Button>
    </form>
  );
}
