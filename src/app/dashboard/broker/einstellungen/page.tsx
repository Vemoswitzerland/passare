'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Building2, Globe, Phone, Save, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { updateBrokerProfileAction, updateBrokerLogoAction } from './actions';

export default function BrokerEinstellungenPage() {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    agentur_name: '',
    slug: '',
    bio: '',
    website: '',
    telefon: '',
  });

  // Logo-Upload-State, getrennt vom Profil-Form (eigener Server-Action-Pfad)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPending, startLogoTransition] = useTransition();
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSaved, setLogoSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/broker/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            agentur_name: data.profile.agentur_name ?? '',
            slug: data.profile.slug ?? '',
            bio: data.profile.bio ?? '',
            website: data.profile.website ?? '',
            telefon: data.profile.telefon ?? '',
          });
          setLogoUrl(data.profile.logo_url ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoSaved(false);
    const fd = new FormData();
    fd.set('logo', file);
    startLogoTransition(async () => {
      const result = await updateBrokerLogoAction(fd);
      if (result?.error) {
        setLogoError(result.error);
        return;
      }
      if (result?.url) setLogoUrl(result.url);
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
      // Input zurücksetzen damit das gleiche File nochmal hochgeladen werden kann
      if (logoInputRef.current) logoInputRef.current.value = '';
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateBrokerProfileAction(form);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Einstellungen</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Broker-Profil
          </h1>
          <p className="text-body text-muted mt-2">
            Dein öffentliches Profil erscheint auf /broker/{form.slug || 'dein-slug'}
          </p>
        </div>

        {/* Logo-Upload — getrennt vom Profil-Form, eigener Action-Pfad
            (`updateBrokerLogoAction`). Schreibt in Bucket `broker-logos`
            und in `broker_profiles.logo_url`. Erscheint im Verzeichnis. */}
        <section className="rounded-card bg-paper border border-stone p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-head-sm text-navy">Logo fürs Broker-Verzeichnis</h2>
          </div>
          <p className="text-caption text-muted mb-4 leading-relaxed">
            PNG, JPG, WebP oder SVG · max. 2 MB. Wird im öffentlichen Verzeichnis
            und auf deinem Profil unter <span className="font-mono">passare.ch/broker/{form.slug || 'dein-slug'}</span> angezeigt.
          </p>

          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-card border border-stone bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="Aktuelles Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-stone" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                {logoPending ? 'Lade hoch…' : logoUrl ? 'Logo ersetzen' : 'Logo hochladen'}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  disabled={logoPending}
                  className="hidden"
                />
              </label>
              {logoSaved && (
                <p className="mt-2 text-caption text-success inline-flex items-center gap-1">
                  <Check className="w-3 h-3" strokeWidth={2} /> Logo aktualisiert
                </p>
              )}
              {logoError && <p className="mt-2 text-caption text-danger">{logoError}</p>}
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-card bg-paper border border-stone p-6 space-y-5">
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
                Agentur-Name
              </label>
              <input
                type="text"
                value={form.agentur_name}
                onChange={(e) => setForm({ ...form, agentur_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>

            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">
                Profil-URL (Slug)
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2.5 bg-stone/30 border border-r-0 border-stone rounded-l-soft text-caption text-quiet">
                  passare.ch/broker/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="flex-1 px-3.5 py-2.5 bg-cream border border-stone rounded-r-soft text-body-sm text-navy font-mono focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                maxLength={1000}
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors resize-none"
                placeholder="Beschreibe deine Agentur und Expertise…"
              />
              <p className="text-[11px] text-quiet mt-1">{form.bio.length} / 1000</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-caption text-navy font-medium block mb-1.5">
                  <Globe className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
                />
              </div>
              <div>
                <label className="text-caption text-navy font-medium block mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  placeholder="+41 ..."
                  className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-soft bg-danger/10 border border-danger/30 px-4 py-2.5">
              <p className="text-caption text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2} />
                Gespeichert
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={1.5} />
                {pending ? 'Speichern…' : loading ? 'Lade…' : 'Speichern'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
