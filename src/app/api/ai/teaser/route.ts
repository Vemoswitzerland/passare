/**
 * POST /api/ai/teaser
 *
 * Generiert anonymen Inserate-Teaser via Anthropic Claude.
 *
 * Body:
 * {
 *   branche?: string,
 *   kanton?: string,
 *   region?: string,
 *   mitarbeitende?: number,
 *   umsatz?: number,        // CHF
 *   ebitda?: number,        // CHF
 *   gruendungsjahr?: number,
 *   rechtsform?: string,
 *   sales_points?: string[],
 *   besonderheiten?: string,
 *   kunden?: string,
 *   zusatzinfo?: string,
 *   model?: 'haiku' | 'sonnet'  // optional, default haiku
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  HAIKU_MODEL,
  SONNET_MODEL,
  extractJson,
  getAnthropicClient,
  logAiGeneration,
} from '@/lib/ai/anthropic';
import { TEASER_SYSTEM_PROMPT, buildTeaserUserPrompt } from '@/lib/ai/prompts';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TeaserInput = z.object({
  branche: z.string().max(120).optional(),
  kanton: z.string().max(40).optional(),
  region: z.string().max(80).optional(),
  mitarbeitende: z.number().int().min(0).max(100000).optional(),
  umsatz: z.number().min(0).max(10_000_000_000).optional(),
  ebitda: z.number().min(-1_000_000_000).max(1_000_000_000).optional(),
  gruendungsjahr: z.number().int().min(1700).max(new Date().getFullYear()).optional(),
  rechtsform: z.string().max(40).optional(),
  sales_points: z.array(z.string().max(200)).max(10).optional(),
  besonderheiten: z.string().max(800).optional(),
  kunden: z.string().max(400).optional(),
  zusatzinfo: z.string().max(800).optional(),
  model: z.enum(['haiku', 'sonnet']).default('haiku'),
});

const TeaserOutput = z.object({
  titel: z.string().min(5).max(120),
  beschreibung_short: z.string().min(20).max(280),
  beschreibung_long: z.string().min(80).max(4000),
  suggested_price_range: z.object({
    min_chf: z.number().min(0),
    max_chf: z.number().min(0),
    begruendung: z.string().max(400),
  }),
  key_facts: z.array(z.string().max(120)).min(2).max(5),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate-Limit (AI ist teurer → schärferes Limit als Zefix)
  const rate = await checkRateLimit(ip, 'ai_teaser', 20);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Versuch es in einer Minute erneut.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body muss gültiges JSON sein.' }, { status: 400 });
  }

  const parsed = TeaserInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Optional: User-ID aus Supabase-Session ziehen
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data?.user?.id ?? null;
  } catch {
    // Anonyme Nutzung erlaubt (z.B. öffentlicher Bewertungs-Tool-Flow)
  }

  const model = input.model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;
  const client = getAnthropicClient();
  const userPrompt = buildTeaserUserPrompt(input);

  const startedAt = Date.now();
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: TEASER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Keine Text-Antwort von Claude erhalten.');
    }

    let output: z.infer<typeof TeaserOutput>;
    try {
      const json = extractJson(textBlock.text);
      output = TeaserOutput.parse(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Parse-Fehler';
      await logAiGeneration({
        userId,
        type: 'teaser',
        input,
        model,
        tokensIn: response.usage.input_tokens,
        tokensOut: response.usage.output_tokens,
        durationMs: Date.now() - startedAt,
        status: 'error',
        error: `Parse: ${message}`,
        ip,
      });
      return NextResponse.json(
        { error: 'Antwort konnte nicht geparst werden.', detail: message },
        { status: 502 },
      );
    }

    await logAiGeneration({
      userId,
      type: 'teaser',
      input,
      output,
      model,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      durationMs: Date.now() - startedAt,
      status: 'success',
      ip,
    });

    return NextResponse.json(
      {
        teaser: output,
        meta: {
          model,
          tokens: {
            in: response.usage.input_tokens,
            out: response.usage.output_tokens,
          },
          duration_ms: Date.now() - startedAt,
        },
      },
      { headers: { 'X-RateLimit-Remaining': String(rate.remaining) } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[ai/teaser]', message);
    await logAiGeneration({
      userId,
      type: 'teaser',
      input,
      model,
      durationMs: Date.now() - startedAt,
      status: 'error',
      error: message,
      ip,
    });
    return NextResponse.json(
      { error: 'AI-Service derzeit nicht erreichbar.', detail: message },
      { status: 502 },
    );
  }
}
