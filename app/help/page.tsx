// Help & Support: choose your account type. OWNER: Krishna.
import Link from 'next/link';
import SimpleHeader from '@/components/footer/SimpleHeader';
import s from '@/components/footer/info.module.css';
import { HELP } from './content';
import h from './help.module.css';

export const metadata = { title: 'Help & Support · Crewmate' };

export default function Help() {
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />
      <section className={s.hero}>
        <p className={s.eyebrow}>Help &amp; Support</p>
        <h1>How do you use Crewmate?</h1>
        <p className={s.lead}>Choose your account type to see help written for you.</p>
      </section>
      <ul className={h.choose}>
        {(['freelancer', 'client'] as const).map((r) => (
          <li key={r}>
            <Link href={`/help/${r}`} className={h.choice}>
              <strong>{r === 'client' ? 'Client' : 'Freelancer'}</strong>
              <span>{HELP[r].intro}</span>
              <em>See {r} help →</em>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
