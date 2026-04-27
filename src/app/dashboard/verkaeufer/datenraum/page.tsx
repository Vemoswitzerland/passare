import { FolderOpen, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { DatenraumClient } from './DatenraumClient';

export const metadata = { title: 'Datenraum — passare Verkäufer' };

export default async function DatenraumPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('datenraum_files'))) {
    return (
      <div className="px-6 py-16 text-center">
        <FolderOpen className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Datenraum wird eingerichtet</h2>
      </div>
    );
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, titel')
    .eq('owner_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) {
    return (
      <div className="px-6 py-16 text-center">
        <FolderOpen className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Noch kein Inserat</h2>
        <p className="text-body text-muted">Erstelle zuerst ein Inserat, dann kannst du den Datenraum füllen.</p>
      </div>
    );
  }

  const { data: files } = await supabase
    .from('datenraum_files')
    .select('*, profiles:uploaded_by(full_name)')
    .eq('inserat_id', inserat.id)
    .order('uploaded_at', { ascending: false });

  // Audit-Log: pro Datei letzte Zugriffe
  const fileIds = (files ?? []).map((f: any) => f.id);
  const accessLog = fileIds.length > 0
    ? await supabase
        .from('datenraum_access_log')
        .select('file_id, kaeufer_id, action, accessed_at')
        .in('file_id', fileIds)
        .order('accessed_at', { ascending: false })
    : { data: [] };

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Datenraum</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Datenraum
          </h1>
          <p className="text-body text-muted mt-2">
            Vertrauliche Dokumente für Käufer mit signierter NDA. {files?.length ?? 0} Datei{files?.length !== 1 ? 'en' : ''}.
          </p>
        </div>
        <DatenraumClient
          inseratId={inserat.id}
          files={(files ?? []) as any}
          accessLog={(accessLog.data ?? []) as any}
        />
      </div>
    </div>
  );
}
