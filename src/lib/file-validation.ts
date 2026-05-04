/**
 * Magic-Bytes-Validation für Uploads — verhindert MIME-Spoofing.
 *
 * Wird von Galerie/Cover/Datenraum-Uploads genutzt, damit ein File
 * mit fakedem Content-Type (z.B. exe als image/png) erkannt wird.
 */

export type FileSignatureKind = 'png' | 'jpeg' | 'webp' | 'pdf' | 'xlsx' | 'docx' | 'doc' | 'xls';

const SIGS: Record<FileSignatureKind, (b: Uint8Array) => boolean> = {
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  pdf: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  // xlsx/docx sind ZIP-Container — Signatur PK\x03\x04
  xlsx: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  docx: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  // Legacy-Office: D0 CF 11 E0 (CFB-Header)
  doc: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  xls: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
};

const MIME_TO_KINDS: Record<string, FileSignatureKind[]> = {
  'image/png': ['png'],
  'image/jpeg': ['jpeg'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/msword': ['doc'],
};

/**
 * Prüft ob die ersten ~12 Bytes zur erwarteten MIME passen.
 * Buffer kann ArrayBuffer, Buffer oder Uint8Array sein.
 */
export function validateFileSignature(buf: ArrayBuffer | Uint8Array, mime: string): boolean {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (bytes.length < 4) return false;
  const head = bytes.slice(0, 12);
  const allowedKinds = MIME_TO_KINDS[mime];
  if (!allowedKinds) return false;
  return allowedKinds.some((k) => SIGS[k](head));
}
