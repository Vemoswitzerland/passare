'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { BLOG_KATEGORIEN, slugify, estimateReadingMinutes } from '@/data/blog-topics';

async function assertAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Nicht angemeldet.');
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.rolle !== 'admin') throw new Error('Keine Admin-Berechtigung.');
  return data.user.id;
}

const KATEGORIE_VALUES = BLOG_KATEGORIEN.map((k) => k.value) as [string, ...string[]];

const PostSchema = z.object({
  titel: z.string().min(3, 'Titel zu kurz').max(200),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, 'Nur a-z, 0-9, Bindestrich'),
  excerpt: z.string().max(400).optional(),
  content: z.string().min(20, 'Inhalt zu kurz'),
  kategorie: z.enum(KATEGORIE_VALUES),
  autor: z.string().max(80).default('passare Redaktion'),
  featured_image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['entwurf', 'veroeffentlicht']).default('entwurf'),
});

export async function createBlogPostAction(input: unknown) {
  const userId = await assertAdmin();
  const parsed = PostSchema.parse(input);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('blog_posts')
    .insert({
      titel: parsed.titel,
      slug: parsed.slug,
      excerpt: parsed.excerpt || null,
      content: parsed.content,
      kategorie: parsed.kategorie,
      autor: parsed.autor,
      featured_image_url: parsed.featured_image_url || null,
      status: parsed.status,
      author_id: userId,
      ai_generated: false,
      reading_minutes: estimateReadingMinutes(parsed.content),
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/ratgeber');
  return { ok: true, id: data.id as string };
}

export async function updateBlogPostAction(id: string, input: unknown) {
  await assertAdmin();
  const parsed = PostSchema.parse(input);
  const admin = createAdminClient();

  const { error } = await admin
    .from('blog_posts')
    .update({
      titel: parsed.titel,
      slug: parsed.slug,
      excerpt: parsed.excerpt || null,
      content: parsed.content,
      kategorie: parsed.kategorie,
      autor: parsed.autor,
      featured_image_url: parsed.featured_image_url || null,
      status: parsed.status,
      reading_minutes: estimateReadingMinutes(parsed.content),
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath('/ratgeber');
  return { ok: true };
}

export async function publishBlogPostAction(id: string, publish: boolean) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('blog_posts')
    .update({ status: publish ? 'veroeffentlicht' : 'entwurf' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath('/ratgeber');
  return { ok: true };
}

export async function deleteBlogPostAction(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('blog_posts').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/ratgeber');
  return { ok: true };
}

/**
 * Generiert einen neuen Blog-Artikel via Anthropic Claude und legt ihn als
 * Entwurf an. Direkt-Redirect zum Editor, damit der Admin sofort prüfen
 * und veröffentlichen kann.
 */
export async function generateBlogPostAction(formData: FormData) {
  const userId = await assertAdmin();
  const customTopic = (formData.get('topic') as string | null)?.trim() || undefined;
  const kategorieInput = (formData.get('kategorie') as string | null) || undefined;

  // Server-Side Fetch zum eigenen Endpoint (relativ via Headers)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare.ch'}/api/admin/blog/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-user': userId },
      body: JSON.stringify({ topic: customTopic, kategorie: kategorieInput }),
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`KI-Generator fehlgeschlagen: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as { id: string };
  revalidatePath('/admin/blog');
  redirect(`/admin/blog/${json.id}`);
}

export async function duplicateBlogPostAction(id: string) {
  const userId = await assertAdmin();
  const admin = createAdminClient();
  const { data: src } = await admin.from('blog_posts').select('*').eq('id', id).single();
  if (!src) return { ok: false, error: 'Original nicht gefunden.' };

  const newSlug = `${src.slug}-kopie-${Date.now().toString(36)}`;
  const newTitel = `${src.titel} (Kopie)`;

  const { data, error } = await admin
    .from('blog_posts')
    .insert({
      titel: newTitel,
      slug: newSlug,
      excerpt: src.excerpt,
      content: src.content,
      kategorie: src.kategorie,
      autor: src.autor,
      featured_image_url: src.featured_image_url,
      status: 'entwurf',
      author_id: userId,
      ai_generated: src.ai_generated,
      ai_topic: src.ai_topic,
      reading_minutes: src.reading_minutes,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  return { ok: true, id: data.id as string };
}
