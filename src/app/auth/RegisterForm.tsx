'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { GoogleButton, AuthDivider } from '@/components/ui/google-button';
import { registerAction } from './actions';
import type { ActionResult } from './constants';

export function RegisterForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    registerAction,
    null,
  );
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <div>
      <GoogleButton label="Mit Google registrieren" />
      <AuthDivider />

      <form action={action} className="space-y-5">
        <div>
          <Label htmlFor="full_name">Vollständiger Name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            disabled={pending}
            placeholder="Anna Müller"
          />
        </div>

        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            placeholder="anna.muller@firma.ch"
          />
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Passwort"
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

        <label className="flex items-start gap-3 text-caption text-muted leading-snug cursor-pointer">
          <input
            type="checkbox"
            name="accept_terms"
            required
            disabled={pending}
            className="mt-[3px] h-4 w-4 accent-bronze cursor-pointer flex-shrink-0"
          />
          <span>
            Ich akzeptiere die{' '}
            <Link href="/agb" className="editorial text-navy">AGB</Link>{' '}
            und die{' '}
            <Link href="/datenschutz" className="editorial text-navy">Datenschutzerklärung</Link>.
          </span>
        </label>

        {state && !state.ok && (
          <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending || mismatch} className="w-full" size="lg">
          {pending ? 'Konto wird erstellt…' : (
            <>
              Konto erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
