'use client';
// Upload a SOW (.txt or .md) as the signed baseline or as an amendment. OWNER: Krishna.
// Props: projectId, kind, onDone(result). Reads the file in the browser and sends its text.
import { useState } from 'react';
import { uploadSow } from '@/lib/api';
import type { SowKind, UploadSowResult } from '@/lib/types';
import { Badge, ErrorMessage } from '@/components/ui';

const MAX_BYTES = 500_000;

export default function SowUpload({ projectId, kind, onDone }: { projectId: string; kind: SowKind; onDone?: (r: UploadSowResult) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadSowResult | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!/\.(txt|md)$/i.test(file.name)) return setError('Please choose a .txt or .md file (PDF reading is coming).');
    if (file.size > MAX_BYTES) return setError('That file is too large (maximum 500 KB).');
    setBusy(true);
    try {
      const text = await file.text();
      const r = await uploadSow(projectId, { kind, filename: file.name, text });
      setResult(r);
      onDone?.(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="field">
        {kind === 'baseline' ? 'Signed SOW (.txt or .md)' : 'Amended SOW (.txt or .md)'}
        <input type="file" accept=".txt,.md" onChange={onFile} disabled={busy} />
      </label>
      {busy ? <p className="muted">Reading and comparing...</p> : null}
      <ErrorMessage message={error} />
      {result?.compare ? (
        <div>
          <p className="muted">Compared version {result.compare.toVersion} with the signed version {result.compare.fromVersion}:</p>
          <ul>
            {result.compare.items.map((i, n) => (
              <li key={n}>
                <Badge tone={i.label === 'unchanged' ? 'neutral' : i.label === 'removed' ? 'warn' : 'bad'}>{i.label.replace('_', ' ')}</Badge> {i.text}
                {i.hours !== null ? ` (${i.hours}h)` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
