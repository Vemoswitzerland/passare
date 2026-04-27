import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlogEditor } from '@/components/admin/BlogEditor';
import type { BlogKategorie } from '@/data/blog-topics';

export const metadata = {
  title: 'Admin · Blog-Beitrag — passare',
  robots: { index: false, follow: false },
};

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <BlogEditor
      mode="edit"
      initial={{
        id: post.id as string,
        titel: post.titel ?? '',
        slug: post.slug ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        kategorie: (post.kategorie as BlogKategorie) ?? 'allgemein',
        autor: post.autor ?? 'passare Redaktion',
        featured_image_url: post.featured_image_url ?? '',
        status: (post.status as 'entwurf' | 'veroeffentlicht') ?? 'entwurf',
        ai_generated: !!post.ai_generated,
        ai_topic: post.ai_topic ?? undefined,
        reading_minutes: post.reading_minutes ?? undefined,
        created_at: post.created_at as string,
        updated_at: post.updated_at as string,
        published_at: (post.published_at as string | null) ?? null,
      }}
    />
  );
}
