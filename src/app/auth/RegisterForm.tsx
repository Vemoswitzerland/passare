'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { OAuthButtons, AuthDivider } from '@/components/ui/oauth-buttons';
import { registerAction } from './actions';
import type { ActionResult } from './constants';

export function RegisterForm() {
  const params = useSearchParams();
  const intendedRole = params.get('role'); // 'kaeufer' | 'verkaeufer' | null
  const next = params.get('next') ?? '';
  const fromPreReg = params.get('from') === 'pre-reg';

  // Wenn aus Pre-Reg-Funnel: lade Draft für Anzeige
  const [preRegInfo, setPreRegInfo] = useState<{
    firma_name?: string | null;
    valuation_mid?: number | null;
  } | null>(null);

  useEffect(() => {
    if (!fromPreReg) return;
    fetch('/api/pre-reg').then(r => r.json()).then(({ data }) => {
      if (data) {
        setPreRegInfo({
          firma_name: data.firma_name,
          valuation_mid: data.valuation?.mid,
        });
      }
    }).catch(() => {});
  }, [fromPreReg]);

  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    registerAction,
    null,
  );
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <div>
      {fromPreReg && preRegInfo?.firma_name && (
        <div className="mb-6 bg-bronze/5 border border-bronze/30 rounded-card p-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-soft bg-bronze/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-navy">
                <Building2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-bronze-ink" strokeWidth={1.5} />
                <span className="font-medium">{preRegInfo.firma_name}</span> ist vorgemerkt
              </p>
              {preRegInfo.valuation_mid && (
                <p className="text-caption text-quiet font-mono mt-1">
                  Indikative Bewertung: CHF {preRegInfo.valuation_mid.toLocaleString('de-CH').replace(/,/g, "'")}
                </p>
              )}
              <p className="text-caption text-bronze-ink mt-2">
                Nach Login geht es direkt zum Inserat — keine doppelte Eingabe.
              </p>
            </div>
          </div>
        </div>
      )}

      <OAuthButtons mode="register" />
      <AuthDivider />

      <form action={action} className="space-y-5">
        {/* Hidden: intended role + next-URL aus Query */}
        {intendedRole && <input type="hidden" name="intended_role" value={intendedRole} />}
        {next && <input type="hidden" name="next" value={next} />}
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
