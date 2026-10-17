'use client';
// Amendment SOW upload with file type/size validation and comparison diff display. OWNER: Harini.
import { useState } from 'react';
import { uploadSow } from '@/lib/api';
import type { CompareItem, UploadSowResult } from '@/lib/types';
import { Badge, Button, ErrorMessage, Spinner } from '@/components/ui';
import styles from './project.module.css';

const MAX_BYTES = 500_000; // 500 KB limit
const ALLOWED_EXTS = ['.txt', '.md', '.pdf'];

export interface AmendmentUploadProps {
  projectId: string;
  onDone: (result: UploadSowResult) => void;
}

// Client-side text extraction helper for PDF files
async function readPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('latin1');
  const raw = textDecoder.decode(bytes);

  const lines: string[] = [];
  // Extract text in PDF parentheses operators: (Text) Tj
  const tjRegex = /\(([^)\r\n]*)\)\s*Tj/g;
  let m;
  while ((m = tjRegex.exec(raw)) !== null) {
    const val = m[1].replace(/\\([()\\])/g, '$1').trim();
    if (val) lines.push(val);
  }

  // Extract text in PDF array operators: [(T) 10 (ext)] TJ
  const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
  while ((m = tjArrayRegex.exec(raw)) !== null) {
    const inner = m[1];
    const subRegex = /\(([^)\r\n]*)\)/g;
    let sm;
    const parts: string[] = [];
    while ((sm = subRegex.exec(inner)) !== null) {
      parts.push(sm[1].replace(/\\([()\\])/g, '$1'));
    }
    const combined = parts.join('').trim();
    if (combined) lines.push(combined);
  }

  // If uncompressed extraction found headings or bullet items, return them
  if (lines.length > 0 && lines.some((l) => /deliverables?|included|excluded|scope/i.test(l))) {
    return lines.join('\n');
  }

  // Attempt DecompressionStream for FlateDecode streams if available in modern browsers
  if (typeof DecompressionStream !== 'undefined') {
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let sMatch;
    const decompressedLines: string[] = [];
    while ((sMatch = streamRegex.exec(raw)) !== null) {
      try {
        const streamStart = sMatch.index + sMatch[0].indexOf('\n') + 1;
        const streamEnd = sMatch.index + sMatch[0].lastIndexOf('endstream');
        const streamBytes = bytes.subarray(streamStart, streamEnd);
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(streamBytes);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) done = true;
          else if (res.value) chunks.push(res.value);
        }
        const total = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const streamText = new TextDecoder('utf-8').decode(merged);
        let tm;
        while ((tm = tjRegex.exec(streamText)) !== null) {
          const val = tm[1].replace(/\\([()\\])/g, '$1').trim();
          if (val) decompressedLines.push(val);
        }
      } catch {
        // Stream decompression failed or stream not deflate; continue
      }
    }
    if (decompressedLines.length > 0) return decompressedLines.join('\n');
  }

  if (lines.length > 0) return lines.join('\n');
  throw new Error('Could not extract readable text from this PDF. Please ensure it contains selectable text, or use .txt / .md format.');
}

export default function AmendmentUpload({ projectId, onDone }: AmendmentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadSowResult | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');

  async function processText(filename: string, text: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await uploadSow(projectId, {
        kind: 'amendment',
        filename,
        text,
      });
      setResult(res);
      onDone(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Amendment upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);

    // Rule 1: Validate file extension
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setError(`Invalid file type "${file.name}". Only PDF (.pdf), Plain Text (.txt), and Markdown (.md) SOW files are accepted.`);
      return;
    }

    // Rule 2: Validate file size
    if (file.size > MAX_BYTES) {
      const kb = (file.size / 1024).toFixed(1);
      setError(`File is too large (${kb} KB). Maximum allowed file size limit is 500 KB.`);
      return;
    }

    setBusy(true);
    try {
      let content = '';
      if (lowerName.endsWith('.pdf')) {
        content = await readPdfText(file);
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        setError('The selected file appears to be empty. Please check the file contents and try again.');
        setBusy(false);
        return;
      }

      await processText(file.name, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file.');
      setBusy(false);
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pastedText.trim()) return;
    await processText('amendment-pasted.txt', pastedText);
    setPastedText('');
    setPasting(false);
  }

  const getTone = (label: CompareItem['label']): 'good' | 'bad' | 'warn' | 'neutral' => {
    switch (label) {
      case 'unchanged':
        return 'neutral';
      case 'removed':
        return 'warn';
      case 'changed':
        return 'warn';
      case 'previously_excluded':
        return 'bad';
      case 'new':
        return 'warn';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={styles.uploadSection}>
      <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>Upload an Amended Statement of Work (SOW)</h3>
      <p className="muted" style={{ margin: '0 0 14px' }}>
        When scope requirements change, upload an amended SOW (.pdf, .txt, or .md). The rules engine will compare it
        with the baseline, identify extra deliverables, and calculate pre-tax change order pricing.
      </p>

      <ErrorMessage message={error} />

      <div className={styles.dropZone} onClick={() => document.getElementById('amendment-file-input')?.click()}>
        <span className={styles.dropZoneIcon} aria-hidden="true">[SOW]</span>
        <div>
          <label htmlFor="amendment-file-input" className={styles.fileInputLabel}>
            Click to browse or drop an amended SOW
          </label>
          <input
            id="amendment-file-input"
            type="file"
            accept=".txt,.md,.pdf"
            onChange={handleFile}
            disabled={busy}
            className={styles.fileInputHidden}
          />
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          Supported: <strong>.pdf</strong>, <strong>.txt</strong>, <strong>.md</strong> • Max 500 KB
        </p>
      </div>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button
          type="button"
          onClick={() => setPasting(!pasting)}
          style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
        >
          {pasting ? 'Hide manual text input' : 'Or paste SOW amendment text directly'}
        </button>
      </div>

      {pasting ? (
        <form onSubmit={handlePasteSubmit} style={{ marginTop: 12 }}>
          <label className="field">
            Amended SOW Text
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the amended SOW text with headings (Deliverables, Included, Excluded) and bullet points..."
              style={{ marginTop: 6 }}
            />
          </label>
          <Button type="submit" disabled={busy || !pastedText.trim()}>
            {busy ? 'Comparing...' : 'Compare Pasted SOW'}
          </Button>
        </form>
      ) : null}

      {busy ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spinner />
          <p className="muted" style={{ marginTop: 6 }}>Comparing against signed baseline SOW and pricing changes...</p>
        </div>
      ) : null}

      {result?.compare ? (
        <div className={styles.comparisonBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 className={styles.comparisonTitle} style={{ margin: 0 }}>
              SOW Comparison Result: Version {result.compare.toVersion} vs Baseline Version {result.compare.fromVersion}
            </h4>
            <Badge tone="good">Comparison Complete</Badge>
          </div>

          <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
            Found {result.compare.items.length} total items in amended SOW. Created {result.compare.changeRequestIds.length} new change order(s) for client review.
          </p>

          <ul className={styles.comparisonList}>
            {result.compare.items.map((item, idx) => (
              <li key={idx} className={styles.comparisonItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Badge tone={getTone(item.label)}>
                    {item.label === 'previously_excluded' ? 'previously excluded' : item.label}
                  </Badge>
                  <span style={{ fontWeight: item.label !== 'unchanged' ? 600 : 400 }}>
                    {item.text}
                  </span>
                </div>
                <span className="muted" style={{ fontWeight: 600 }}>
                  {item.hours !== null ? `${item.hours}h` : <span className={styles.hoursUnknown}>unknown</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
