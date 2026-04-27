'use client';

import { useState, useTransition, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, FileImage, File as FileIcon, Trash2, Eye, Download, Loader2, Folder, History } from 'lucide-react';
import { deleteDatenraumFile } from './actions';
import { cn } from '@/lib/utils';

const ORDNER = [
  { id: 'finanzen', label: 'Finanzen' },
  { id: 'rechtliches', label: 'Rechtliches' },
  { id: 'hr', label: 'HR' },
  { id: 'operations', label: 'Operations' },
  { id: 'sonstiges', label: 'Sonstiges' },
] as const;

type DatenraumFile = {
  id: string;
  ordner: string;
  storage_path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  uploaded_at: string;
  parent_file_id: string | null;
  profiles?: { full_name: string | null } | null;
};

type AccessLog = {
  file_id: string;
  kaeufer_id: string;
  action: 'view' | 'download';
  accessed_at: string;
};

type Props = {
  inseratId: string;
  files: DatenraumFile[];
  accessLog: AccessLog[];
};

export function DatenraumClient({ inseratId, files, accessLog }: Props) {
  const [tab, setTab] = useState<typeof ORDNER[number]['id'] | 'audit'>('finanzen');
  const [uploading, setUploading] = useState(false);
  const [uploadOrdner, setUploadOrdner] = useState<string>('finanzen');
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('inserat_id', inseratId);
    fd.append('ordner', uploadOrdner);
    try {
      const res = await fetch('/api/inserate/upload-datenraum', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Upload fehlgeschlagen');
        return;
      }
      // Hard-refresh damit serverseite Files aktualisiert
      window.location.reload();
    } catch {
      setError('Verbindungs-Fehler');
    } finally {
      setUploading(false);
    }
  }

  function onFiles(fl: FileList | null) {
    if (!fl) return;
    Array.from(fl).forEach(uploadFile);
  }

  // Counts pro Ordner
  const ordnerCounts: Record<string, number> = {};
  for (const f of files) {
    ordnerCounts[f.ordner] = (ordnerCounts[f.ordner] ?? 0) + 1;
  }

  // Versionen-Map: parent_file_id → Liste von Versionen
  const filesByName: Record<string, DatenraumFile[]> = {};
  for (const f of files) {
    const key = `${f.ordner}/${f.name}`;
    if (!filesByName[key]) filesByName[key] = [];
    filesByName[key].push(f);
  }

  const filteredFiles = tab === 'audit' ? [] : (files ?? []).filter(f => f.ordner === tab);

  return (
    <div className="space-y-6">
      {/* Upload-Dropzone */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'rounded-card border-2 border-dashed p-8 text-center transition-all',
          uploading ? 'border-bronze bg-bronze/5' : 'border-stone hover:border-bronze/40 hover:bg-bronze/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
          onChange={(e) => onFiles(e.target.files)}
          className="sr-only"
          id="datenraum-upload"
          disabled={uploading}
        />
        <div className="flex flex-col items-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-bronze animate-spin mb-2" strokeWidth={1.5} />
          ) : (
            <Upload className="w-8 h-8 text-quiet mb-2" strokeWidth={1.5} />
          )}
          <p className="text-body text-navy font-medium mb-1">
            {uploading ? 'Wird hochgeladen …' : 'Dateien hier ablegen'}
          </p>
          <p className="text-caption text-quiet mb-3">
            PDF, XLSX, DOCX, JPG, PNG · max 25 MB pro Datei
          </p>
          <div className="flex items-center gap-2">
            <select
              value={uploadOrdner}
              onChange={(e) => setUploadOrdner(e.target.value)}
              className="px-3 py-1.5 bg-paper border border-stone rounded-soft text-caption text-navy"
              disabled={uploading}
            >
              {ORDNER.map((o) => (
                <option key={o.id} value={o.id}>Ordner: {o.label}</option>
              ))}
            </select>
            <label
              htmlFor="datenraum-upload"
              className={cn(
                'px-4 py-1.5 bg-navy text-cream rounded-soft text-caption font-medium cursor-pointer hover:bg-ink transition-colors',
                uploading && 'opacity-50 cursor-not-allowed',
              )}
            >
              Dateien wählen
            </label>
          </div>
          {error && <p className="text-caption text-danger mt-3">{error}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone">
        {ORDNER.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setTab(o.id)}
            className={cn(
              'px-4 py-2 text-body-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              tab === o.id
                ? 'border-bronze text-navy'
                : 'border-transparent text-muted hover:text-navy',
            )}
          >
            <Folder className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
            {o.label}
            {ordnerCounts[o.id] && (
              <span className="ml-1.5 text-caption font-mono text-quiet">{ordnerCounts[o.id]}</span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={cn(
            'px-4 py-2 text-body-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
            tab === 'audit'
              ? 'border-bronze text-navy'
              : 'border-transparent text-muted hover:text-navy',
          )}
        >
          <Eye className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
          Audit
          {accessLog.length > 0 && (
            <span className="ml-1.5 text-caption font-mono text-quiet">{accessLog.length}</span>
          )}
        </button>
      </div>

      {tab === 'audit' ? (
        <AuditView log={accessLog} files={files} />
      ) : (
        <FileList files={filteredFiles} accessLog={accessLog} onDelete={(id) => {
          startTransition(async () => {
            await deleteDatenraumFile(id);
            window.location.reload();
          });
        }} />
      )}
    </div>
  );
}

function FileList({
  files, accessLog, onDelete,
}: {
  files: DatenraumFile[];
  accessLog: AccessLog[];
  onDelete: (id: string) => void;
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-card bg-paper border border-stone p-12 text-center">
        <FileText className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
        <p className="text-body text-muted">Noch keine Dateien in diesem Ordner.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {files.map((f) => {
        const accesses = accessLog.filter(a => a.file_id === f.id);
        return (
          <li key={f.id} className="rounded-soft bg-paper border border-stone p-4 flex items-center gap-4">
            <FileTypeIcon mime={f.mime_type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-body-sm text-navy font-medium truncate">{f.name}</p>
                {f.version > 1 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-pill bg-bronze-soft text-bronze-ink text-caption font-mono font-medium flex-shrink-0">
                    v{f.version}
                  </span>
                )}
              </div>
              <p className="text-caption text-quiet font-mono flex flex-wrap gap-x-3">
                <span>{formatBytes(f.size_bytes)}</span>
                <span>· {new Date(f.uploaded_at).toLocaleDateString('de-CH')}</span>
                {accesses.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-bronze-ink">
                    <Eye className="w-3 h-3" strokeWidth={1.5} /> {accesses.length} Zugriffe
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm(`«${f.name}» löschen?`)) onDelete(f.id);
              }}
              className="text-quiet hover:text-danger p-2 -mr-1 transition-colors"
              aria-label="Löschen"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AuditView({ log, files }: { log: AccessLog[]; files: DatenraumFile[] }) {
  const fileMap = Object.fromEntries(files.map((f) => [f.id, f]));
  if (log.length === 0) {
    return (
      <div className="rounded-card bg-paper border border-stone p-12 text-center">
        <History className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
        <p className="text-body text-muted">Noch keine Käufer-Zugriffe.</p>
      </div>
    );
  }
  return (
    <div className="rounded-card bg-paper border border-stone overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone/30 border-b border-stone">
          <tr>
            <th className="text-left text-caption text-quiet font-medium px-4 py-3 overline">Datei</th>
            <th className="text-left text-caption text-quiet font-medium px-4 py-3 overline">Käufer</th>
            <th className="text-left text-caption text-quiet font-medium px-4 py-3 overline">Aktion</th>
            <th className="text-left text-caption text-quiet font-medium px-4 py-3 overline">Zeitpunkt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone">
          {log.slice(0, 100).map((a, i) => (
            <tr key={i}>
              <td className="px-4 py-3 text-body-sm text-navy truncate max-w-[200px]">
                {fileMap[a.file_id]?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-caption text-muted font-mono">
                {a.kaeufer_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-caption">
                <span className={
                  a.action === 'download'
                    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-warn/15 text-warn font-medium'
                    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-navy-soft text-navy font-medium'
                }>
                  {a.action === 'download' ? <Download className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {a.action}
                </span>
              </td>
              <td className="px-4 py-3 text-caption text-quiet font-mono">
                {new Date(a.accessed_at).toLocaleString('de-CH')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.includes('pdf')) {
    return <FileText className="w-5 h-5 text-danger flex-shrink-0" strokeWidth={1.5} />;
  }
  if (mime.includes('sheet') || mime.includes('excel')) {
    return <FileSpreadsheet className="w-5 h-5 text-success flex-shrink-0" strokeWidth={1.5} />;
  }
  if (mime.startsWith('image/')) {
    return <FileImage className="w-5 h-5 text-bronze-ink flex-shrink-0" strokeWidth={1.5} />;
  }
  return <FileIcon className="w-5 h-5 text-quiet flex-shrink-0" strokeWidth={1.5} />;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
