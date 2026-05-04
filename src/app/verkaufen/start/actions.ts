'use server';

import type { ValuationResult } from '@/lib/valuation';
import { formatCHF } from '@/lib/valuation';
import { BRANCHEN_LIST } from '@/data/branchen-multiples';

function brancheLabelFromId(id: string | null | undefined): string | null {
  if (!id) return null;
  return BRANCHEN_LIST.find((b) => b.id === id)?.label ?? id;
}

type SendValuationInput = {
  email: string;
  firma_name: string | null;
  branche_id: string | null;
  kanton: string | null;
  jahr: number | null;
  mitarbeitende: number | null;
  umsatz: number | null;
  ebitda: number | null;
  valuation: ValuationResult;
};

export type SendValuationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Sendet die Smart-Bewertung als E-Mail an den User — KEIN Account nötig.
 * Wird vom /verkaufen/start-Funnel auf der Bewertungs-Seite ausgelöst.
 *
 * Fire-and-forget Verhalten ist hier NICHT erwünscht: User wartet auf
 * die Bestätigung, dass Mail rausgegangen ist.
 */
export async function sendValuationByEmailAction(
  input: SendValuationInput,
): Promise<SendValuationResult> {
  const { email, valuation } = input;

  // Plausibilitäts-Check
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
  }
  if (!valuation || typeof valuation.mid !== 'number') {
    return { ok: false, error: 'Bewertung fehlt — bitte zuerst durchrechnen.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddr = process.env.EMAIL_FROM || 'passare <noreply@passare.ch>';

  if (!apiKey) {
    console.warn('[send-valuation] RESEND_API_KEY fehlt — Mail kann nicht versendet werden');
    return { ok: false, error: 'E-Mail-Versand aktuell nicht verfügbar. Bitte später erneut probieren.' };
  }

  const subject = 'Deine Smart-Bewertung — passare';
  const html = renderValuationHtml(input);
  const text = renderValuationText(input);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [trimmed],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[send-valuation] Resend ${res.status}: ${body}`);
      return { ok: false, error: 'Versand fehlgeschlagen — bitte später erneut versuchen.' };
    }
  } catch (e) {
    console.warn('[send-valuation] Exception:', e);
    return { ok: false, error: 'Versand fehlgeschlagen — bitte später erneut versuchen.' };
  }

  return { ok: true };
}

function renderValuationText(i: SendValuationInput): string {
  const { firma_name, valuation } = i;
  const lines: string[] = [];
  lines.push(`Deine Smart-Bewertung für ${firma_name ?? 'dein Unternehmen'}`);
  lines.push('');
  lines.push(`Indikativer Marktwert: ${formatCHF(valuation.mid)}`);
  lines.push(`Range: ${formatCHF(valuation.low)} – ${formatCHF(valuation.high)}`);
  lines.push('');
  lines.push('Eckdaten:');
  const brancheLbl = brancheLabelFromId(i.branche_id);
  if (brancheLbl) lines.push(`  Branche: ${brancheLbl}`);
  if (i.kanton) lines.push(`  Kanton: ${i.kanton}`);
  if (i.jahr) lines.push(`  Gründungsjahr: ${i.jahr}`);
  if (i.mitarbeitende) lines.push(`  Mitarbeitende: ${i.mitarbeitende}`);
  if (i.umsatz) lines.push(`  Umsatz: ${formatCHF(i.umsatz)}`);
  if (i.ebitda != null) lines.push(`  EBITDA: ${formatCHF(i.ebitda)}`);
  lines.push('');
  lines.push('Diese Bewertung ist indikativ. Sie basiert auf Branchen-Multiples (DUB / NIMBO / con|cess M+A Q1 2026).');
  lines.push('');
  lines.push('Bereit zum Inserieren?');
  lines.push('  https://passare.ch/verkaufen/start');
  lines.push('');
  lines.push('— passare');
  return lines.join('\n');
}

function renderValuationHtml(i: SendValuationInput): string {
  const { firma_name, valuation } = i;
  const facts: Array<[string, string]> = [];
  const brancheLbl = brancheLabelFromId(i.branche_id);
  if (brancheLbl) facts.push(['Branche', brancheLbl]);
  if (i.kanton) facts.push(['Kanton', i.kanton]);
  if (i.jahr) facts.push(['Gründungsjahr', String(i.jahr)]);
  if (i.mitarbeitende) facts.push(['Mitarbeitende', String(i.mitarbeitende)]);
  if (i.umsatz) facts.push(['Umsatz', formatCHF(i.umsatz)]);
  if (i.ebitda != null) facts.push(['EBITDA', formatCHF(i.ebitda)]);

  const factsHtml = facts.map(([k, v]) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#5d6770;font-size:13px;">${escapeHtml(k)}</td>` +
    `<td style="padding:6px 0;font-family:'Geist Mono',ui-monospace,monospace;font-size:13px;color:#0a0f12;">${escapeHtml(v)}</td></tr>`,
  ).join('');

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#0a0f12;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="text-transform:uppercase;letter-spacing:1.5px;font-size:11px;color:#B8935A;margin:0 0 12px;">passare — smart-bewertung</p>
    <h1 style="font-family:'Times New Roman',Georgia,serif;font-weight:300;font-size:32px;line-height:1.15;color:#0B1F3A;margin:0 0 16px;">
      ${escapeHtml(firma_name ?? 'Deine Bewertung')}
    </h1>
    <p style="margin:0 0 28px;color:#5d6770;font-size:15px;line-height:1.6;">
      Hier ist die indikative Marktwert-Schätzung für dein Unternehmen — basierend auf 7 Faktoren und Schweizer Branchen-Multiples.
    </p>

    <div style="background:#fff;border:1px solid #E8E6E0;border-radius:6px;padding:24px;margin-bottom:24px;">
      <p style="text-transform:uppercase;letter-spacing:1.5px;font-size:11px;color:#5d6770;margin:0 0 6px;">Indikativer Marktwert</p>
      <p style="font-family:'Geist Mono',ui-monospace,monospace;font-size:32px;font-weight:500;color:#0B1F3A;margin:0 0 8px;">
        ${escapeHtml(formatCHF(valuation.mid))}
      </p>
      <p style="font-size:13px;color:#5d6770;margin:0;">
        Range: <strong>${escapeHtml(formatCHF(valuation.low))}</strong> – <strong>${escapeHtml(formatCHF(valuation.high))}</strong>
      </p>
    </div>

    ${factsHtml ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${factsHtml}</table>` : ''}

    <div style="border-top:1px solid #E8E6E0;padding-top:24px;margin-top:24px;">
      <p style="font-size:13px;color:#5d6770;line-height:1.6;margin:0 0 16px;">
        Diese Bewertung ist indikativ. Die finale Bewertung erfolgt im Käufer-Dialog basierend auf Due Diligence.
      </p>
      <a href="https://passare.ch/verkaufen/start" style="display:inline-block;background:#0B1F3A;color:#FAF8F3;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Jetzt anonym inserieren →
      </a>
    </div>

    <p style="margin:32px 0 0;font-size:11px;color:#9aa0a6;text-align:center;">
      passare — Made in Switzerland · 0% Erfolgsprovision · passare.ch
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
