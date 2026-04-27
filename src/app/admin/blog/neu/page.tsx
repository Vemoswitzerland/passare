import { BlogEditor } from '@/components/admin/BlogEditor';

export const metadata = {
  title: 'Admin · Neuer Beitrag — passare',
  robots: { index: false, follow: false },
};

export default function AdminBlogNeuPage() {
  return (
    <BlogEditor
      mode="create"
      initial={{
        titel: '',
        slug: '',
        excerpt: '',
        content: '',
        kategorie: 'allgemein',
        autor: 'passare Redaktion',
        featured_image_url: '',
        status: 'entwurf',
      }}
    />
  );
}
