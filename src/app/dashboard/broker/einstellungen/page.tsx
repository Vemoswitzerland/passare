'use client';

import { useState, useTransition, useEffect } from 'react';
import { Building2, Globe, Phone, Save, Check } from 'lucide-react';
import { updateBrokerProfileAction } from './actions';

export default function BrokerEinstellungenPage() {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    agentur_name: '',
    slug: '',
    bio: '',
    website: '',
    telefon: '',
  });

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
        }
      })
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateBrokerProfileAction(form);
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

          <button
            type="submit"
            disabled={pending}
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
                {pending ? 'Speichern…' : 'Speichern'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
