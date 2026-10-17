'use client';
// Shared UI parts. OWNER: Sanjana. She restyles these to the final design.
// KEEP THE EXPORT NAMES AND PROP NAMES the same so other people's pages do not break.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ variant = 'primary', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const cls = variant === 'primary' ? 'btn' : `btn ${variant}`;
  return <button {...p} className={cls} />;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title ? <h2 style={{ marginTop: 0 }}>{title}</h2> : null}
      {children}
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
