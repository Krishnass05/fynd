// The page for an address that does not exist. OWNER: Krishna.
import Link from 'next/link';
import SimpleHeader from '@/components/footer/SimpleHeader';
import s from '@/components/footer/info.module.css';

export const metadata = { title: 'Page not found · Crewmate' };

export default function NotFound() {
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />
      <section className={s.hero}>
        <p className={s.eyebrow}>Error 404</p>
        <h1>We could not find that page</h1>
        <p className={s.lead}>The address may be mistyped, or the page may have moved.</p>
        <p style={{ marginTop: 20 }}><Link href="/" className="btn">Go to the home page</Link></p>
      </section>
    </main>
  );
}
