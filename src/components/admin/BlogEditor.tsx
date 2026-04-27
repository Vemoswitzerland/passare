'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  createBlogPostAction,
  updateBlogPostAction,
  publishBlogPostAction,
  deleteBlogPostAction,
} from '@/app/admin/blog/actions';
import { BLOG_KATEGORIEN, slugify, type BlogKategorie } from '@/data/blog-topics';
import { cn } from '@/lib/utils';

type Mode = 'create' | 'edit';

type Initial = {
  id?: string;
  titel: string;
  slug: string;
  excerpt: string;
  content: string;
  kategorie: BlogKategorie;
  autor: string;
  featured_image_url: string;
  status: 'entwurf' | 'veroeffentlicht';
  ai_generated?: boolean;
  ai_topic?: string;
  reading_minutes?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
};

export function BlogEditor({ mode, initial }: { mode: Mode; initial: Initial }) {
  const router = useRouter();

  const [titel, setTitel] = useState(initial.titel);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState(initial.content);
  const [kategorie, setKategorie] = useState<BlogKategorie>(initial.kategorie);
  const [autor, setAutor] = useState(initial.autor);
  const [featuredUrl, setFeaturedUrl] = useState(initial.featured_image_url);
  const [status, setStatus] = useState<'entwurf' | 'veroeffentlicht'>(initial.status);
  const [showPreview, setShowPreview] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTx] = useTransition();
  const [delPending, startDelTx] = useTransition();

  const handleTitelChange = (v: string) => {
    setTitel(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const save = (newStatus?: 'entwurf' | 'veroeffentlicht') => {
    setStatusMsg(null);
    const payload = {
      titel,
      slug,
      excerpt,
      content,
      kategorie,
      autor,
      featured_image_url: featuredUrl,
      status: newStatus ?? status,
    };
    startTx(async () => {
      try {
        if (mode === 'create') {
          const res = await createBlogPostAction(payload);
          if (res.ok && 'id' in res && res.id) {
            setStatusMsg({ kind: 'ok', text: 'Gespeichert.' });
            router.push(`/admin/blog/${res.id}`);
          } else {
            setStatusMsg({ kind: 'err', text: ('error' in res && res.error) || 'Speichern fehlgeschlagen.' });
          }
        } else if (initial.id) {
          const res = await updateBlogPostAction(initial.id, payload);
          if (res.ok) {
            setStatus(payload.status);
            setStatusMsg({ kind: 'ok', text: 'Gespeichert.' });
          } else {
            setStatusMsg({ kind: 'err', text: ('error' in res && res.error) || 'Speichern fehlgeschlagen.' });
          }
        }
      } catch (e) {
        setStatusMsg({ kind: 'err', text: (e as Error).message });
      }
    });
  };

  const togglePublish = () => {
    if (!initial.id) return;
    setStatusMsg(null);
    const newStatus = status === 'veroeffentlicht' ? 'entwurf' : 'veroeffentlicht';
    startTx(async () => {
      const res = await publishBlogPostAction(initial.id!, newStatus === 'veroeffentlicht');
      if (res.ok) {
        setStatus(newStatus);
        setStatusMsg({
          kind: 'ok',
          text: newStatus === 'veroeffentlicht' ? 'Artikel veröffentlicht.' : 'Zurück auf Entwurf.',
        });
      } else {
        setStatusMsg({ kind: 'err', text: res.error ?? 'Status-Wechsel fehlgeschlagen.' });
      }
    });
  };

  const remove = () => {
    if (!initial.id) return;
    if (!confirm('Diesen Artikel wirklich löschen? Kann nicht rückgängig gemacht werden.')) return;
    startDelTx(async () => {
      const res = await deleteBlogPostAction(initial.id!);
      if (res.ok) {
        router.push('/admin/blog');
      } else {
        setStatusMsg({ kind: 'err', text: res.error ?? 'Löschen fehlgeschlagen.' });
      }
    });
  };

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Zurück zur Blog-Liste
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="overline text-bronze mb-2">
            {mode === 'create' ? 'Neuer Beitrag' : 'Beitrag bearbeiten'}
          </p>
          <h1 className="font-serif text-3xl text-navy leading-tight">
            {titel || 'Ohne Titel'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {status === 'veroeffentlicht' ? (
              <Badge variant="success">● Veröffentlicht</Badge>
            ) : (
              <Badge variant="neutral">● Entwurf</Badge>
            )}
            {initial.ai_generated && (
              <Badge variant="bronze">
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                KI-generiert
              </Badge>
            )}
            {initial.reading_minutes && (
              <span className="text-caption text-quiet font-mono">
                ≈ {initial.reading_minutes} Min Lesezeit
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'edit' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              {showPreview ? 'Editor' : 'Vorschau'}
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              size="sm"
              variant={status === 'veroeffentlicht' ? 'secondary' : 'bronze'}
              onClick={togglePublish}
              disabled={pending}
            >
              {status === 'veroeffentlicht' ? 'Auf Entwurf zurück' : 'Veröffentlichen'}
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={() => save()} disabled={pending}>
            <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
            {pending ? 'Speichere …' : 'Speichern'}
          </Button>
        </div>
      </header>

      {statusMsg && (
        <div
          className={cn(
            'mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-soft text-caption border',
            statusMsg.kind === 'ok'
              ? 'text-success bg-success/10 border-success/30'
              : 'text-danger bg-danger/10 border-danger/30',
          )}
        >
          {statusMsg.kind === 'ok' ? (
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          {statusMsg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {showPreview ? (
            <article className="bg-paper border border-stone rounded-card p-8 prose-passare max-w-none">
              <h1 className="font-serif text-3xl text-navy mb-2">{titel || 'Ohne Titel'}</h1>
              {excerpt && <p className="text-body text-muted leading-relaxed mb-6">{excerpt}</p>}
              <div className="prose-blog">
                <MarkdownPreview source={content} />
              </div>
            </article>
          ) : (
            <>
              <Section title="Beitrags-Details">
                <Field label="Titel *">
                  <input
                    type="text"
                    value={titel}
                    onChange={(e) => handleTitelChange(e.target.value)}
                    placeholder="z. B. Asset Deal vs. Share Deal"
                    className="input-passare"
                  />
                </Field>

                <Field label="Slug *" hint="URL-freundlicher Name. Nur Kleinbuchstaben, Zahlen, Bindestrich.">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="asset-deal-vs-share-deal"
                    className="input-passare font-mono text-caption"
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Kategorie *">
                    <select
                      value={kategorie}
                      onChange={(e) => setKategorie(e.target.value as BlogKategorie)}
                      className="input-passare"
                    >
                      {BLOG_KATEGORIEN.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Autor">
                    <input
                      type="text"
                      value={autor}
                      onChange={(e) => setAutor(e.target.value)}
                      className="input-passare"
                    />
                  </Field>
                </div>

                <Field label="Kurzbeschreibung (Excerpt)" hint="1-2 Sätze als SEO-Description und Vorschau.">
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    placeholder="Kurze Zusammenfassung des Artikels …"
                    className="input-passare resize-y"
                  />
                </Field>
              </Section>

              <Section title="Inhalt" hint="Markdown-Format. ## für Abschnitte, **fett**, - für Listen, [Link](url).">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={28}
                  placeholder="Lead-Absatz hier …\n\n## Erster Abschnitt\n\nText …\n\n## Zweiter Abschnitt\n\n- Listen-Punkt\n- noch einer"
                  className="input-passare font-mono text-caption resize-y"
                />
                <p className="text-caption text-quiet mt-2">
                  {content.trim().split(/\s+/).filter(Boolean).length} Wörter
                </p>
              </Section>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <Section title="Status">
            <div className="space-y-3 text-caption">
              <div className="flex items-center justify-between">
                <span className="text-quiet">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'entwurf' | 'veroeffentlicht')}
                  className="input-passare-sm"
                >
                  <option value="entwurf">Entwurf</option>
                  <option value="veroeffentlicht">Veröffentlicht</option>
                </select>
              </div>
              {initial.created_at && (
                <Row label="Erstellt" value={formatDate(initial.created_at)} />
              )}
              {initial.updated_at && (
                <Row label="Geändert" value={formatDate(initial.updated_at)} />
              )}
              {initial.published_at && (
                <Row label="Veröffentlicht" value={formatDate(initial.published_at)} />
              )}
            </div>
          </Section>

          <Section title="Bild (URL)">
            <input
              type="url"
              value={featuredUrl}
              onChange={(e) => setFeaturedUrl(e.target.value)}
              placeholder="https://…"
              className="input-passare-sm"
            />
            {featuredUrl && (
              <div className="mt-3 aspect-video bg-cream border border-stone rounded-soft overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-caption text-quiet mt-2">
              Optional. Verwendung im Vorschau-Layout des Ratgebers.
            </p>
          </Section>

          {initial.ai_generated && initial.ai_topic && (
            <Section title="KI-Generator">
              <p className="text-caption text-ink mb-2">
                <Sparkles className="inline w-3 h-3 text-bronze mr-1" strokeWidth={2} />
                Generiert von Claude.
              </p>
              <p className="text-caption text-quiet italic">
                Thema: «{initial.ai_topic}»
              </p>
            </Section>
          )}

          {mode === 'edit' && (
            <Section title="Gefahrenzone">
              <button
                type="button"
                onClick={remove}
                disabled={delPending}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-soft border border-danger/30 bg-danger/5 text-danger text-caption hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                {delPending ? 'Löscht …' : 'Beitrag löschen'}
              </button>
            </Section>
          )}
        </aside>
      </div>

      <style jsx global>{`
        .input-passare {
          width: 100%;
          padding: 0.6rem 0.75rem;
          background: #fefdfa;
          border: 1px solid #e8e6e0;
          border-radius: 6px;
          font-size: 0.9375rem;
          color: #0a0f12;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-passare:focus {
          border-color: #b8935a;
        }
        .input-passare-sm {
          width: 100%;
          padding: 0.4rem 0.55rem;
          background: #fefdfa;
          border: 1px solid #e8e6e0;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: #0a0f12;
          outline: none;
        }
        .input-passare-sm:focus {
          border-color: #b8935a;
        }
        .prose-blog h2 {
          font-family: var(--font-serif), serif;
          color: #0b1f3a;
          font-size: 1.5rem;
          margin: 2rem 0 0.75rem;
        }
        .prose-blog h3 {
          font-family: var(--font-serif), serif;
          color: #0b1f3a;
          font-size: 1.15rem;
          margin: 1.5rem 0 0.5rem;
        }
        .prose-blog p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }
        .prose-blog ul {
          padding-left: 1.25rem;
          margin: 0.75rem 0;
          list-style: disc;
        }
        .prose-blog ol {
          padding-left: 1.25rem;
          margin: 0.75rem 0;
          list-style: decimal;
        }
        .prose-blog li {
          margin: 0.25rem 0;
        }
        .prose-blog strong {
          color: #0a0f12;
        }
        .prose-blog a {
          color: #b8935a;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper border border-stone rounded-card p-5">
      <h3 className="font-serif text-lg text-navy mb-1">{title}</h3>
      {hint && <p className="text-caption text-quiet mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="overline text-quiet block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-caption text-quiet mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-quiet">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Sehr leichter Markdown-Renderer für die Vorschau.
 * Reicht für H2/H3/Bold/Italic/Link/Listen/Paragraph.
 * Für Production-Rendering im Public-Bereich kommt später ein vollwertiger
 * Renderer (z. B. via marked oder remark).
 */
function MarkdownPreview({ source }: { source: string }) {
  const html = renderMarkdownToHtml(source);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let buffer: string[] = [];

  const flushPara = () => {
    if (buffer.length) {
      out.push(`<p>${inline(buffer.join(' ').trim())}</p>`);
      buffer = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };

  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      flushPara();
      closeList();
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    const ol = line.match(/^\s*\d+\.\s+(.+)$/);

    if (h2) {
      flushPara();
      closeList();
      out.push(`<h2>${inline(h2[1])}</h2>`);
    } else if (h3) {
      flushPara();
      closeList();
      out.push(`<h3>${inline(h3[1])}</h3>`);
    } else if (ul) {
      flushPara();
      if (inList !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = 'ul';
      }
      out.push(`<li>${inline(ul[1])}</li>`);
    } else if (ol) {
      flushPara();
      if (inList !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = 'ol';
      }
      out.push(`<li>${inline(ol[1])}</li>`);
    } else {
      buffer.push(line);
    }
  }
  flushPara();
  closeList();
  return out.join('\n');
}

function inline(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
