// Help for one account type (/help/client or /help/freelancer). OWNER: Krishna.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SimpleHeader from '@/components/footer/SimpleHeader';
import s from '@/components/footer/info.module.css';
import { HELP, type HelpRole } from '../content';
import h from '../help.module.css';

export const generateStaticParams = () => [{ role: 'client' }, { role: 'freelancer' }];
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  return { title: `${role === 'client' ? 'Client' : 'Freelancer'} help · Crewmate` };
}

export default async function RoleHelp({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role !== 'client' && role !== 'freelancer') notFound();
  const c = HELP[role as HelpRole];
  const other = role === 'client' ? 'freelancer' : 'client';
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />
      <section className={s.hero}>
        <p className={s.eyebrow}>Help &amp; Support</p>
        <h1>{c.title}</h1>
        <p className={s.lead}>{c.intro}</p>
      </section>
      <div className={h.list}>
        {c.topics.map((t) => (
          <details key={t.q} className={h.item}>
            <summary>{t.q}</summary>
            <p>{t.a}</p>
          </details>
        ))}
      </div>
      <p className={h.more}>
        <Link href={c.start.href} className="btn">{c.start.label}</Link>
        <Link href="/contact" className="btn secondary">Contact support</Link>
        <Link href={`/help/${other}`}>Help for {other}s →</Link>
      </p>
    </main>
  );
}
