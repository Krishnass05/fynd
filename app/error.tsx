'use client';
// Shown if something unexpected breaks while a page is drawing, instead of a blank screen. OWNER: Krishna.
import Link from 'next/link';
import s from '@/components/footer/info.module.css';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className={s.wrap}>
      <section className={s.hero}>
        <p className={s.eyebrow}>Something went wrong</p>
        <h1>This page hit a problem</h1>
        <p className={s.lead}>Nothing you did was lost. Try again, or go back to the home page.</p>
        <p style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn secondary">Home page</Link>
        </p>
      </section>
    </main>
  );
}
