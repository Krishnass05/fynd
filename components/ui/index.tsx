'use client';
// Shared UI parts. OWNER: Sanjana. She restyles these to the final design.
// KEEP THE EXPORT NAMES AND PROP NAMES the same so other people's pages do not break.
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'dark';
const btnClass = (variant: Variant, extra?: string) => ['btn', variant === 'primary' ? '' : variant, extra].filter(Boolean).join(' ');

export function Button({ variant = 'primary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...p} className={btnClass(variant, className)} />;
}

// A link that looks like a button (for "Open", "View" and other navigation).
export function ButtonLink({ href, variant = 'dark', children }: { href: string; variant?: Variant; children: ReactNode }) {
  return <Link href={href} className={btnClass(variant)}>{children}</Link>;
}

export type CardTone = 'pink' | 'blue' | 'yellow' | 'green';
const TONES: CardTone[] = ['pink', 'blue', 'yellow', 'green'];

// Pick a stable colour from the title so the same card is always the same colour.
export function toneFor(seed: string): CardTone {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export function ProgressBar({ value, label = 'Progress' }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="pcard-progress">
      <div className="pcard-progress-head"><span>{label}</span><strong>{pct}%</strong></div>
      <div className="pcard-track" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="pcard-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// A row of small facts, each with an icon: <Meta items={[{ icon: <ListChecks />, text: '3 change orders' }]} />
export function Meta({ items }: { items: Array<{ icon?: ReactNode; text: string }> }) {
  return (
    <div className="pcard-meta">
      {items.map((m, i) => (
        <span key={i}>{m.icon}{m.text}</span>
      ))}
    </div>
  );
}

// The card used across the app: a soft coloured panel, with an optional footer strip underneath.
//   title, children       the content (all that older pages pass)
//   badge                 small pill label at the top left
//   icon                  large decorative icon at the top right
//   progress              { value: 0-100, label? } draws a progress bar
//   footer                shown on a white strip (usually a label and a ButtonLink)
//   tone                  pink | blue | yellow | green (picked from the title when left out)
//   plain                 old flat white card, for dense content such as long forms
export function Card({ title, children, badge, icon, progress, footer, tone, plain }: {
  title?: string;
  children?: ReactNode;
  badge?: string;
  icon?: ReactNode;
  progress?: { value: number; label?: string };
  footer?: ReactNode;
  tone?: CardTone;
  plain?: boolean;
}) {
  if (plain) {
    return (
      <section className="card">
        {title ? <h2 style={{ marginTop: 0 }}>{title}</h2> : null}
        {children}
      </section>
    );
  }
  return (
    <section className="pcard" data-tone={tone ?? toneFor(title ?? badge ?? '')}>
      <div className={`pcard-panel${icon ? ' has-art' : ''}`}>
        {badge ? <span className="pcard-pill">{badge}</span> : null}
        {icon ? <div className="pcard-art" aria-hidden="true">{icon}</div> : null}
        {title ? <h2 className="pcard-title">{title}</h2> : null}
        {children ? <div className="pcard-body">{children}</div> : null}
        {progress ? <ProgressBar value={progress.value} label={progress.label} /> : null}
      </div>
      {footer ? <div className="pcard-footer">{footer}</div> : null}
    </section>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'bad' | 'warn'; children: ReactNode }) {
  return <span className={tone === 'neutral' ? 'badge' : `badge ${tone}`}>{children}</span>;
}

export function ErrorMessage({ message }: { message: string | null }) {
  return message ? <div className="alert" role="alert">{message}</div> : null;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Spinner() {
  return <p className="muted" aria-live="polite">Loading...</p>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field">{label}{children}</label>;
}

export function money(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
