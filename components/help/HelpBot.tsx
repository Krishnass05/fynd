'use client';
// Help assistant: a small chat on the left of the screen that answers questions from clients and freelancers
// about how this site works. With an AI key set, a model writes each reply but only from the written guide
// (lib/engine/helpbot.js); without one, or if the model is down, the keyword answer from the same guide is used.
// The panel says which one is answering. OWNER: Krishna.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { askHelp, getAiStatus } from '@/lib/api';
import { answer, answerFor } from '@/lib/engine/helpbot';
import type { BotLink, BotTopic } from '@/lib/engine/helpbot';

interface Turn { id: number; from: 'you' | 'bot'; text: string; links?: BotLink[]; topics?: BotTopic[]; ai?: boolean }

export default function HelpBot({ role }: { role?: 'client' | 'freelancer' }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [aiOn, setAiOn] = useState<{ enabled: boolean; provider: string | null } | null>(null);
  useEffect(() => { void getAiStatus().then(setAiOn).catch(() => undefined); }, []);
  const n = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = (t: Omit<Turn, 'id'>) => setTurns((all) => [...all, { ...t, id: (n.current += 1) }]);

  useEffect(() => {
    if (open && turns.length === 0) {
      const r = answer('hello', role); // the greeting and topic buttons are fixed, so they need no model
      add({ from: 'bot', text: r.text, topics: r.topics });
    }
    if (open) input.current?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [turns, thinking]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const ask = async (q: string) => {
    if (!q.trim() || thinking) return;
    add({ from: 'you', text: q.trim() });
    setText('');
    setThinking(true);
    try {
      const r = await askHelp(q.trim(), role);
      add({ from: 'bot', text: r.text, links: r.links, topics: r.topics, ai: r.source === 'ai' });
    } catch {
      // the server is not reachable: the keyword answer works in the browser too
      const r = answer(q, role);
      add({ from: 'bot', text: r.text, links: r.links, topics: r.topics });
    } finally {
      setThinking(false);
    }
  };
  const pickTopic = (t: BotTopic) => {
    add({ from: 'you', text: t.title });
    const r = answerFor(t.id);
    if (r) add({ from: 'bot', text: r.text, links: r.links, topics: [] });
  };

  return (
    <div className="helpbot">
      {open ? (
        <section className="helpbot-panel" role="dialog" aria-label="Help assistant">
          <header className="helpbot-head">
            <div>
              <strong>Help assistant</strong>
              <span>{aiOn?.enabled ? `AI assistant (${aiOn.provider}). Answers only from the site guide.` : 'Answers from the site guide. Not an AI model.'}</span>
            </div>
            <button type="button" className="helpbot-x" aria-label="Close help" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div className="helpbot-log" ref={log} aria-live="polite">
            {turns.map((t) => (
              <div key={t.id} className="helpbot-turn" data-from={t.from}>
                <p>{t.text}</p>
                {t.links?.length ? (
                  <p className="helpbot-links">{t.links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}</p>
                ) : null}
                {t.topics?.length ? (
                  <div className="helpbot-topics">{t.topics.map((tp) => <button key={tp.id} type="button" onClick={() => pickTopic(tp)}>{tp.title}</button>)}</div>
                ) : null}
              </div>
            ))}
            {thinking ? <div className="helpbot-turn" data-from="bot"><p>Thinking...</p></div> : null}
          </div>
          <form className="helpbot-form" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question..." aria-label="Ask a question" maxLength={300} />
            <button type="submit" className="btn" disabled={!text.trim() || thinking}>Ask</button>
          </form>
        </section>
      ) : null}
      <button type="button" className="helpbot-fab btn dark" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Close help' : 'Help'}
      </button>
    </div>
  );
}
