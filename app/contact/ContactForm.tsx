'use client';
// The support form. It validates what was typed. It does NOT send anything yet (no support inbox exists), and says
// so after a valid submit instead of pretending it was delivered. OWNER: Krishna.
import { useState } from 'react';
import Link from 'next/link';
import s from './contact.module.css';

type Errors = Partial<Record<'name' | 'email' | 'account' | 'topic' | 'message', string>>;

export default function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', account: '', topic: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [checked, setChecked] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setF({ ...f, [k]: e.target.value }); setChecked(false); };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errors = {};
    if (f.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = 'Enter a valid email address';
    if (!f.account) er.account = 'Choose your account type';
    if (!f.topic) er.topic = 'Choose a topic';
    if (f.message.trim().length < 10) er.message = 'Tell us a little more (at least 10 characters)';
    setErrors(er);
    setChecked(Object.keys(er).length === 0);
  }

  const field = (k: keyof Errors) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });
  const err = (k: keyof Errors) => (errors[k] ? <span id={`${k}-err`} className={s.err}>{errors[k]}</span> : null);

  return (
    <div className={s.layout}>
      <form className={s.form} onSubmit={submit} noValidate aria-label="Contact customer support">
        <div className={s.row}>
          <label className={s.field}>Your name<input value={f.name} onChange={set('name')} autoComplete="name" {...field('name')} />{err('name')}</label>
          <label className={s.field}>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" {...field('email')} />{err('email')}</label>
        </div>
        <div className={s.row}>
          <label className={s.field}>I use Crewmate as a
            <select value={f.account} onChange={set('account')} {...field('account')}>
              <option value="">Choose…</option><option value="client">Client</option><option value="freelancer">Freelancer</option>
            </select>{err('account')}
          </label>
          <label className={s.field}>Topic
            <select value={f.topic} onChange={set('topic')} {...field('topic')}>
              <option value="">Choose…</option><option>My account or login</option><option>A project or job</option><option>SOW, quotes or change requests</option><option>Something else</option>
            </select>{err('topic')}
          </label>
        </div>
        <label className={s.field}>How can we help?<textarea rows={5} value={f.message} onChange={set('message')} maxLength={2000} {...field('message')} />{err('message')}</label>
        <button type="submit" className="btn">Check and send</button>
        {checked ? (
          <p className={s.notice} role="status">
            <strong>Your message looks complete, but it was not sent.</strong> The support inbox is not connected yet in this hackathon demo. Please ask the help assistant (bottom left), or see the <Link href="/help/client">client</Link> and <Link href="/help/freelancer">freelancer</Link> help pages.
          </p>
        ) : null}
      </form>

      <aside className={s.side} aria-label="Other ways to get help">
        <div className={s.card}>
          <h2>Help assistant</h2>
          <p>Ask how to post a job, upload a SOW, quote a new request or post a check-in. Open it with the Help button at the bottom left.</p>
        </div>
        <div className={s.card}>
          <h2>Help by account type</h2>
          <p><Link href="/help/client">Client help</Link> · <Link href="/help/freelancer">Freelancer help</Link></p>
        </div>
      </aside>
    </div>
  );
}
