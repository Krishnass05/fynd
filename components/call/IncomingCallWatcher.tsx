'use client';
// Incoming-call pop-up on every signed-in page, with a ringtone. OWNER: Krishna.
// Checks every few seconds whether the other person in any of your projects is calling you. If so (and you are not
// already on that project's page, where the call box rings itself), a pop-up shows who is calling with Answer and
// Decline, and the ringtone plays. Answer opens the project and takes the call. If the tab is in the background
// and you allowed notifications, a system notification shows too.
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getIncomingCalls, sendCallSignal } from '@/lib/api';
import type { IncomingCall } from '@/lib/types';
import { startRingtone } from './ringtone';
import s from './incoming.module.css';

export default function IncomingCallWatcher() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const dismissed = useRef<string | null>(null); // the call (projectId + start time) the person declined or closed
  const notified = useRef<string | null>(null);

  useEffect(() => { if (typeof Notification !== 'undefined') setPerm(Notification.permission); }, []);

  // Poll for calls ringing for me.
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const list = await getIncomingCalls();
        const next = list.find((c) => `${c.projectId}@${c.startedAt}` !== dismissed.current && !(pathname === c.href || pathname.startsWith(`${c.href}/`))) ?? null;
        if (alive) setCall(next);
      } catch { /* try again next time */ }
    }
    void tick();
    const t = window.setInterval(() => void tick(), 3000);
    return () => { alive = false; window.clearInterval(t); };
  }, [pathname]);

  const key = call ? `${call.projectId}@${call.startedAt}` : null;

  // Ring while the pop-up is up; a system notification if the tab is hidden.
  useEffect(() => {
    if (!call || !key) return;
    const stop = startRingtone();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden && notified.current !== key) {
      notified.current = key;
      const n = new Notification(`${call.fromName} is calling you`, { body: `${call.mode === 'video' ? 'Video' : 'Voice'} call about ${call.projectTitle}`, tag: key });
      n.onclick = () => { window.focus(); router.push(`${call.href}?answer=1`); n.close(); };
    }
    return stop;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!call) return null;

  const answer = () => { dismissed.current = key; setCall(null); router.push(`${call.href}?answer=1`); };
  const decline = () => { dismissed.current = key; setCall(null); void sendCallSignal(call.projectId, { type: 'reject' }).catch(() => undefined); };
  const allow = () => { void Notification.requestPermission().then(setPerm).catch(() => undefined); };

  return (
    <div className={s.popup} role="alertdialog" aria-live="assertive" aria-labelledby="incoming-title" aria-describedby="incoming-desc">
      <div className={s.pulse} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {call.mode === 'video'
            ? <><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>
            : <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />}
        </svg>
      </div>
      <div className={s.body}>
        <p id="incoming-title" className={s.title}>{call.fromName} is calling you</p>
        <p id="incoming-desc" className={s.desc}>{call.mode === 'video' ? 'Video' : 'Voice'} call · {call.projectTitle}</p>
        <div className={s.actions}>
          <button type="button" className={`btn ${s.answer}`} onClick={answer}>Answer</button>
          <button type="button" className={`btn danger ${s.decline}`} onClick={decline}>Decline</button>
        </div>
        {perm === 'default' ? <button type="button" className={s.allow} onClick={allow}>Also alert me when Crewmate is in another tab</button> : null}
      </div>
    </div>
  );
}
