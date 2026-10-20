// Terms & Conditions (draft for review). OWNER: Krishna.
// Plain-language draft written for the hackathon demo. It has NOT been reviewed by a lawyer.
import Link from 'next/link';
import SimpleHeader from '@/components/footer/SimpleHeader';
import s from '@/components/footer/info.module.css';
import t from './terms.module.css';

export const metadata = { title: 'Terms & Conditions · Crewmate' };

const SECTIONS: Array<{ id: string; title: string; points: string[] }> = [
  { id: 'about', title: '1. About these terms', points: [
    'Crewmate is a hackathon demo (Fynd × NMIMS Hyderabad, case C35). By creating an account you agree to these terms.',
    'This is a draft for review. It has not been reviewed by a lawyer and is not legal advice.',
    'Crewmate is a workflow aid. An approval on Crewmate is a record of what was agreed, not a signed legal contract.',
  ] },
  { id: 'accounts', title: '2. Your account', points: [
    'Give accurate details and keep your password private. You are responsible for what happens under your account.',
    'One account can have a client side, a freelancer side, or both.',
    'Your password is stored only as a salted hash. Five wrong passwords lock sign-in for 10 minutes.',
    'Your account data is stored in our database (Supabase) for the demo and may be reset.',
  ] },
  { id: 'working', title: '3. Clients and freelancers working together', points: [
    'Clients and freelancers agree the scope in a Statement of Work (SOW). The client uploads it; the freelancer reviews it; both confirm the hours before it is signed.',
    'Extra requests are priced and agreed by both sides before the work starts. Nothing joins the work list or the price until both sides agree.',
    'Keep conversations, files and agreements on the platform. Chat and calls hide phone numbers, email addresses, links and social handles, and a call that shares them is ended.',
    'Where an AI model is switched on, the text of messages and spoken lines is also sent to that provider for a second check.',
  ] },
  { id: 'payments', title: '4. Payments', points: [
    'No money moves through the site in this demo. Milestones, quotes and approvals are records only.',
    'Prices on the pricing page are proposals being tested, before GST. No plan is charged.',
  ] },
  { id: 'prohibited', title: '5. Things you must not do', points: [
    'Use false identities, post illegal or harmful content, harass other users, or try to move work or payments off the platform to avoid its records.',
    'Try to break, overload or get around the security of the site, or access other people’s data.',
  ] },
  { id: 'ip', title: '6. Your work and content', points: [
    'You keep ownership of what you upload. You let Crewmate store and show it to the people in your project so the service works.',
    'Who owns the work produced in a project is for the client and freelancer to agree in their SOW.',
  ] },
  { id: 'termination', title: '7. Ending your use', points: [
    'You can stop using Crewmate at any time. We may suspend accounts that break these terms.',
    'As a demo, the site and its data may be reset or taken offline without notice.',
  ] },
  { id: 'liability', title: '8. Limits', points: [
    'The site is provided as is, for demonstration. People, companies, prices, ratings and reviews shown are made up; do not rely on them.',
    'Crewmate is not a party to the agreements between clients and freelancers.',
  ] },
];

export default function Terms() {
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />
      <section className={s.hero}>
        <p className={s.eyebrow}>Legal</p>
        <h1>Terms &amp; Conditions</h1>
        <p className={s.lead}>Draft for review, written in plain language for the demo. Not reviewed by a lawyer.</p>
      </section>
      <div className={t.body}>
        <nav className={t.toc} aria-label="On this page">
          <ol>{SECTIONS.map((x) => <li key={x.id}><a href={`#${x.id}`}>{x.title.replace(/^\d+\.\s/, '')}</a></li>)}</ol>
        </nav>
        <div>
          {SECTIONS.map((x) => (
            <section key={x.id} id={x.id} className={t.section}>
              <h2>{x.title}</h2>
              <ul>{x.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          ))}
          <p className={t.foot}>Questions about these terms? <Link href="/contact">Contact us</Link>. Back to <Link href="/register">sign up</Link>.</p>
        </div>
      </div>
    </main>
  );
}
