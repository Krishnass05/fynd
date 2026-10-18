// About Us: mission, vision, values and the founding team. OWNER: Krishna.
// Team names, bios and photos come from lib/site.ts and stay "to be added" until the team supplies them.
import SimpleHeader from '@/components/footer/SimpleHeader';
import { TEAM, type TeamMember } from '@/lib/site';
import s from '@/components/footer/info.module.css';
import t from './about.module.css';

export const metadata = { title: 'About us · Crewmate' };

const VALUES = [
  { title: 'Clarity first', text: 'Scope, price and deadline are written down before work starts, so nobody is surprised later.' },
  { title: 'Fair to both sides', text: 'Freelancers are paid for extra work; clients only pay for what they agreed to.' },
  { title: 'Trust on the platform', text: 'Conversations, files, approvals and payments stay in one place, with a record of every decision.' },
  { title: 'Honest by default', text: 'We label assumptions as assumptions and never present a guess as a fact.' },
];

// Placeholder circle: the person's initials, or the role (CEO, CTO ...; DO, DMG for the directors) until a photo is added
const initials = (m: TeamMember) => {
  if (!m.name && /^[A-Z]{2,4}$/.test(m.role)) return m.role;
  return (m.name ?? m.role).split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 3).join('');
};

export default function About() {
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />

      <section className={s.hero}>
        <p className={s.eyebrow}>About Crewmate</p>
        <h1>Great work starts with the right connection</h1>
        <p className={s.lead}>Crewmate is a freelance marketplace built around one everyday problem: small extra requests that pile up unpaid. We help clients and freelancers agree on scope, price every change before the work starts, and keep the whole project in one place.</p>
      </section>

      <section className={s.section} aria-labelledby="mv">
        <h2 id="mv" className={t.sr}>Mission and vision</h2>
        <div className={s.grid3}>
          <div className={s.box}>
            <h3>Our mission</h3>
            <p>Make every freelance project clear from day one: what is included, what it costs, and how changes are agreed.</p>
          </div>
          <div className={s.box}>
            <h3>Our vision</h3>
            <p>A marketplace where small agencies and independent professionals never do unpaid work, and clients never get surprise bills.</p>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="values">
        <h2 id="values">What we value</h2>
        <p className={t.center}>The principles behind every feature on Crewmate.</p>
        <div className={s.grid3}>
          {VALUES.map((v) => <div key={v.title} className={s.box}><h3>{v.title}</h3><p>{v.text}</p></div>)}
        </div>
      </section>

      <section className={s.section} aria-labelledby="team">
        <h2 id="team">The founding team</h2>
        <p className={`${t.center}`}>Six founding roles. These are proposed roles for the venture, not verified appointments.</p>
        <ul className={t.team}>
          {TEAM.map((m) => (
            <li key={m.role} className={t.card}>
              <div className={t.photo}>
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={`${m.name ?? m.title}, ${m.title} of Crewmate`} width={400} height={400} loading="lazy" />
                ) : (
                  <span aria-hidden="true">{initials(m)}</span>
                )}
              </div>
              <div className={t.body}>
                <p className={t.role}>{m.title}</p>
                <h3 className={m.name ? undefined : t.pending}>{m.name ?? 'Name to be added'}</h3>
                <p>{m.bio ?? m.focus}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className={s.note}>Crewmate is a hackathon project (Fynd × NMIMS Hyderabad, case C35). All marketplace data is synthetic.</p>
    </main>
  );
}
