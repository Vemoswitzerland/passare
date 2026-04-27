/**
 * Anthropic-Client + Cost-Tracking.
 *
 * Default-Modell: claude-haiku-4-5-20251001 (schnell, kosteneffizient)
 * Premium: claude-sonnet-4-6 für komplexere Generierungen
 */
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
export const SONNET_MODEL = 'claude-sonnet-4-6';

// Pricing pro 1M Tokens (Stand 2026-04, in USD)
// USD → CHF Wechselkurs konservativ: 1 USD ≈ 0.90 CHF
const USD_TO_CHF = 0.9;
const PRICING: Record<string, { input: number; output: number }> = {
  [HAIKU_MODEL]: { input: 1.0, output: 5.0 },
  [SONNET_MODEL]: { input: 3.0, output: 15.0 },
};

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY fehlt in den Umgebungsvariablen.');
  return new Anthropic({ apiKey });
}

export function calculateCostChf(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING[model] ?? PRICING[HAIKU_MODEL];
  const usd = (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
  return Number((usd * USD_TO_CHF).toFixed(4));
}

export type AiLogParams = {
  userId?: string | null;
  type: 'teaser' | 'branche_suggest' | 'beschreibung_polish' | 'key_facts';
  input: unknown;
  output?: unknown;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  status?: 'success' | 'error' | 'rate_limited';
  error?: string;
  ip?: string;
};

export async function logAiGeneration(params: AiLogParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const tokensIn = params.tokensIn ?? 0;
    const tokensOut = params.tokensOut ?? 0;
    await supabase.from('ai_generations').insert({
      user_id: params.userId ?? null,
      type: params.type,
      input: params.input,
      output: params.output ?? null,
      model: params.model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      tokens_used: tokensIn + tokensOut,
      cost_chf: calculateCostChf(params.model, tokensIn, tokensOut),
      duration_ms: params.durationMs ?? null,
      status: params.status ?? 'success',
      error: params.error ?? null,
      ip: params.ip ?? null,
    });
  } catch (err) {
    // Logging darf den Request niemals brechen
    console.error('[ai-log] failed', err);
  }
}

/**
 * Robustes JSON-Parsing aus Claude-Antworten.
 * Claude gibt manchmal Markdown-Codeblöcke zurück — die werden gestrippt.
 */
export function extractJson<T = unknown>(text: string): T {
  let cleaned = text.trim();
  // ```json ... ```  oder  ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  // Erste { bis letzte }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned) as T;
}
