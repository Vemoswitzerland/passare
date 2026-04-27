/**
 * POST /api/ai/branche-suggest
 *
 * Schlägt eine Branche aus dem passare-Katalog basierend auf
 * Firmenbeschreibung (oder Handelsregister-Zweck) vor.
 *
 * Body:
 * {
 *   beschreibung: string,
 *   firmenname?: string,
 *   zweck?: string
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  HAIKU_MODEL,
  extractJson,
  getAnthropicClient,
  logAiGeneration,
} from '@/lib/ai/anthropic';
import { BRANCHE_SUGGEST_SYSTEM_PROMPT, buildBrancheUserPrompt } from '@/lib/ai/prompts';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const BrancheInput = z.object({
  beschreibung: z.string().min(10).max(2000),
  firmenname: z.string().max(200).optional(),
  zweck: z.string().max(2000).optional(),
});

const BrancheOutput = z.object({
  primary: z.string().min(2).max(80),
  secondary: z.array(z.string().min(2).max(80)).max(3).default([]),
  noga_code: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  begruendung: z.string().max(400),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = await checkRateLimit(ip, 'ai_branche', 30);
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

  const parsed = BrancheInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data?.user?.id ?? null;
  } catch {
    // Anonym ok
  }

  const client = getAnthropicClient();
  const userPrompt = buildBrancheUserPrompt(input.beschreibung, {
    name: input.firmenname,
    zweck: input.zweck,
  });

  const startedAt = Date.now();
  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      system: BRANCHE_SUGGEST_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Keine Text-Antwort von Claude erhalten.');
    }

    let output: z.infer<typeof BrancheOutput>;
    try {
      const json = extractJson(textBlock.text);
      output = BrancheOutput.parse(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Parse-Fehler';
      await logAiGeneration({
        userId,
        type: 'branche_suggest',
        input,
        model: HAIKU_MODEL,
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
      type: 'branche_suggest',
      input,
      output,
      model: HAIKU_MODEL,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      durationMs: Date.now() - startedAt,
      status: 'success',
      ip,
    });

    return NextResponse.json(
      {
        suggestion: output,
        meta: {
          model: HAIKU_MODEL,
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
    console.error('[ai/branche-suggest]', message);
    await logAiGeneration({
      userId,
      type: 'branche_suggest',
      input,
      model: HAIKU_MODEL,
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
