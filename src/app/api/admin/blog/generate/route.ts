import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  pickRandomTopic,
  slugify,
  estimateReadingMinutes,
  BLOG_KATEGORIEN,
  type BlogKategorie,
} from '@/data/blog-topics';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Du bist Chefredaktor:in beim KMU-Nachfolge-Marktplatz passare.ch — die Self-Service-Plattform für den Verkauf und Kauf Schweizer KMU.

Schreibe einen redaktionellen Blog-Artikel speziell für unser Publikum: Schweizer Verkäufer:innen (Inhaber:in eines KMU, vor der Nachfolge), Käufer:innen (Investor:innen, MBO-Kandidat:innen, Search-Funder:innen) und Berater:innen (Treuhand, Anwalt:in, M&A-Boutique).

ZWINGEND:
- Hochdeutsch, aber mit Schweizer Bezug (Kanton, CHF, Schweizer Recht/Steuern, Handelsregister, etc.)
- Praktisch, konkret, nicht akademisch. Beispiele aus der Schweizer KMU-Realität.
- Keine Werbung für andere Plattformen, keine Empfehlung von Brokern.
- passare positioniert sich als Self-Service-Plattform mit transparenten Pauschalpreisen — wenn der Artikel das natürlich erwähnen kann (nicht aufdrängen).
- Markdown-Format. Verwende ## für Hauptabschnitte, ### für Unterabschnitte, **fett** für Schlüsselbegriffe, - für Listen.
- Schreibe 800–1200 Wörter — keine Pseudo-Füllung.
- Zahlen/Prozente: Schweizer Format (CHF 1'250'000, 12,5 %).

NIEMALS:
- "Liebe Leser" oder ähnliche Floskeln
- Generische Listicles ("Die 10 besten Tipps")
- Erfundene Statistiken (lieber qualitativ formulieren)
- Disclaimers am Ende

Antworte AUSSCHLIESSLICH als JSON mit den Feldern:
{
  "titel": "Klare, konkrete Überschrift, max 90 Zeichen",
  "excerpt": "1–2 Sätze Teaser, max 300 Zeichen, ohne 'In diesem Artikel'",
  "content": "Markdown-Body. KEIN H1 (Titel kommt extern). Beginne mit einem Lead-Absatz, dann ## Abschnitte."
}`;

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', data.user.id)
    .maybeSingle();
  return profile?.rolle === 'admin' ? data.user.id : null;
}

// Simples In-Memory-Rate-Limit pro Admin-User (max 5 Generierungen / Min).
// Für Production sollte das durch Redis / Upstash ersetzt werden, hier reicht
// ein Map als Schutz vor versehentlichen Floods aus dem Admin-UI.
const blogGenLog = new Map<string, number[]>();
const BLOG_GEN_WINDOW_MS = 60_000;
const BLOG_GEN_MAX = 5;

function checkBlogRateLimit(userId: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const arr = blogGenLog.get(userId) ?? [];
  const recent = arr.filter((t) => now - t < BLOG_GEN_WINDOW_MS);
  if (recent.length >= BLOG_GEN_MAX) {
    const oldest = recent[0];
    return { allowed: false, retryAfterSec: Math.ceil((BLOG_GEN_WINDOW_MS - (now - oldest)) / 1000) };
  }
  recent.push(now);
  blogGenLog.set(userId, recent);
  return { allowed: true };
}

/**
 * Topic-Sanitization — entfernt unsichere Zeichen und limitiert Länge.
 * Erlaubt: alphanumerisch, Umlaute, Leerzeichen, einfache Punktuation.
 */
function sanitizeTopic(input: unknown): string {
  return String(input ?? '')
    .replace(/[^a-zA-Z0-9 äöüÄÖÜß\.\-,!?]/g, '')
    .slice(0, 200)
    .trim();
}

export async function POST(req: Request) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate-Limit
  const rl = checkBlogRateLimit(adminUserId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate-Limit: max ${BLOG_GEN_MAX} Blog-Generierungen pro Minute. Versuch's in ${rl.retryAfterSec}s nochmal.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY fehlt in den Vercel-ENV-Variablen.' },
      { status: 503 },
    );
  }

  let body: { topic?: string; kategorie?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* leerer body OK */
  }

  // Topic sanitizen — nur alphanumerisch + Schweizer Umlaute + Punktuation
  let topic = sanitizeTopic(body.topic);
  let kategorie = (body.kategorie as BlogKategorie | undefined) ?? undefined;

  if (!topic) {
    const random = pickRandomTopic();
    topic = random.topic;
    kategorie = kategorie ?? random.kategorie;
  }
  if (!kategorie || !BLOG_KATEGORIEN.find((k) => k.value === kategorie)) {
    kategorie = 'allgemein';
  }

  const anthropic = new Anthropic({ apiKey });

  let titel: string;
  let excerpt: string;
  let content: string;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Schreibe einen Blog-Artikel zum Thema: "${topic}". Kategorie: ${kategorie}. Antworte als JSON wie spezifiziert.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Keine Text-Antwort von KI.' }, { status: 502 });
    }

    // Robustes JSON-Parsing — manchmal wickelt das Modell die JSON in Markdown-Codeblöcke
    let raw = textBlock.text.trim();
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1].trim();

    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(raw) as { titel: string; excerpt: string; content: string };
    titel = parsed.titel?.toString().slice(0, 200) ?? topic;
    excerpt = parsed.excerpt?.toString().slice(0, 400) ?? '';
    content = parsed.content?.toString() ?? '';

    if (!content || content.length < 100) {
      return NextResponse.json({ error: 'KI-Antwort zu kurz.' }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: `KI-Fehler: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  // Slug eindeutig machen
  const admin = createAdminClient();
  let slug = slugify(titel);
  if (!slug) slug = `artikel-${Date.now().toString(36)}`;

  const { data: collision } = await admin
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (collision) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const { data: inserted, error } = await admin
    .from('blog_posts')
    .insert({
      titel,
      slug,
      excerpt,
      content,
      kategorie,
      autor: 'passare Redaktion',
      status: 'entwurf',
      ai_generated: true,
      ai_topic: topic,
      reading_minutes: estimateReadingMinutes(content),
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'DB-Insert fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id, slug, titel, kategorie }, { status: 201 });
}
