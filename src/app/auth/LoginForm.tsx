'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { OAuthButtons, AuthDivider } from '@/components/ui/oauth-buttons';
import { loginAction } from './actions';
import type { ActionResult } from './constants';

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null,
  );

  return (
    <div>
      <OAuthButtons mode="login" />
      <AuthDivider />

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

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="overline">Passwort</span>
            <Link href="/auth/reset" className="text-caption text-quiet editorial hover:text-navy">
              vergessen?
            </Link>
          </div>
          <PasswordField
            id="password"
            name="password"
            label=""
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>

        {state && !state.ok && (
          <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? 'Wird angemeldet…' : (
            <>
              Anmelden <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
